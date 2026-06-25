import { AssetType, Direction, ASSET_PORTS } from '@/types'

const ROTATION_MAP: Record<number, Record<Direction, Direction>> = {
  0: { [Direction.North]: Direction.North, [Direction.East]: Direction.East, [Direction.South]: Direction.South, [Direction.West]: Direction.West },
  90: { [Direction.North]: Direction.East, [Direction.East]: Direction.South, [Direction.South]: Direction.West, [Direction.West]: Direction.North },
  180: { [Direction.North]: Direction.South, [Direction.East]: Direction.West, [Direction.South]: Direction.North, [Direction.West]: Direction.East },
  270: { [Direction.North]: Direction.West, [Direction.East]: Direction.North, [Direction.South]: Direction.East, [Direction.West]: Direction.South },
}

export const OPPOSITE: Record<Direction, Direction> = {
  [Direction.North]: Direction.South,
  [Direction.South]: Direction.North,
  [Direction.East]: Direction.West,
  [Direction.West]: Direction.East,
}

export function computeRotatedPorts(assetType: AssetType, rotationDegrees: number): Direction[] {
  const basePorts = ASSET_PORTS[assetType]
  const rotMap = ROTATION_MAP[rotationDegrees] || ROTATION_MAP[0]
  return basePorts.map(port => rotMap[port])
}

const COL_TO_INDEX: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 }
const INDEX_TO_COL: Record<number, string> = { 0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F' }

export function getNeighbor(row: number, col: string, direction: Direction): { row: number; col: string } | null {
  const colIdx = COL_TO_INDEX[col]
  if (colIdx === undefined) return null

  let newRow = row
  let newColIdx = colIdx

  switch (direction) {
    case Direction.North: newRow = row - 1; break
    case Direction.South: newRow = row + 1; break
    case Direction.East: newColIdx = colIdx + 1; break
    case Direction.West: newColIdx = colIdx - 1; break
  }

  if (newRow < 1 || newRow > 6 || newColIdx < 0 || newColIdx > 5) return null
  return { row: newRow, col: INDEX_TO_COL[newColIdx] }
}
