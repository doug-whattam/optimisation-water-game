/**
 * Single source of truth for board geometry in world space.
 *
 * Previously `cellToWorld` was duplicated in GridScene and PortIndicators, and
 * the tank/reservoir offsets were magic numbers scattered across components.
 * Anything that needs to know where a cell sits should import from here.
 */
import { COLUMNS, ROWS } from '@/types'

export const CELL_SIZE = 1.0
/** Rendered tile footprint — slightly under CELL_SIZE to leave a visible seam. */
export const TILE_SIZE = 0.94
/** Extrusion height of a terrain tile. */
export const TILE_HEIGHT = 0.12
/** Top surface of a tile — the plane everything on the board sits on. */
export const GROUND_Y = TILE_HEIGHT

export const GRID_WIDTH = (COLUMNS.length - 1) * CELL_SIZE
export const GRID_DEPTH = (ROWS.length - 1) * CELL_SIZE

/** Centre of the playable board, used for camera target and shadow framing. */
export const BOARD_CENTER: [number, number, number] = [GRID_WIDTH / 2, 0, GRID_DEPTH / 2]

/** Reservoir tower sits north of row 1, off the board. */
export const RESERVOIR_POS: [number, number, number] = [0, 0, -1.6]
export const RESERVOIR_HEIGHT = 2.5

/** Lateral offset of a demand tank from its grid cell centre. */
export const TANK_OFFSET = 0.78
export const TANK_HEIGHT = 1.0
export const TANK_RADIUS = 0.3

/** Pipe dimensions. */
export const PIPE_RADIUS = 0.062
export const PIPE_BORE = 0.042
/** Centreline height of pipework above the tile surface. */
export const PIPE_Y = GROUND_Y + PIPE_RADIUS + 0.02
/** Half a tile — how far a pipe run reaches from cell centre to cell edge. */
export const HALF_CELL = CELL_SIZE / 2

export function colToIndex(col: string): number {
  return COLUMNS.indexOf(col)
}

/** Grid reference to world position (tile centre, at ground level). */
export function cellToWorld(row: number, col: string): [number, number, number] {
  return [colToIndex(col) * CELL_SIZE, 0, (row - 1) * CELL_SIZE]
}

/** X offset that pushes a demand tank away from the board, given its column. */
export function tankOffsetX(col: string): number {
  if (col === COLUMNS[0]) return -TANK_OFFSET
  if (col === COLUMNS[COLUMNS.length - 1]) return TANK_OFFSET
  return 0
}

/**
 * Deterministic pseudo-random in [0,1) from a cell reference.
 * Used for per-tile variation (height jitter, prop placement) so the board
 * looks hand-placed but stays identical across renders and reloads.
 */
export function cellNoise(row: number, col: string, salt = 0): number {
  const seed = (row * 73856093) ^ (colToIndex(col) * 19349663) ^ (salt * 83492791)
  const x = Math.sin(seed) * 43758.5453
  return x - Math.floor(x)
}
