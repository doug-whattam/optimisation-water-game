"""Pareto chart data endpoint."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import GameSession, NetworkDesign, SimulationResult, Player
from app.schemas.design import ParetoPointResponse, ParetoResponse
from app.services.pareto_service import ParetoPoint, compute_pareto_frontier

router = APIRouter(prefix="/api/sessions", tags=["pareto"])


@router.get("/{session_id}/pareto", response_model=ParetoResponse)
async def get_pareto_data(session_id: UUID, db: AsyncSession = Depends(get_db)):
    # Verify session exists
    result = await db.execute(select(GameSession).where(GameSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get all completed simulation results for this session
    result = await db.execute(
        select(NetworkDesign, SimulationResult, Player)
        .join(SimulationResult, SimulationResult.design_id == NetworkDesign.id)
        .join(Player, Player.id == NetworkDesign.player_id)
        .where(NetworkDesign.session_id == session_id)
        .where(SimulationResult.status == "completed")
    )
    rows = result.all()

    if not rows:
        return ParetoResponse(designs=[], pareto_frontier=[])

    # Build Pareto points
    points: list[ParetoPoint] = []
    for design, sim_result, player in rows:
        points.append(
            ParetoPoint(
                design_id=str(design.id),
                player_username=player.username,
                plan_number=design.plan_number,
                total_cost=float(design.total_cost),
                hydraulic_penalty=float(sim_result.hydraulic_penalty),
            )
        )

    # Compute frontier
    frontier = compute_pareto_frontier(points)

    # Build response
    designs_response = [
        ParetoPointResponse(
            design_id=UUID(p.design_id),
            player_username=p.player_username,
            plan_number=p.plan_number,
            total_cost=p.total_cost,
            hydraulic_penalty=p.hydraulic_penalty,
            is_pareto_optimal=p.is_pareto_optimal,
        )
        for p in points
    ]

    frontier_line = [
        {"total_cost": p.total_cost, "hydraulic_penalty": p.hydraulic_penalty}
        for p in frontier
    ]

    return ParetoResponse(designs=designs_response, pareto_frontier=frontier_line)
