"""Convert player grid design to WNTR/EPANET network model."""

import wntr

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

    # --- Reservoir ---
    res_row = RESERVOIR_CELL["row"]
    res_col = RESERVOIR_CELL["col"]
    res_coords = cell_to_coords(res_row, res_col)
    wn.add_reservoir("R_A1", base_head=RESERVOIR_HEAD, coordinates=res_coords)

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
        if row == res_row and col == res_col:
            return "R_A1"
        for key, node in DEMAND_NODES.items():
            if node["row"] == row and node["col"] == col and key in connected_demands:
                return f"T_{key}"
        if (row, col) in asset_map:
            return f"J_{col}{row}"
        return None

    # Connect reservoir to adjacent assets
    for direction in Direction:
        neighbor = get_neighbor(res_row, res_col, direction)
        if neighbor and neighbor in asset_map:
            neighbor_asset = asset_map[neighbor]
            neighbor_ports = compute_rotated_ports(
                neighbor_asset["asset_type"], neighbor_asset.get("rotation_degrees", 0)
            )
            if OPPOSITE[direction] in neighbor_ports:
                node_a = "R_A1"
                node_b = f"J_{neighbor[1]}{neighbor[0]}"
                link_key = frozenset([node_a, node_b])
                if link_key not in created_links:
                    # This is the reservoir outlet pipe — starts CLOSED
                    pipe_id = "P_reservoir_out"
                    wn.add_pipe(
                        pipe_id, node_a, node_b,
                        length=PIPE_LENGTH, diameter=PIPE_DIAMETER,
                        roughness=PIPE_ROUGHNESS, status="CLOSED",
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

            # Skip reservoir (already handled)
            if node_b == "R_A1":
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
                pipe_id = f"P_{pipe_count}"
                wn.add_pipe(
                    pipe_id, node_a, node_b,
                    length=PIPE_LENGTH, diameter=PIPE_DIAMETER,
                    roughness=PIPE_ROUGHNESS, status="OPEN",
                )
                created_links.add(link_key)
                pipe_count += 1

    # --- Control rules ---
    # Open reservoir outlet at time 0
    pipe_out = wn.get_link("P_reservoir_out")
    open_action = wntr.network.controls.ControlAction(pipe_out, "status", 1)  # OPEN
    open_condition = wntr.network.controls.SimTimeCondition(wn, "=", 0)
    open_control = wntr.network.controls.Control(open_condition, open_action)
    wn.add_control("open_valve", open_control)

    # Close reservoir outlet when any tank reaches TWL
    for key, tank_id in tank_node_ids.items():
        tank = wn.get_node(tank_id)
        close_action = wntr.network.controls.ControlAction(pipe_out, "status", 0)  # CLOSED
        close_condition = wntr.network.controls.ValueCondition(
            tank, "level", ">=", TANK_TWL - 0.01
        )
        close_control = wntr.network.controls.Control(close_condition, close_action)
        wn.add_control(f"close_at_{key}", close_control)

    return wn
