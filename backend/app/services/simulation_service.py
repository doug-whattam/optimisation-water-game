"""EPANET simulation execution and result extraction."""

import asyncio
from dataclasses import dataclass

import wntr

from app.config import TANK_TWL
from app.services.grid_config import DEMAND_NODES


@dataclass
class SimResult:
    """Simulation result data."""
    tank_levels: dict[str, float]
    individual_penalties: dict[str, float]
    hydraulic_penalty: float
    stopping_tank: str | None
    sim_duration_seconds: float
    inp_content: str


def _run_simulation_sync(wn: wntr.network.WaterNetworkModel, connected_demands: list[str]) -> SimResult:
    """
    Run EPANET simulation synchronously and extract results.
    Called within asyncio.to_thread for non-blocking execution.
    """
    import tempfile
    import os

    # Write .inp to a temp file and read it back for storage
    with tempfile.NamedTemporaryFile(mode='w', suffix='.inp', delete=False) as f:
        tmp_path = f.name

    try:
        wntr.network.write_inpfile(wn, tmp_path)
        with open(tmp_path, 'r') as f:
            inp_content = f.read()

        # Run simulation
        sim = wntr.sim.EpanetSimulator(wn)
        results = sim.run_sim()
    finally:
        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    # Tank node IDs
    tank_ids = {key: f"T_{key}" for key in connected_demands}

    # Find stopping timestep: when first tank reaches TWL
    stop_time = None
    stopping_tank = None

    # In WNTR results for tanks, use 'head' minus elevation to get water level.
    # Since all tank elevations are 0, head = water level above tank bottom.
    # However, WNTR EpanetSimulator stores tank levels differently:
    # Try 'pressure' first (which for tanks = hydraulic head - elevation = water level)
    tank_head = results.node["head"]

    for t in tank_head.index:
        for key, tank_id in tank_ids.items():
            if tank_id in tank_head.columns:
                # Water level = head - elevation (elevation=0, so level = head)
                level = tank_head.loc[t, tank_id]
                if level >= TANK_TWL - 0.01:
                    stop_time = t
                    stopping_tank = key
                    break
        if stop_time is not None:
            break

    # If no tank reached TWL, scale so the leading tank reaches exactly TWL.
    # This guarantees a "winner" at 5m with others proportionally behind.
    scale_factor = 1.0
    if stop_time is None:
        stop_time = tank_head.index[-1]
        # Find the highest tank level at the final timestep
        max_level = 0.0
        for key, tank_id in tank_ids.items():
            if tank_id in tank_head.columns:
                lvl = float(tank_head.loc[stop_time, tank_id])
                max_level = max(max_level, lvl)
        if max_level > 0.01:
            scale_factor = TANK_TWL / max_level
            # Determine which tank is the leader (becomes the stopping tank)
            for key, tank_id in tank_ids.items():
                if tank_id in tank_head.columns:
                    lvl = float(tank_head.loc[stop_time, tank_id])
                    if abs(lvl - max_level) < 0.001:
                        stopping_tank = key
                        break

    # Extract final levels
    tank_levels = {}
    individual_penalties = {}

    for key, tank_id in tank_ids.items():
        if tank_id in tank_head.columns:
            level = float(tank_head.loc[stop_time, tank_id]) * scale_factor
            level = min(level, TANK_TWL)  # cap at TWL
            level = max(level, 0.0)
            tank_levels[key] = round(level, 4)
            individual_penalties[key] = round(max(0, TANK_TWL - level), 4)
        else:
            tank_levels[key] = 0.0
            individual_penalties[key] = TANK_TWL

    # Demand nodes not connected get full penalty
    for key in DEMAND_NODES:
        if key not in tank_levels:
            tank_levels[key] = 0.0
            individual_penalties[key] = TANK_TWL

    total_penalty = sum(individual_penalties.values())

    return SimResult(
        tank_levels=tank_levels,
        individual_penalties=individual_penalties,
        hydraulic_penalty=round(total_penalty, 4),
        stopping_tank=stopping_tank,
        sim_duration_seconds=float(stop_time),
        inp_content=inp_content,
    )


async def run_simulation(wn: wntr.network.WaterNetworkModel, connected_demands: list[str]) -> SimResult:
    """Run simulation in a thread pool to avoid blocking the event loop."""
    return await asyncio.to_thread(_run_simulation_sync, wn, connected_demands)
