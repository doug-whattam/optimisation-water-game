"""Server-side cost calculation and validation."""

from app.config import BUDGET
from app.services.grid_config import (
    ASSET_COSTS,
    VALID_ASSET_TYPES,
    VALID_ROTATIONS,
    VALID_COLUMNS,
    VALID_ROWS,
    RESERVED_CELLS,
    get_cell_installation_cost,
)


def validate_design(grid_state: list[dict]) -> tuple[bool, dict]:
    """
    Validate a network design and compute costs server-side.

    Returns:
        (is_valid, result_dict) where result_dict contains either
        cost breakdown or error details.
    """
    if not grid_state:
        return False, {"error": "Network design is empty"}

    seen_cells: set[tuple[int, str]] = set()
    asset_cost = 0
    installation_cost = 0

    for asset in grid_state:
        row = asset.get("row")
        col = asset.get("col")
        asset_type = asset.get("asset_type")
        rotation = asset.get("rotation_degrees", 0)

        # Validate asset type
        if asset_type not in VALID_ASSET_TYPES:
            return False, {"error": f"Invalid asset type: {asset_type}"}

        # Validate rotation
        if rotation not in VALID_ROTATIONS:
            return False, {"error": f"Invalid rotation: {rotation}"}

        # Validate grid bounds
        if col not in VALID_COLUMNS or row not in VALID_ROWS:
            return False, {"error": f"Cell ({col}{row}) is out of grid bounds"}

        # Check reserved cells
        if (row, col) in RESERVED_CELLS:
            return False, {"error": f"Cannot place asset at reserved cell ({col}{row})"}

        # Check duplicates
        if (row, col) in seen_cells:
            return False, {"error": f"Duplicate asset placement at ({col}{row})"}
        seen_cells.add((row, col))

        # Accumulate costs
        asset_cost += ASSET_COSTS[asset_type]
        installation_cost += get_cell_installation_cost(row, col)

    total_cost = asset_cost + installation_cost

    if total_cost > BUDGET:
        return False, {"error": f"Total cost ({total_cost:,}) exceeds budget ({BUDGET:,})"}

    return True, {
        "asset_cost": asset_cost,
        "installation_cost": installation_cost,
        "total_cost": total_cost,
    }
