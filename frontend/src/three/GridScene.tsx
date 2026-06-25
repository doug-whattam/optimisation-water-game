import { Text } from '@react-three/drei'
import { ThreeEvent } from '@react-three/fiber'
import { useGameStore } from '@/store/gameStore'
import { DEMAND_NODES, COLUMNS, ROWS } from '@/types'
import TerrainTile from './TerrainTile'
import ReservoirModel from './ReservoirModel'
import TankModel from './TankModel'
import PlacedAssetModel from './PlacedAssetModel'
import PortIndicators from './PortIndicators'

const CELL_SIZE = 1.0

export default function GridScene() {
  const gridConfig = useGameStore((s) => s.gridConfig)
  const placedAssets = useGameStore((s) => s.placedAssets)
  const tankLevels = useGameStore((s) => s.tankLevels)
  const selectedAssetType = useGameStore((s) => s.selectedAssetType)
  const placeAsset = useGameStore((s) => s.placeAsset)
  const removeAsset = useGameStore((s) => s.removeAsset)
  const rotateAsset = useGameStore((s) => s.rotateAsset)
  const playerState = useGameStore((s) => s.playerState)

  // Convert grid position to 3D world coordinates
  function cellToWorld(row: number, col: string): [number, number, number] {
    const colIdx = COLUMNS.indexOf(col)
    return [colIdx * CELL_SIZE, 0, (row - 1) * CELL_SIZE]
  }

  // Handle cell click
  function handleCellClick(row: number, col: string, e: ThreeEvent<MouseEvent>) {
    if (playerState !== 'designing') return
    e.stopPropagation()

    // Check if cell is reserved
    const isReservoir = row === 1 && col === 'A'
    const isDemand = DEMAND_NODES.some((d) => d.row === row && d.col === col)
    if (isReservoir || isDemand) return

    // Check if already occupied
    const existing = placedAssets.find((a) => a.row === row && a.col === col)
    if (existing) {
      // Rotate on left-click if already placed
      rotateAsset(row, col)
      return
    }

    // Place asset
    if (selectedAssetType) {
      placeAsset(row, col)
    }
  }

  function handleCellRightClick(row: number, col: string, e: ThreeEvent<MouseEvent>) {
    if (playerState !== 'designing') return
    e.stopPropagation()
    removeAsset(row, col)
  }

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.5, -0.01, 2.5]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshLambertMaterial color="#2d5016" />
      </mesh>

      {/* Column labels */}
      {COLUMNS.map((col, idx) => (
        <Text
          key={`col-${col}`}
          position={[idx * CELL_SIZE, 0.01, -0.5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {col}
        </Text>
      ))}

      {/* Row labels */}
      {ROWS.map((row) => (
        <Text
          key={`row-${row}`}
          position={[-0.5, 0.01, (row - 1) * CELL_SIZE]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {String(row)}
        </Text>
      ))}

      {/* Grid cells */}
      {gridConfig.map((cell) => {
        const [x, , z] = cellToWorld(cell.row, cell.col)
        const isReservoir = cell.land_type === 'reservoir'
        const isDemand = cell.land_type.includes('demand')
        const isPlaced = placedAssets.some((a) => a.row === cell.row && a.col === cell.col)

        return (
          <group key={`${cell.row}-${cell.col}`} position={[x, 0, z]}>
            <TerrainTile
              landType={cell.land_type}
              onClick={(e) => handleCellClick(cell.row, cell.col, e)}
              onContextMenu={(e) => handleCellRightClick(cell.row, cell.col, e)}
              isHighlighted={!isReservoir && !isDemand && !isPlaced && !!selectedAssetType && playerState === 'designing'}
            />
          </group>
        )
      })}

      {/* Reservoir */}
      <group position={cellToWorld(1, 'A')}>
        <ReservoirModel />
      </group>

      {/* Demand node tanks */}
      {DEMAND_NODES.map((node) => {
        const level = tankLevels[node.key] ?? 0
        const fraction = level / node.twl
        return (
          <group key={node.key} position={cellToWorld(node.row, node.col)}>
            <TankModel name={node.name} fillFraction={fraction} />
          </group>
        )
      })}

      {/* Placed assets */}
      {placedAssets.map((asset) => (
        <group key={`${asset.row}-${asset.col}`} position={cellToWorld(asset.row, asset.col)}>
          <PlacedAssetModel asset={asset} />
        </group>
      ))}

      {/* Port alignment indicators */}
      <PortIndicators />
    </group>
  )
}
