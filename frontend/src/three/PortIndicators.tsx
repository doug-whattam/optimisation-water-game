/**
 * Visual indicators showing port alignment status between placed assets.
 * Green = valid connection, Red = misaligned ports.
 */
import { useGameStore } from '@/store/gameStore'
import { COLUMNS, Direction } from '@/types'
import { computeRotatedPorts, getNeighbor, OPPOSITE } from '@/utils/portAlignment'

const CELL_SIZE = 1.0

function cellToWorld(row: number, col: string): [number, number, number] {
  const colIdx = COLUMNS.indexOf(col)
  return [colIdx * CELL_SIZE, 0, (row - 1) * CELL_SIZE]
}

const DIRECTION_OFFSET: Record<Direction, [number, number, number]> = {
  [Direction.North]: [0, 0.15, -0.45],
  [Direction.South]: [0, 0.15, 0.45],
  [Direction.East]: [0.45, 0.15, 0],
  [Direction.West]: [-0.45, 0.15, 0],
}

export default function PortIndicators() {
  const placedAssets = useGameStore((s) => s.placedAssets)
  const playerState = useGameStore((s) => s.playerState)

  if (playerState !== 'designing' || placedAssets.length === 0) return null

  const assetMap = new Map<string, typeof placedAssets[0]>()
  for (const asset of placedAssets) {
    assetMap.set(`${asset.row}_${asset.col}`, asset)
  }

  const indicators: { position: [number, number, number]; connected: boolean }[] = []

  for (const asset of placedAssets) {
    const ports = computeRotatedPorts(asset.asset_type, asset.rotation_degrees)
    const [wx, , wz] = cellToWorld(asset.row, asset.col)

    for (const dir of ports) {
      const neighbor = getNeighbor(asset.row, asset.col, dir)
      if (!neighbor) continue

      const neighborKey = `${neighbor.row}_${neighbor.col}`
      const neighborAsset = assetMap.get(neighborKey)

      // Check if neighbor is reservoir entry point (above A1 = north)
      const isReservoirEntry = asset.row === 1 && asset.col === 'A' && dir === Direction.North
      // Check if neighbor is a demand node (always accepts)
      const isDemand = (neighbor.row === 2 && neighbor.col === 'A') ||
                       (neighbor.row === 2 && neighbor.col === 'F') ||
                       (neighbor.row === 5 && neighbor.col === 'A') ||
                       (neighbor.row === 6 && neighbor.col === 'F')

      if (isReservoirEntry || isDemand) {
        const offset = DIRECTION_OFFSET[dir]
        indicators.push({
          position: [wx + offset[0], offset[1], wz + offset[2]],
          connected: true,
        })
      } else if (neighborAsset) {
        const neighborPorts = computeRotatedPorts(neighborAsset.asset_type, neighborAsset.rotation_degrees)
        const connected = neighborPorts.includes(OPPOSITE[dir])
        const offset = DIRECTION_OFFSET[dir]
        indicators.push({
          position: [wx + offset[0], offset[1], wz + offset[2]],
          connected,
        })
      }
    }
  }

  return (
    <group>
      {indicators.map((ind, i) => (
        <mesh key={i} position={ind.position}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color={ind.connected ? '#4CAF50' : '#F44336'} />
        </mesh>
      ))}
    </group>
  )
}
