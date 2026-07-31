import { create } from 'zustand'
import type { GridCell, PlacedAsset, PlayerState, SessionInfo, ParetoPoint, SimulationResult } from '@/types'
import { AssetType, ASSET_COSTS, BUDGET, cellId, isDemandCell } from '@/types'
import { recalculateTotals } from '@/utils/costCalculator'
import { showToast } from '@/utils/toast'

export type Rotation = 0 | 90 | 180 | 270

export interface HoveredCell {
  row: number
  col: string
}

/** Number of design snapshots retained for undo. */
const HISTORY_LIMIT = 60

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
  /** Rotation applied to the next asset placed. Rotated with `R`. */
  pendingRotation: Rotation
  hoveredCell: HoveredCell | null
  totalCost: number
  assetCost: number
  installationCost: number

  // Undo / redo — snapshots of `placedAssets`
  past: PlacedAsset[][]
  future: PlacedAsset[][]
  /** True while a drag-paint gesture is in flight, so the whole stroke is one undo step. */
  strokeActive: boolean

  // Simulation
  currentDesignId: string | null
  simulationResult: SimulationResult | null
  tankLevels: Record<string, number>
  isSimulating: boolean
  /** Plan number of the most recent submission, for the header readout. */
  lastPlanNumber: number | null

  // Pareto
  paretoDesigns: ParetoPoint[]
  paretoFrontier: { total_cost: number; hydraulic_penalty: number }[]

  // Actions
  setSession: (session: SessionInfo, token: string, username: string) => void
  setPlayerState: (state: PlayerState) => void
  selectAssetType: (type: AssetType | null) => void
  rotatePending: () => void
  setHoveredCell: (cell: HoveredCell | null) => void
  placeAsset: (row: number, col: string, rotation?: Rotation) => boolean
  removeAsset: (row: number, col: string) => void
  rotateAsset: (row: number, col: string) => void
  beginStroke: () => void
  endStroke: () => void
  undo: () => void
  redo: () => void
  clearDesign: () => void
  setSimulating: (simulating: boolean) => void
  setSimulationResult: (result: SimulationResult) => void
  setDesignId: (id: string) => void
  setLastPlanNumber: (plan: number) => void
  updateParetoData: (designs: ParetoPoint[], frontier: { total_cost: number; hydraulic_penalty: number }[]) => void
  updateTankLevels: (levels: Record<string, number>) => void
  resetDesign: () => void
  resetToLobby: () => void
}

const emptyDesign = {
  placedAssets: [] as PlacedAsset[],
  totalCost: 0,
  assetCost: 0,
  installationCost: 0,
  past: [] as PlacedAsset[][],
  future: [] as PlacedAsset[][],
  strokeActive: false,
  pendingRotation: 0 as Rotation,
}

