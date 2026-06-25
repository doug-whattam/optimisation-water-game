"""
Static grid configuration for the game board.
Based on the game board image: 6x6 grid (columns A-F, rows 1-6).
Reservoir at A1. Demand nodes at A2, F2, A5, F6.
"""

from app.config import TANK_TWL, TANK_DIAMETER

# Land type costs in credits
LAND_TYPE_COSTS = {
    "rural": 1000,
    "suburban": 2000,
    "urban": 3500,
    "railway": 5000,
    "forest": 4500,
    "river": 6000,
    "cultural_heritage": 5500,
}

# Asset costs in credits
ASSET_COSTS = {
    "pipe": 500,
    "straight": 500,
    "elbow": 1000,
    "tee": 1500,
    "cross": 2000,
}

VALID_ASSET_TYPES = set(ASSET_COSTS.keys())
VALID_ROTATIONS = {0, 90, 180, 270}
VALID_COLUMNS = ["A", "B", "C", "D", "E", "F"]
VALID_ROWS = [1, 2, 3, 4, 5, 6]

# Demand node definitions
DEMAND_NODES = {
    "residential": {"row": 2, "col": "A", "name": "Residential", "twl": TANK_TWL, "diameter": TANK_DIAMETER},
    "hospital": {"row": 2, "col": "F", "name": "Hospital", "twl": TANK_TWL, "diameter": TANK_DIAMETER},
    "industrial": {"row": 5, "col": "A", "name": "Industrial", "twl": TANK_TWL, "diameter": TANK_DIAMETER},
    "commercial": {"row": 6, "col": "F", "name": "Commercial", "twl": TANK_TWL, "diameter": TANK_DIAMETER},
}

# Reserved cells (cannot place assets here)
RESERVOIR_CELL = {"row": 1, "col": "A"}
DEMAND_NODE_CELLS = [(d["row"], d["col"]) for d in DEMAND_NODES.values()]
RESERVED_CELLS = [(RESERVOIR_CELL["row"], RESERVOIR_CELL["col"])] + DEMAND_NODE_CELLS

# Default grid layout based on the game board image
# Each cell maps to a land type
DEFAULT_GRID_CONFIG = [
    # Row 0 (header) is labels only — grid starts at row 1
    # Row 1
    {"row": 1, "col": "A", "land_type": "reservoir", "installation_cost": 0},
    {"row": 1, "col": "B", "land_type": "rural", "installation_cost": 1000},
    {"row": 1, "col": "C", "land_type": "railway", "installation_cost": 5000},
    {"row": 1, "col": "D", "land_type": "railway", "installation_cost": 5000},
    {"row": 1, "col": "E", "land_type": "railway", "installation_cost": 5000},
    {"row": 1, "col": "F", "land_type": "railway", "installation_cost": 5000},
    # Row 2
    {"row": 2, "col": "A", "land_type": "residential_demand", "installation_cost": 0},
    {"row": 2, "col": "B", "land_type": "suburban", "installation_cost": 2000},
    {"row": 2, "col": "C", "land_type": "forest", "installation_cost": 4500},
    {"row": 2, "col": "D", "land_type": "forest", "installation_cost": 4500},
    {"row": 2, "col": "E", "land_type": "suburban", "installation_cost": 2000},
    {"row": 2, "col": "F", "land_type": "hospital_demand", "installation_cost": 0},
    # Row 3
    {"row": 3, "col": "A", "land_type": "rural", "installation_cost": 1000},
    {"row": 3, "col": "B", "land_type": "urban", "installation_cost": 3500},
    {"row": 3, "col": "C", "land_type": "forest", "installation_cost": 4500},
    {"row": 3, "col": "D", "land_type": "suburban", "installation_cost": 2000},
    {"row": 3, "col": "E", "land_type": "urban", "installation_cost": 3500},
    {"row": 3, "col": "F", "land_type": "rural", "installation_cost": 1000},
    # Row 4
    {"row": 4, "col": "A", "land_type": "river", "installation_cost": 6000},
    {"row": 4, "col": "B", "land_type": "river", "installation_cost": 6000},
    {"row": 4, "col": "C", "land_type": "river", "installation_cost": 6000},
    {"row": 4, "col": "D", "land_type": "river", "installation_cost": 6000},
    {"row": 4, "col": "E", "land_type": "river", "installation_cost": 6000},
    {"row": 4, "col": "F", "land_type": "river", "installation_cost": 6000},
    # Row 5
    {"row": 5, "col": "A", "land_type": "industrial_demand", "installation_cost": 0},
    {"row": 5, "col": "B", "land_type": "rural", "installation_cost": 1000},
    {"row": 5, "col": "C", "land_type": "cultural_heritage", "installation_cost": 5500},
    {"row": 5, "col": "D", "land_type": "rural", "installation_cost": 1000},
    {"row": 5, "col": "E", "land_type": "suburban", "installation_cost": 2000},
    {"row": 5, "col": "F", "land_type": "rural", "installation_cost": 1000},
    # Row 6
    {"row": 6, "col": "A", "land_type": "urban", "installation_cost": 3500},
    {"row": 6, "col": "B", "land_type": "suburban", "installation_cost": 2000},
    {"row": 6, "col": "C", "land_type": "cultural_heritage", "installation_cost": 5500},
    {"row": 6, "col": "D", "land_type": "urban", "installation_cost": 3500},
    {"row": 6, "col": "E", "land_type": "suburban", "installation_cost": 2000},
    {"row": 6, "col": "F", "land_type": "commercial_demand", "installation_cost": 0},
]


def get_cell_installation_cost(row: int, col: str) -> int:
    """Get installation cost for a grid cell."""
    for cell in DEFAULT_GRID_CONFIG:
        if cell["row"] == row and cell["col"] == col:
            return cell["installation_cost"]
    return 0
