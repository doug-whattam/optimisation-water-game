// Land types
export enum LandType {
  Rural = 'rural',
  Suburban = 'suburban',
  Urban = 'urban',
  Railway = 'railway',
  Forest = 'forest',
  River = 'river',
  CulturalHeritage = 'cultural_heritage',
}

export const LAND_TYPE_COSTS: Record<LandType, number> = {
  [LandType.Rural]: 1000,
  [LandType.Suburban]: 2000,
  [LandType.Urban]: 3500,
  [LandType.Railway]: 5000,
  [LandType.Forest]: 4500,
  [LandType.River]: 6000,
  [LandType.CulturalHeritage]: 5500,
}

/**
 * Tile albedo colours.
 *
 * Tuned to sit under physically-based lighting: the previous values were
 * near-saturated primaries (e.g. #7CFC00 lawn green) which blow out once a
 * sun light and tone mapping are applied. These are desaturated equivalents
 * that keep each land type distinguishable while reading as real ground.
 */
export const LAND_TYPE_COLORS: Record<string, string> = {
  rural: '#7fa34e',
  suburban: '#cdb978',
  urban: '#8b93a1',
  railway: '#8a6647',
  forest: '#3d7340',
  river: '#2f5fa8',
  cultural_heritage: '#bd9a4a',
  reservoir: '#6ca8c4',
  residential_demand: '#c98f4a',
  hospital_demand: '#c25d5a',
  industrial_demand: '#6a7a86',
  commercial_demand: '#8b5aa3',
}

/** Colour of the exposed earth on the side walls of each extruded tile. */
export const LAND_TYPE_EDGE_COLORS: Record<string, string> = {
  rural: '#5c4632',
  suburban: '#6b5539',
  urban: '#4a4f58',
  railway: '#513c2b',
  forest: '#3b3527',
  river: '#2a3f5e',
  cultural_heritage: '#6b5730',
  reservoir: '#3a5a68',
  residential_demand: '#6b4a2c',
  hospital_demand: '#6b3634',
  industrial_demand: '#3d464e',
  commercial_demand: '#4d3159',
}

/** Human-readable land type names for tooltips and legends. */
export const LAND_TYPE_LABELS: Record<string, string> = {
  rural: 'Rural',
  suburban: 'Suburban',
  urban: 'Urban',
  railway: 'Railway',
  forest: 'Forest',
  river: 'River',
  cultural_heritage: 'Cultural Heritage',
  reservoir: 'Reservoir',
  residential_demand: 'Residential Demand',
  hospital_demand: 'Hospital Demand',
  industrial_demand: 'Industrial Demand',
  commercial_demand: 'Commercial Demand',
}

export function formatLandType(landType: string): string {
  return (
    LAND_TYPE_LABELS[landType] ??
    landType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

// Asset types
export enum AssetType {
  Pipe = 'pipe',
  Elbow = 'elbow',
  Tee = 'tee',
  Cross = 'cross',
}

export const ASSET_COSTS: Record<AssetType, number> = {
  [AssetType.Pipe]: 500,
  [AssetType.Elbow]: 1000,
  [AssetType.Tee]: 1500,
  [AssetType.Cross]: 2000,
}

export const ASSET_LABELS: Record<AssetType, string> = {
  [AssetType.Pipe]: 'Pipe',
  [AssetType.Elbow]: 'Elbow Connector',
  [AssetType.Tee]: 'Tee Connector',
  [AssetType.Cross]: 'Cross Connector',
}

// Directions
export enum Direction {
  North = 'north',
  East = 'east',
  South = 'south',
  West = 'west',
}

// Base port configurations (at 0° rotation)
export const ASSET_PORTS: Record<AssetType, Direction[]> = {
  [AssetType.Pipe]: [Direction.North, Direction.South],
  [AssetType.Elbow]: [Direction.North, Direction.East],
  [AssetType.Tee]: [Direction.North, Direction.East, Direction.South],
  [AssetType.Cross]: [Direction.North, Direction.East, Direction.South, Direction.West],
}

// Grid
export interface GridCell {
  row: number
  col: string
  land_type: string
  installation_cost: number
}

export interface PlacedAsset {
  row: number
  col: string
  asset_type: AssetType
  rotation_degrees: 0 | 90 | 180 | 270
}

export interface DemandNode {
  key: string
  name: string
  row: number
  col: string
  twl: number
}

export const DEMAND_NODES: DemandNode[] = [
  { key: 'residential', name: 'Residential', row: 2, col: 'A', twl: 5.0 },
  { key: 'hospital', name: 'Hospital', row: 2, col: 'F', twl: 5.0 },
  { key: 'industrial', name: 'Industrial', row: 5, col: 'A', twl: 5.0 },
  { key: 'commercial', name: 'Commercial', row: 6, col: 'F', twl: 5.0 },
]

export const BUDGET = 100_000
export const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F']
export const ROWS = [1, 2, 3, 4, 5, 6]

/** Cell where the reservoir outlet enters the grid (from the north). */
export const RESERVOIR_ENTRY = { row: 1, col: 'A' } as const

export function isDemandCell(row: number, col: string): boolean {
  return DEMAND_NODES.some((d) => d.row === row && d.col === col)
}

export function cellId(row: number, col: string): string {
  return `${row}_${col}`
}

/** Grid label as players read it off the board, e.g. "C4". */
export function cellLabel(row: number, col: string): string {
  return `${col}${row}`
}

/** Number-key shortcuts, kept beside the asset definitions so they can't drift. */
export const ASSET_SHORTCUTS: Record<AssetType, string> = {
  [AssetType.Pipe]: '1',
  [AssetType.Elbow]: '2',
  [AssetType.Tee]: '3',
  [AssetType.Cross]: '4',
}

// Session & multiplayer
export interface SessionInfo {
  id: string
  name: string
  max_players: number
  status: string
  grid_config: GridCell[]
  player_count: number
  players: PlayerInfo[]
  created_at: string
}

export interface PlayerInfo {
  id: string
  username: string
  connected_at: string
  is_connected: boolean
}

export interface ParetoPoint {
  design_id: string
  player_username: string
  plan_number: number
  total_cost: number
  hydraulic_penalty: number
  is_pareto_optimal: boolean
}

export interface SimulationResult {
  simulation_id: string
  design_id: string
  status: string
  stopping_tank: string | null
  tank_levels: Record<string, number> | null
  individual_penalties: Record<string, number> | null
  hydraulic_penalty: number | null
  total_cost: number
  error_message: string | null
}

// Player state machine
export type PlayerState = 'lobby' | 'designing' | 'simulating' | 'results'
