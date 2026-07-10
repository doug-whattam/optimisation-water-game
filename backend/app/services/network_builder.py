"""Convert player grid design to WNTR/EPANET network model."""

import wntr
import wntr.network.controls as controls

from app.config import (
    RESERVOIR_HEAD,
    PIPE_LENGTH,
    PIPE_DIAMETER,
    PIPE_ROUGHNESS,
    SIMULATION_DURATION,
    HYDRAULIC_TIMESTEP,
    TANK_TWL,
)
from app.services.connectivity import (
    Direction,
    compute_rotated_ports,
    get_neighbor,
    OPPOSITE,
    COL_TO_INDEX,
)
from app.services.grid_config import DEMAND_NODES, RESERVOIR_CELL


# Minor loss coefficients by connector type (K-values)
# These create friction losses that differentiate shorter vs longer routes
MINOR_LOSS_COEFFICIENTS = {
    "pipe": 0.5,        # straight pipe has some friction
    "elbow": 3.0,       # elbows cause significant loss
    "tee": 2.0,         # tee branches cause moderate loss
    "cross": 4.0,       # cross has highest loss
}


def _get_minor_loss(asset_type: str) -> float:
    """Get the minor loss coefficient for a given asset type."""
    return MINOR_LOSS_COEFFICIENTS.get(asset_type, 0.5)


# Per-demand-node tank inlet bias — "rigs" the race so Residential reaches TWL first
# and the others lag roughly 1m behind. Lower resistance = fills faster.
# Residential (closest to reservoir at A2) gets the most favourable connection.
TANK_INLET_BIAS = {
    "residential": {"diameter": 0.22, "roughness": 150.0, "minor_loss": 0.0},
    "hospital":    {"diameter": 0.13, "roughness": 110.0, "minor_loss": 2.0},
    "commercial":  {"diameter": 0.13, "roughness": 110.0, "minor_loss": 2.0},
    "industrial":  {"diameter": 0.13, "roughness": 110.0, "minor_loss": 2.0},
}


def _get_tank_key_from_node(node_id: str) -> str | None:
    """Extract the demand node key from a tank node id like 'T_residential'."""
    if node_id and node_id.startswith("T_"):
        return node_id[2:]
    return None


