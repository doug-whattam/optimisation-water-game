/**
 * Client-side connectivity validation using BFS from reservoir to demand nodes.
 */
import { PlacedAsset, DEMAND_NODES, Direction } from '@/types'
import { computeRotatedPorts, getNeighbor, OPPOSITE } from '@/utils/portAlignment'

const RESERVOIR = { row: 1, col: 'A' }

export function hasValidPath(placedAssets: PlacedAsset[]): boolean {
  const assetMap = new Map<string, PlacedAsset>()
  for (const asset of placedAssets) {
    assetMap.set(`${asset.row}_${asset.col}`, asset)
  }

  const visited = new Set<string>()
  const queue: string[] = []

  // Start from reservoir: check all 4 directions
  visited.add(`${RESERVOIR.row}_${RESERVOIR.col}`)
  const allDirs = [Direction.North, Direction.East, Direction.South, Direction.West]

  for (const dir of allDirs) {
    const neighbor = getNeighbor(RESERVOIR.row, RESERVOIR.col, dir)
    if (!neighbor) continue
    const key = `${neighbor.row}_${neighbor.col}`
    const neighborAsset = assetMap.get(key)
    if (!neighborAsset) continue

    const neighborPorts = computeRotatedPorts(neighborAsset.asset_type, neighborAsset.rotation_degrees)
    if (neighborPorts.includes(OPPOSITE[dir])) {
      if (!visited.has(key)) {
        visited.add(key)
        queue.push(key)
      }
    }
  }

  // BFS through connected assets
  while (queue.length > 0) {
    const current = queue.shift()!
    const currentAsset = assetMap.get(current)
    if (!currentAsset) continue

    const currentPorts = computeRotatedPorts(currentAsset.asset_type, currentAsset.rotation_degrees)

    for (const dir of currentPorts) {
      const neighbor = getNeighbor(currentAsset.row, currentAsset.col, dir)
      if (!neighbor) continue
      const key = `${neighbor.row}_${neighbor.col}`
      if (visited.has(key)) continue

      // Is it a demand node? They accept from any direction.
      const isDemand = DEMAND_NODES.some(d => d.row === neighbor.row && d.col === neighbor.col)
      if (isDemand) {
        return true // Found a path!
      }

      // Is it a placed asset with a matching port?
      const neighborAsset = assetMap.get(key)
      if (neighborAsset) {
        const neighborPorts = computeRotatedPorts(neighborAsset.asset_type, neighborAsset.rotation_degrees)
        if (neighborPorts.includes(OPPOSITE[dir])) {
          visited.add(key)
          queue.push(key)
        }
      }
    }
  }

  return false
}
