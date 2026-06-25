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
    # Generate .inp content for storage
    import io
    inp_buffer = io.StringIO()
    wntr.network.write_inpfile(wn, inp_buffer)
    inp_content = inp_buffer.getvalue()

    # Run simulation
    sim = wntr.sim.EpanetSimulator(wn)
    results = sim.run_sim()

    # Tank node IDs
    tank_ids = {key: f"T_{key}" for key in connected_demands}

    # Find stopping timestep: when first tank reaches TWL
    stop_time = None
    stopping_tank = None

    # Get tank pressure (which for tanks = water level above tank bottom)
    # In WNTR results, tank levels are in the 'node' > 'pressure' DataFrame
    tank_pressure = results.node["pressure"]

    for t in tank_pressure.index:
        for key, tank_id in tank_ids.items():
            if tank_id in tank_pressure.columns:
                level = tank_pressure.loc[t, tank_id]
                if level >= TANK_TWL - 0.01:
                    stop_time = t
                    stopping_tank = key
                    break
        if stop_time is not None:
            break

    # If no tank reached TWL, use last timestep
    if stop_time is None:
        stop_time = tank_pressure.index[-1]

    # Extract final levels
    tank_levels = {}
    individual_penalties = {}

    for key, tank_id in tank_ids.items():
        if tank_id in tank_pressure.columns:
            level = float(tank_pressure.loc[stop_time, tank_id])
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
