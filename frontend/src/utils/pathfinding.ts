/**
 * Client-side connectivity analysis: BFS from the reservoir outlet through
 * port-aligned pipework.
 *
 * The original module only answered "is anything connected?". It now returns the
 * full reachable set, which lets the 3D scene animate water only in pipes that
 * are actually fed — dead-end spurs stay dry, which is a much clearer signal to
 * the player than filling every pipe on the board.
 */
import { PlacedAsset, DEMAND_NODES, RESERVOIR_ENTRY, cellId } from '@/types'
import { computeRotatedPorts, getNeighbor, OPPOSITE } from '@/utils/portAlignment'

export interface Connectivity {
  /** Cell ids (`row_col`) of pipework fed from the reservoir. */
  reachable: Set<string>
  /** Keys of demand nodes that pipework reaches. */
  connectedDemands: Set<string>
}

export function analyseConnectivity(placedAssets: PlacedAsset[]): Connectivity {
  const assetMap = new Map<string, PlacedAsset>()
  for (const asset of placedAssets) {
    assetMap.set(cellId(asset.row, asset.col), asset)
  }

  const reachable = new Set<string>()
  const connectedDemands = new Set<string>()

  // The reservoir drops into the entry cell from above, so whatever sits there
  // is fed regardless of its port orientation.
  const entryKey = cellId(RESERVOIR_ENTRY.row, RESERVOIR_ENTRY.col)
  if (!assetMap.has(entryKey)) return { reachable, connectedDemands }

  reachable.add(entryKey)
  const queue: string[] = [entryKey]

  while (queue.length > 0) {
    const current = queue.shift()!
    const asset = assetMap.get(current)
    if (!asset) continue

    for (const dir of computeRotatedPorts(asset.asset_type, asset.rotation_degrees)) {
      const neighbor = getNeighbor(asset.row, asset.col, dir)
      if (!neighbor) continue

      const demand = DEMAND_NODES.find((d) => d.row === neighbor.row && d.col === neighbor.col)
      if (demand) {
        // Tanks accept an inlet from any face.
        connectedDemands.add(demand.key)
        continue
      }

      const key = cellId(neighbor.row, neighbor.col)
      if (reachable.has(key)) continue

      const neighborAsset = assetMap.get(key)
      if (!neighborAsset) continue

      const neighborPorts = computeRotatedPorts(
        neighborAsset.asset_type,
        neighborAsset.rotation_degrees,
      )
      if (neighborPorts.includes(OPPOSITE[dir])) {
        reachable.add(key)
        queue.push(key)
      }
    }
  }

  return { reachable, connectedDemands }
}

/** True when at least one demand node is fed from the reservoir. */
export function hasValidPath(placedAssets: PlacedAsset[]): boolean {
  return analyseConnectivity(placedAssets).connectedDemands.size > 0
}
