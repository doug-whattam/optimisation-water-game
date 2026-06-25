"""Pareto frontier calculation."""

from dataclasses import dataclass


@dataclass
class ParetoPoint:
    """A point on the Pareto chart."""
    design_id: str
    player_username: str
    plan_number: int
    total_cost: float
    hydraulic_penalty: float
    is_pareto_optimal: bool = False


def compute_pareto_frontier(designs: list[ParetoPoint]) -> list[ParetoPoint]:
    """
    Compute Pareto-optimal frontier from design results.

    A point is Pareto-optimal if no other point dominates it
    (no other point has both lower cost AND lower penalty).

    Algorithm: Sort by cost ascending, sweep maintaining minimum penalty.
    """
    if not designs:
        return []

    # Sort by total_cost ascending, then by penalty ascending for ties
    sorted_designs = sorted(designs, key=lambda d: (d.total_cost, d.hydraulic_penalty))

    frontier: list[ParetoPoint] = []
    min_penalty = float("inf")

    for design in sorted_designs:
        if design.hydraulic_penalty <= min_penalty:
            design.is_pareto_optimal = True
            frontier.append(design)
            min_penalty = design.hydraulic_penalty

    # Mark non-frontier designs
    frontier_ids = {d.design_id for d in frontier}
    for design in designs:
        design.is_pareto_optimal = design.design_id in frontier_ids

    return frontier
