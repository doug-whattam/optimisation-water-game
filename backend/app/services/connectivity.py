"""Port alignment and network connectivity validation."""

from collections import deque
from enum import Enum


class Direction(str, Enum):
    NORTH = "north"
    EAST = "east"
    SOUTH = "south"
    WEST = "west"


# Base port configurations (at 0° rotation)
ASSET_PORTS: dict[str, list[Direction]] = {
    "pipe": [Direction.NORTH, Direction.SOUTH],
    "elbow": [Direction.NORTH, Direction.EAST],
    "tee": [Direction.NORTH, Direction.EAST, Direction.SOUTH],
    "cross": [Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST],
}

# Rotation maps (clockwise)
ROTATION_MAP: dict[int, dict[Direction, Direction]] = {
    0: {Direction.NORTH: Direction.NORTH, Direction.EAST: Direction.EAST,
        Direction.SOUTH: Direction.SOUTH, Direction.WEST: Direction.WEST},
    90: {Direction.NORTH: Direction.EAST, Direction.EAST: Direction.SOUTH,
         Direction.SOUTH: Direction.WEST, Direction.WEST: Direction.NORTH},
    180: {Direction.NORTH: Direction.SOUTH, Direction.EAST: Direction.WEST,
          Direction.SOUTH: Direction.NORTH, Direction.WEST: Direction.EAST},
    270: {Direction.NORTH: Direction.WEST, Direction.EAST: Direction.NORTH,
          Direction.SOUTH: Direction.EAST, Direction.WEST: Direction.SOUTH},
}

OPPOSITE: dict[Direction, Direction] = {
    Direction.NORTH: Direction.SOUTH,
    Direction.SOUTH: Direction.NORTH,
    Direction.EAST: Direction.WEST,
    Direction.WEST: Direction.EAST,
}

# Column helper
COL_TO_INDEX = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4, "F": 5}
INDEX_TO_COL = {v: k for k, v in COL_TO_INDEX.items()}


def compute_rotated_ports(asset_type: str, rotation_degrees: int) -> list[Direction]:
    """Get the port directions for an asset with the given rotation."""
    base_ports = ASSET_PORTS.get(asset_type, [])
    rotation_map = ROTATION_MAP.get(rotation_degrees, ROTATION_MAP[0])
    return [rotation_map[port] for port in base_ports]


def get_neighbor(row: int, col: str, direction: Direction) -> tuple[int, str] | None:
    """Get the neighbor cell coordinates in the given direction."""
    col_idx = COL_TO_INDEX.get(col)
    if col_idx is None:
        return None

    if direction == Direction.NORTH:
        new_row, new_col_idx = row - 1, col_idx
    elif direction == Direction.SOUTH:
        new_row, new_col_idx = row + 1, col_idx
    elif direction == Direction.EAST:
        new_row, new_col_idx = row, col_idx + 1
    elif direction == Direction.WEST:
        new_row, new_col_idx = row, col_idx - 1
    else:
        return None

    if new_row < 1 or new_row > 6 or new_col_idx < 0 or new_col_idx > 5:
        return None

    return new_row, INDEX_TO_COL[new_col_idx]


def validate_connectivity(grid_state: list[dict]) -> tuple[bool, list[str]]:
    """
    Validate that there is at least one connected path from the reservoir
    to at least one demand node.

    The reservoir (A1) has ports in all four directions (acts as a source).
    Demand nodes also accept connections from any direction.

    Returns:
        (is_connected, list_of_connected_demand_node_keys)
    """
    from app.services.grid_config import DEMAND_NODES, RESERVOIR_CELL

    # Build a map of placed assets by (row, col)
    asset_map: dict[tuple[int, str], dict] = {}
    for asset in grid_state:
        key = (asset["row"], asset["col"])
        asset_map[key] = asset

    # Reservoir is now outside the grid (row 0, col A).
    # It connects into the grid at A1 from the north.
    # So BFS starts at A1 if there's an asset there with a North port,
    # OR any cell adjacent to A1 that can be reached.
    visited: set[tuple[int, str]] = set()
    queue: deque[tuple[int, str]] = deque()

    # The reservoir connects into A1 from above (vertically).
    # Any asset placed at A1 is automatically connected to the reservoir
    # regardless of port direction.
    entry_cell = (1, "A")
    if entry_cell in asset_map:
        visited.add(entry_cell)
        queue.append(entry_cell)
    else:
        # No asset at A1 — reservoir can't connect
        return False, []

    # BFS through connected assets
    while queue:
        current = queue.popleft()
        current_asset = asset_map[current]
        current_ports = compute_rotated_ports(
            current_asset["asset_type"], current_asset.get("rotation_degrees", 0)
        )

        for direction in current_ports:
            neighbor = get_neighbor(current[0], current[1], direction)
            if neighbor is None or neighbor in visited:
                continue

            # Is the neighbor a demand node? Demand nodes accept from any direction.
            demand_node_cells = {(d["row"], d["col"]) for d in DEMAND_NODES.values()}
            if neighbor in demand_node_cells:
                visited.add(neighbor)
                continue

            # Is the neighbor a placed asset with a matching port?
            if neighbor in asset_map:
                neighbor_asset = asset_map[neighbor]
                neighbor_ports = compute_rotated_ports(
                    neighbor_asset["asset_type"], neighbor_asset.get("rotation_degrees", 0)
                )
                if OPPOSITE[direction] in neighbor_ports:
                    visited.add(neighbor)
                    queue.append(neighbor)

    # Check which demand nodes are reachable
    connected_demands = []
    for key, node in DEMAND_NODES.items():
        if (node["row"], node["col"]) in visited:
            connected_demands.append(key)

    return len(connected_demands) > 0, connected_demands