export const useGameStore = create<GameState>((set, get) => {
  /**
   * Apply a new asset list, recomputing derived costs and (optionally) pushing
   * the previous list onto the undo stack. Centralised so every mutation stays
   * consistent — the old implementation duplicated this in three places.
   */
  function commit(newAssets: PlacedAsset[], recordHistory = true) {
    const { placedAssets, gridConfig, past, strokeActive } = get()
    const costs = recalculateTotals(newAssets, gridConfig)

    // A drag stroke snapshots once, at beginStroke, so the whole run undoes together.
    const shouldRecord = recordHistory && !strokeActive
    const nextPast = shouldRecord ? [...past, placedAssets].slice(-HISTORY_LIMIT) : past

    set({
      placedAssets: newAssets,
      totalCost: costs.totalCost,
      assetCost: costs.assetCost,
      installationCost: costs.installationCost,
      past: nextPast,
      future: shouldRecord ? [] : get().future,
    })
  }

  return {
    // Initial state
    sessionId: null,
    sessionToken: null,
    session: null,
    username: null,
    playerState: 'lobby',
    gridConfig: [],
    selectedAssetType: null,
    hoveredCell: null,
    currentDesignId: null,
    simulationResult: null,
    tankLevels: {},
    isSimulating: false,
    lastPlanNumber: null,
    paretoDesigns: [],
    paretoFrontier: [],
    ...emptyDesign,

    setSession: (session, token, username) =>
      set({
        sessionId: session.id,
        sessionToken: token,
        session,
        username,
        gridConfig: session.grid_config,
        playerState: 'designing',
      }),

    setPlayerState: (state) => set({ playerState: state }),

    selectAssetType: (type) => set({ selectedAssetType: type }),

    rotatePending: () =>
      set((s) => ({ pendingRotation: ((s.pendingRotation + 90) % 360) as Rotation })),

    setHoveredCell: (cell) => {
      const current = get().hoveredCell
      // Guard against redundant sets — pointer-move fires constantly.
      if (current?.row === cell?.row && current?.col === cell?.col) return
      set({ hoveredCell: cell })
    },

    /**
     * Place the selected asset. Returns whether it was placed.
     *
     * The budget is now enforced here rather than only server-side at submit
     * time, so players get immediate feedback instead of building a network the
     * backend later rejects with a 400.
     */
    placeAsset: (row, col, rotation) => {
      const { placedAssets, selectedAssetType, gridConfig, totalCost, playerState } = get()
      if (playerState !== 'designing' || !selectedAssetType) return false

      if (isDemandCell(row, col)) return false
      if (placedAssets.some((a) => a.row === row && a.col === col)) return false

      const cell = gridConfig.find((c) => c.row === row && c.col === col)
      if (!cell) return false

      const cost = ASSET_COSTS[selectedAssetType] + cell.installation_cost
      if (totalCost + cost > BUDGET) {
        showToast('Over budget', 'warning', {
          detail: `That placement costs ${cost.toLocaleString()} but only ${(
            BUDGET - totalCost
          ).toLocaleString()} credits remain.`,
        })
        return false
      }

      commit([
        ...placedAssets,
        {
          row,
          col,
          asset_type: selectedAssetType,
          rotation_degrees: rotation ?? get().pendingRotation,
        },
      ])
      return true
    },

    removeAsset: (row, col) => {
      const { placedAssets } = get()
      if (!placedAssets.some((a) => a.row === row && a.col === col)) return
      commit(placedAssets.filter((a) => !(a.row === row && a.col === col)))
    },

    rotateAsset: (row, col) => {
      const { placedAssets } = get()
      commit(
        placedAssets.map((a) =>
          a.row === row && a.col === col
            ? { ...a, rotation_degrees: ((a.rotation_degrees + 90) % 360) as Rotation }
            : a,
        ),
      )
    },

    beginStroke: () => {
      const { placedAssets, past } = get()
      set({
        strokeActive: true,
        past: [...past, placedAssets].slice(-HISTORY_LIMIT),
        future: [],
      })
    },

    endStroke: () => {
      const { past, placedAssets, strokeActive } = get()
      if (!strokeActive) return
      // A stroke that changed nothing shouldn't leave a no-op undo step behind.
      const snapshot = past[past.length - 1]
      const unchanged = snapshot && snapshot.length === placedAssets.length
      set({ strokeActive: false, past: unchanged ? past.slice(0, -1) : past })
    },

    undo: () => {
      const { past, future, placedAssets, gridConfig, playerState } = get()
      if (playerState !== 'designing' || past.length === 0) return
      const previous = past[past.length - 1]
      const { assetCost, installationCost, totalCost } = recalculateTotals(previous, gridConfig)
      set({
        placedAssets: previous,
        past: past.slice(0, -1),
        future: [placedAssets, ...future].slice(0, HISTORY_LIMIT),
        assetCost,
        installationCost,
        totalCost,
      })
    },

    redo: () => {
      const { past, future, placedAssets, gridConfig, playerState } = get()
      if (playerState !== 'designing' || future.length === 0) return
      const next = future[0]
      const { assetCost, installationCost, totalCost } = recalculateTotals(next, gridConfig)
      set({
        placedAssets: next,
        past: [...past, placedAssets].slice(-HISTORY_LIMIT),
        future: future.slice(1),
        assetCost,
        installationCost,
        totalCost,
      })
    },

    clearDesign: () => {
      const { placedAssets, playerState } = get()
      if (playerState !== 'designing' || placedAssets.length === 0) return
      commit([])
      showToast('Network cleared', 'info', { detail: 'Ctrl+Z to undo.' })
    },

    setSimulating: (simulating) =>
      set({
        isSimulating: simulating,
        playerState: simulating ? 'simulating' : 'designing',
      }),

    setSimulationResult: (result) =>
      set({
        simulationResult: result,
        isSimulating: false,
        playerState: 'results',
        tankLevels: result.tank_levels || {},
      }),

    setDesignId: (id) => set({ currentDesignId: id }),

    setLastPlanNumber: (plan) => set({ lastPlanNumber: plan }),

    updateParetoData: (designs, frontier) =>
      set({ paretoDesigns: designs, paretoFrontier: frontier }),

    updateTankLevels: (levels) => set({ tankLevels: levels }),

    resetDesign: () =>
      set({
        ...emptyDesign,
        currentDesignId: null,
        simulationResult: null,
        tankLevels: {},
        playerState: 'designing',
      }),

    resetToLobby: () =>
      set({
        sessionId: null,
        sessionToken: null,
        session: null,
        username: null,
        playerState: 'lobby',
        gridConfig: [],
        selectedAssetType: null,
        hoveredCell: null,
        currentDesignId: null,
        simulationResult: null,
        tankLevels: {},
        isSimulating: false,
        lastPlanNumber: null,
        paretoDesigns: [],
        paretoFrontier: [],
        ...emptyDesign,
      }),
  }
})

/** Convenience selector used by the 3D scene to test occupancy quickly. */
export function selectOccupiedIds(assets: PlacedAsset[]): Set<string> {
  return new Set(assets.map((a) => cellId(a.row, a.col)))
}
