"""Network design submission and simulation endpoints."""

import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Player, NetworkDesign, SimulationResult
from app.schemas.design import (
    DesignSubmitRequest,
    DesignResponse,
    SimulationTriggerResponse,
    SimulationResultResponse,
)
from app.services.cost_validator import validate_design
from app.services.connectivity import validate_connectivity
from app.services.network_builder import build_network
from app.services.simulation_service import run_simulation
from app.config import SIMULATION_TIMEOUT
from app.websocket.manager import manager

router = APIRouter(prefix="/api/designs", tags=["designs"])


async def get_current_player(
    authorization: str = Header(..., alias="Authorization"),
    db: AsyncSession = Depends(get_db),
) -> Player:
    """Extract and validate the player from the session token."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization[7:]
    result = await db.execute(select(Player).where(Player.session_token == token))
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=401, detail="Invalid session token")
    return player


@router.post("", response_model=DesignResponse, status_code=201)
async def submit_design(
    body: DesignSubmitRequest,
    db: AsyncSession = Depends(get_db),
    player: Player = Depends(get_current_player),
):
    # Verify player belongs to this session
    if player.session_id != body.session_id:
        raise HTTPException(status_code=403, detail="Player does not belong to this session")

    # Convert grid_state to dicts for validation
    grid_state = [asset.model_dump() for asset in body.grid_state]

    # Server-side cost validation
    is_valid, cost_result = validate_design(grid_state)
    if not is_valid:
        raise HTTPException(status_code=400, detail=cost_result["error"])

    # Get next plan number for this player
    result = await db.execute(
        select(func.coalesce(func.max(NetworkDesign.plan_number), 0))
        .where(NetworkDesign.player_id == player.id)
        .where(NetworkDesign.session_id == body.session_id)
    )
    max_plan = result.scalar()
    plan_number = max_plan + 1

    # Create design
    design = NetworkDesign(
        player_id=player.id,
        session_id=body.session_id,
        plan_number=plan_number,
        grid_state=grid_state,
        total_cost=cost_result["total_cost"],
        asset_cost=cost_result["asset_cost"],
        installation_cost=cost_result["installation_cost"],
    )
    db.add(design)
    await db.commit()
    await db.refresh(design)

    # Broadcast to session
    await manager.broadcast_to_session(
        str(body.session_id),
        {
            "type": "design_submitted",
            "data": {
                "player_username": player.username,
                "plan_number": plan_number,
                "total_cost": cost_result["total_cost"],
            },
        },
    )

    return DesignResponse(
        id=design.id,
        plan_number=plan_number,
        total_cost=cost_result["total_cost"],
        asset_cost=cost_result["asset_cost"],
        installation_cost=cost_result["installation_cost"],
        submitted_at=design.submitted_at,
    )


@router.post("/{design_id}/simulate", response_model=SimulationTriggerResponse, status_code=202)
async def trigger_simulation(
    design_id: str,
    db: AsyncSession = Depends(get_db),
    player: Player = Depends(get_current_player),
):
    # Get the design
    result = await db.execute(select(NetworkDesign).where(NetworkDesign.id == design_id))
    design = result.scalar_one_or_none()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    if design.player_id != player.id:
        raise HTTPException(status_code=403, detail="Cannot simulate another player's design")

    # Validate connectivity
    is_connected, connected_demands = validate_connectivity(design.grid_state)
    if not is_connected:
        raise HTTPException(status_code=400, detail="Network has no valid path from reservoir to any demand node")

    # Create simulation result record
    sim_result = SimulationResult(design_id=design.id, status="running")
    db.add(sim_result)
    await db.commit()
    await db.refresh(sim_result)

    # Run simulation async with timeout
    try:
        wn = build_network(design.grid_state, connected_demands)
        result_data = await asyncio.wait_for(
            run_simulation(wn, connected_demands),
            timeout=SIMULATION_TIMEOUT,
        )

        # Update result
        sim_result.status = "completed"
        sim_result.tank_levels = result_data.tank_levels
        sim_result.hydraulic_penalty = result_data.hydraulic_penalty
        sim_result.individual_penalties = result_data.individual_penalties
        sim_result.stopping_tank = result_data.stopping_tank
        sim_result.sim_duration_seconds = result_data.sim_duration_seconds
        sim_result.inp_file_content = result_data.inp_content
        sim_result.completed_at = datetime.now(timezone.utc)

        await db.commit()

        # Broadcast simulation complete
        await manager.broadcast_to_session(
            str(design.session_id),
            {
                "type": "simulation_complete",
                "data": {
                    "simulation_id": str(sim_result.id),
                    "design_id": str(design.id),
                    "player_username": player.username,
                    "plan_number": design.plan_number,
                    "total_cost": design.total_cost,
                    "hydraulic_penalty": float(result_data.hydraulic_penalty),
                    "stopping_tank": result_data.stopping_tank,
                    "tank_levels": result_data.tank_levels,
                    "individual_penalties": result_data.individual_penalties,
                },
            },
        )

    except asyncio.TimeoutError:
        sim_result.status = "failed"
        sim_result.error_message = "Simulation timed out (exceeded 30 seconds)"
        sim_result.completed_at = datetime.now(timezone.utc)
        await db.commit()
    except Exception as e:
        sim_result.status = "failed"
        sim_result.error_message = str(e)
        sim_result.completed_at = datetime.now(timezone.utc)
        await db.commit()

    return SimulationTriggerResponse(
        simulation_id=sim_result.id,
        status=sim_result.status,
    )


@router.get("/{design_id}/result", response_model=SimulationResultResponse)
async def get_simulation_result(
    design_id: str,
    db: AsyncSession = Depends(get_db),
    player: Player = Depends(get_current_player),
):
    result = await db.execute(
        select(SimulationResult).where(SimulationResult.design_id == design_id)
    )
    sim_result = result.scalar_one_or_none()
    if not sim_result:
        raise HTTPException(status_code=404, detail="Simulation result not found")

    # Get the design for cost info
    design_result = await db.execute(select(NetworkDesign).where(NetworkDesign.id == design_id))
    design = design_result.scalar_one_or_none()

    return SimulationResultResponse(
        simulation_id=sim_result.id,
        design_id=design_id,
        status=sim_result.status,
        stopping_tank=sim_result.stopping_tank,
        tank_levels=sim_result.tank_levels,
        individual_penalties=sim_result.individual_penalties,
        hydraulic_penalty=float(sim_result.hydraulic_penalty) if sim_result.hydraulic_penalty else None,
        total_cost=design.total_cost if design else 0,
        error_message=sim_result.error_message,
    )