def build_network(grid_state: list[dict], connected_demands: list[str]) -> wntr.network.WaterNetworkModel:
    """
    Build a WNTR network model from the player's grid state.

    Args:
        grid_state: List of placed asset dicts with row, col, asset_type, rotation_degrees
        connected_demands: List of demand node keys that are reachable from reservoir

    Returns:
        Configured WNTR WaterNetworkModel ready for simulation
    """
    wn = wntr.network.WaterNetworkModel()

    # Network options
    wn.options.hydraulic.headloss = "H-W"
    wn.options.hydraulic.demand_model = "DD"
    wn.options.time.duration = SIMULATION_DURATION
    wn.options.time.hydraulic_timestep = HYDRAULIC_TIMESTEP
    wn.options.time.report_timestep = HYDRAULIC_TIMESTEP

    # Coordinate helpers
    def cell_to_coords(row: int, col: str) -> tuple[float, float]:
        x = COL_TO_INDEX[col] * PIPE_LENGTH
        y = (6 - row) * PIPE_LENGTH  # row 1 = top = y=500, row 6 = bottom = y=0
        return x, y

    # --- Reservoir (positioned just outside the grid, above row 1) ---
    res_row = RESERVOIR_CELL["row"]
    res_col = RESERVOIR_CELL["col"]
    # Place reservoir slightly above the grid for coordinates
    res_x = COL_TO_INDEX[res_col] * PIPE_LENGTH
    res_y = (6 - res_row + 1) * PIPE_LENGTH
    wn.add_reservoir("R_RES", base_head=RESERVOIR_HEAD, coordinates=(res_x, res_y))

    # Add a junction at the reservoir's grid entry point (A1)
    entry_coords = cell_to_coords(1, "A")
    wn.add_junction("J_A1_entry", elevation=0.0, coordinates=entry_coords)

    # Connect reservoir to entry junction (this pipe will be controlled)
    wn.add_pipe(
        "P_reservoir_out", "R_RES", "J_A1_entry",
        length=PIPE_LENGTH, diameter=PIPE_DIAMETER, roughness=PIPE_ROUGHNESS,
    )
    # Initially close the reservoir pipe
    pipe_out = wn.get_link("P_reservoir_out")
    pipe_out.initial_status = wntr.network.LinkStatus.Closed

    # --- Tanks (demand nodes) ---
    tank_node_ids = {}
    for key in connected_demands:
        node = DEMAND_NODES[key]
        node_id = f"T_{key}"
        coords = cell_to_coords(node["row"], node["col"])
        wn.add_tank(
            node_id,
            elevation=0.0,
            init_level=0.0,
            min_level=0.0,
            max_level=node["twl"],
            diameter=node["diameter"],
            coordinates=coords,
        )
        tank_node_ids[key] = node_id

    # --- Junction nodes (one per placed asset) ---
    asset_map: dict[tuple[int, str], dict] = {}
    for asset in grid_state:
        key = (asset["row"], asset["col"])
        asset_map[key] = asset
        node_id = f"J_{asset['col']}{asset['row']}"
        coords = cell_to_coords(asset["row"], asset["col"])
        wn.add_junction(node_id, elevation=0.0, coordinates=coords)

    # --- Pipe links ---
    pipe_count = 0
    created_links: set[frozenset] = set()

    # Helper to get node ID for any position
    def get_node_id(row: int, col: str) -> str | None:
        # The reservoir entry junction at A1
        if row == 1 and col == "A":
            return "J_A1_entry"
        for key, node in DEMAND_NODES.items():
            if node["row"] == row and node["col"] == col and key in connected_demands:
                return f"T_{key}"
        if (row, col) in asset_map:
            return f"J_{col}{row}"
        return None

    # Connect the entry junction (A1) to any placed asset in A1 unconditionally.
    # The reservoir connects from above (vertically), so no port direction check is needed.
    if (1, "A") in asset_map:
        # Connect entry junction to the asset junction at A1
        node_a = "J_A1_entry"
        node_b = "J_A1"
        link_key = frozenset([node_a, node_b])
        if link_key not in created_links:
            wn.add_pipe(
                f"P_entry_to_A1", node_a, node_b,
                length=10.0, diameter=PIPE_DIAMETER, roughness=PIPE_ROUGHNESS,
            )
            created_links.add(link_key)
            pipe_count += 1
    else:
        # No asset at A1, connect entry to whatever is adjacent
        # Check south (A2) and east (B1)
        for direction in [Direction.SOUTH, Direction.EAST]:
            neighbor = get_neighbor(1, "A", direction)
            if neighbor and neighbor in asset_map:
                neighbor_asset = asset_map[neighbor]
                neighbor_ports = compute_rotated_ports(
                    neighbor_asset["asset_type"], neighbor_asset.get("rotation_degrees", 0)
                )
                if OPPOSITE[direction] in neighbor_ports:
                    node_b = f"J_{neighbor[1]}{neighbor[0]}"
                    link_key = frozenset(["J_A1_entry", node_b])
                    if link_key not in created_links:
                        wn.add_pipe(
                            f"P_entry_{pipe_count}", "J_A1_entry", node_b,
                            length=PIPE_LENGTH, diameter=PIPE_DIAMETER, roughness=PIPE_ROUGHNESS,
                        )
                        created_links.add(link_key)
                        pipe_count += 1

    # Connect placed assets to each other and to demand nodes
    for (row, col), asset in asset_map.items():
        ports = compute_rotated_ports(asset["asset_type"], asset.get("rotation_degrees", 0))
        node_a = f"J_{col}{row}"

        for direction in ports:
            neighbor = get_neighbor(row, col, direction)
            if neighbor is None:
                continue

            node_b = get_node_id(neighbor[0], neighbor[1])
            if node_b is None:
                continue

            # Skip if this is the entry junction (already handled)
            if node_b == "J_A1_entry":
                link_key = frozenset([node_a, node_b])
                if link_key not in created_links:
                    wn.add_pipe(
                        f"P_{pipe_count}", node_a, node_b,
                        length=PIPE_LENGTH, diameter=PIPE_DIAMETER, roughness=PIPE_ROUGHNESS,
                    )
                    created_links.add(link_key)
                    pipe_count += 1
                continue

            # For demand nodes, they accept from any direction
            demand_cells = {(d["row"], d["col"]) for key, d in DEMAND_NODES.items() if key in connected_demands}
            is_demand = neighbor in demand_cells

            if not is_demand and neighbor in asset_map:
                # Check port alignment
                neighbor_asset = asset_map[neighbor]
                neighbor_ports = compute_rotated_ports(
                    neighbor_asset["asset_type"], neighbor_asset.get("rotation_degrees", 0)
                )
                if OPPOSITE[direction] not in neighbor_ports:
                    continue

            link_key = frozenset([node_a, node_b])
            if link_key not in created_links:
                # If connecting to a demand tank, apply the rigged inlet bias
                tank_key = _get_tank_key_from_node(node_b)
                if tank_key and tank_key in TANK_INLET_BIAS:
                    bias = TANK_INLET_BIAS[tank_key]
                    wn.add_pipe(
                        f"P_{pipe_count}", node_a, node_b,
                        length=PIPE_LENGTH, diameter=bias["diameter"],
                        roughness=bias["roughness"], minor_loss=bias["minor_loss"],
                    )
                else:
                    # Add minor loss based on connector type (elbows/tees add resistance)
                    minor_loss = _get_minor_loss(asset.get("asset_type", "pipe"))
                    wn.add_pipe(
                        f"P_{pipe_count}", node_a, node_b,
                        length=PIPE_LENGTH, diameter=PIPE_DIAMETER, roughness=PIPE_ROUGHNESS,
                        minor_loss=minor_loss,
                    )
                created_links.add(link_key)
                pipe_count += 1

    # --- Control rules ---
    # Open reservoir outlet at time 0
    open_action = controls.ControlAction(pipe_out, "status", wntr.network.LinkStatus.Open)
    open_condition = controls.SimTimeCondition(wn, "=", 0)
    open_control = controls.Control(open_condition, open_action)
    wn.add_control("open_valve", open_control)

    # Close reservoir outlet when any tank reaches TWL
    for key, tank_id in tank_node_ids.items():
        tank = wn.get_node(tank_id)
        close_action = controls.ControlAction(pipe_out, "status", wntr.network.LinkStatus.Closed)
        close_condition = controls.ValueCondition(tank, "level", ">=", TANK_TWL - 0.01)
        close_control = controls.Control(close_condition, close_action)
        wn.add_control(f"close_at_{key}", close_control)

    return wn
