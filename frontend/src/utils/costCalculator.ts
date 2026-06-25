import { AssetType, GridCell, PlacedAsset, ASSET_COSTS, BUDGET } from '@/types'

export interface CostBreakdown {
  assetCost: number
  installationCost: number
  totalCost: number
  remainingBudget: number
}

export function calculatePlacementCost(assetType: AssetType, cell: GridCell): number {
  return ASSET_COSTS[assetType] + cell.installation_cost
}

export function recalculateTotals(placedAssets: PlacedAsset[], gridConfig: GridCell[]): CostBreakdown {
  let assetCost = 0
  let installationCost = 0

  const cellMap = new Map<string, GridCell>()
  for (const cell of gridConfig) {
    cellMap.set(`${cell.row}_${cell.col}`, cell)
  }

  for (const asset of placedAssets) {
    assetCost += ASSET_COSTS[asset.asset_type]
    const cell = cellMap.get(`${asset.row}_${asset.col}`)
    if (cell) {
      installationCost += cell.installation_cost
    }
  }

  return {
    assetCost,
    installationCost,
    totalCost: assetCost + installationCost,
    remainingBudget: BUDGET - (assetCost + installationCost),
  }
}

export function canPlaceAsset(assetType: AssetType, cell: GridCell, currentTotal: number): { valid: boolean; reason?: string } {
  const cost = calculatePlacementCost(assetType, cell)
  if (currentTotal + cost > BUDGET) {
    return { valid: false, reason: `Budget exceeded: need ${cost}, only ${BUDGET - currentTotal} remaining` }
  }
  return { valid: true }
}
