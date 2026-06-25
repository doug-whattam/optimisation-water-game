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

export const LAND_TYPE_COLORS: Record<string, string> = {
  rural: '#7CFC00',
  suburban: '#F0E68C',
  urban: '#A9A9A9',
  railway: '#8B4513',
  forest: '#228B22',
  river: '#4169E1',
  cultural_heritage: '#DAA520',
  reservoir: '#87CEEB',
  residential_demand: '#FFB74D',
  hospital_demand: '#EF5350',
  industrial_demand: '#78909C',
  commercial_demand: '#AB47BC',
}

// Asset types
export enum AssetType {
  Pipe = 'pipe',
  Straight = 'straight',
  Elbow = 'elbow',
  Tee = 'tee',
  Cross = 'cross',
}

export const ASSET_COSTS: Record<AssetType, number> = {
  [AssetType.Pipe]: 500,
  [AssetType.Straight]: 500,
  [AssetType.Elbow]: 1000,
  [AssetType.Tee]: 1500,
  [AssetType.Cross]: 2000,
}

export const ASSET_LABELS: Record<AssetType, string> = {
  [AssetType.Pipe]: 'Pipe',
  [AssetType.Straight]: 'Straight Connector',
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
  [AssetType.Straight]: [Direction.North, Direction.South],
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
