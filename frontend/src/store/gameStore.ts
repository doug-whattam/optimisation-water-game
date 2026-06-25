import { create } from 'zustand'
import type { GridCell, PlacedAsset, PlayerState, SessionInfo, ParetoPoint, SimulationResult } from '@/types'
import { AssetType } from '@/types'
import { recalculateTotals } from '@/utils/costCalculator'

interface GameState {
  // Session
  sessionId: string | null
  sessionToken: string | null
  session: SessionInfo | null
  username: string | null
  playerState: PlayerState

  // Grid & design
  gridConfig: GridCell[]
  placedAssets: PlacedAsset[]
  selectedAssetType: AssetType | null
  totalCost: number
  assetCost: number
  installationCost: number

  // Simulation
  currentDesignId: string | null
  simulationResult: SimulationResult | null
  tankLevels: Record<string, number>
  isSimulating: boolean

  // Pareto
  paretoDesigns: ParetoPoint[]
  paretoFrontier: { total_cost: number; hydraulic_penalty: number }[]

  // Actions
  setSession: (session: SessionInfo, token: string, username: string) => void
  setPlayerState: (state: PlayerState) => void
  selectAssetType: (type: AssetType | null) => void
  placeAsset: (row: number, col: string, rotation?: 0 | 90 | 180 | 270) => void
  removeAsset: (row: number, col: string) => void
  rotateAsset: (row: number, col: string) => void
  setSimulating: (designing: boolean) => void
  setSimulationResult: (result: SimulationResult) => void
  setDesignId: (id: string) => void
  updateParetoData: (designs: ParetoPoint[], frontier: { total_cost: number; hydraulic_penalty: number }[]) => void
  updateTankLevels: (levels: Record<string, number>) => void
  resetDesign: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  sessionId: null,
  sessionToken: null,
  session: null,
  username: null,
  playerState: 'lobby',
  gridConfig: [],
  placedAssets: [],
  selectedAssetType: null,
  totalCost: 0,
  assetCost: 0,
  installationCost: 0,
  currentDesignId: null,
  simulationResult: null,
  tankLevels: {},
  isSimulating: false,
  paretoDesigns: [],
  paretoFrontier: [],

  setSession: (session, token, username) => set({
    sessionId: session.id,
    sessionToken: token,
    session,
    username,
    gridConfig: session.grid_config,
    playerState: 'designing',
  }),

  setPlayerState: (state) => set({ playerState: state }),

  selectAssetType: (type) => set({ selectedAssetType: type }),

  placeAsset: (row, col, rotation = 0) => {
    const { placedAssets, selectedAssetType, gridConfig } = get()
    if (!selectedAssetType) return

    // Check if cell is already occupied
    const existing = placedAssets.find(a => a.row === row && a.col === col)
    if (existing) return

    const newAsset: PlacedAsset = {
      row,
      col,
      asset_type: selectedAssetType,
      rotation_degrees: rotation,
    }
    const newAssets = [...placedAssets, newAsset]
    const costs = recalculateTotals(newAssets, gridConfig)

    set({
      placedAssets: newAssets,
      totalCost: costs.totalCost,
      assetCost: costs.assetCost,
      installationCost: costs.installationCost,
    })
  },

  removeAsset: (row, col) => {
    const { placedAssets, gridConfig } = get()
    const newAssets = placedAssets.filter(a => !(a.row === row && a.col === col))
    const costs = recalculateTotals(newAssets, gridConfig)

    set({
      placedAssets: newAssets,
      totalCost: costs.totalCost,
      assetCost: costs.assetCost,
      installationCost: costs.installationCost,
    })
  },

  rotateAsset: (row, col) => {
    const { placedAssets, gridConfig } = get()
    const newAssets = placedAssets.map(a => {
      if (a.row === row && a.col === col) {
        const newRotation = ((a.rotation_degrees + 90) % 360) as 0 | 90 | 180 | 270
        return { ...a, rotation_degrees: newRotation }
      }
      return a
    })
    const costs = recalculateTotals(newAssets, gridConfig)

    set({
      placedAssets: newAssets,
      totalCost: costs.totalCost,
      assetCost: costs.assetCost,
      installationCost: costs.installationCost,
    })
  },

  setSimulating: (simulating) => set({
    isSimulating: simulating,
    playerState: simulating ? 'simulating' : 'designing',
  }),

  setSimulationResult: (result) => set({
    simulationResult: result,
    isSimulating: false,
    playerState: 'results',
    tankLevels: result.tank_levels || {},
  }),

  setDesignId: (id) => set({ currentDesignId: id }),

  updateParetoData: (designs, frontier) => set({
    paretoDesigns: designs,
    paretoFrontier: frontier,
  }),

  updateTankLevels: (levels) => set({ tankLevels: levels }),

  resetDesign: () => set({
    placedAssets: [],
    totalCost: 0,
    assetCost: 0,
    installationCost: 0,
    currentDesignId: null,
    simulationResult: null,
    tankLevels: {},
    playerState: 'designing',
  }),
}))
