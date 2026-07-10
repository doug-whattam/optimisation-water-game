import { Text } from '@react-three/drei'
import { ThreeEvent } from '@react-three/fiber'
import { useGameStore } from '@/store/gameStore'
import { DEMAND_NODES, COLUMNS, ROWS, Direction } from '@/types'
import { computeRotatedPorts, getNeighbor, OPPOSITE } from '@/utils/portAlignment'
import TerrainTile from './TerrainTile'
import ReservoirModel from './ReservoirModel'
import TankModel from './TankModel'
import PlacedAssetModel from './PlacedAssetModel'
import PortIndicators from './PortIndicators'
import AnimatedTrain from './AnimatedTrain'
import AnimatedRiver from './AnimatedRiver'

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

  // Check if a demand node cell is connected to pipework and from which direction
  function getDemandConnectionDirection(demandRow: number, demandCol: string): Direction | null {
    const assetMap = new Map<string, typeof placedAssets[0]>()
    for (const asset of placedAssets) {
      assetMap.set(`${asset.row}_${asset.col}`, asset)
    }
    // Check each adjacent cell for a port pointing toward this demand node
    const allDirs: Direction[] = [Direction.North, Direction.East, Direction.South, Direction.West]
    for (const dir of allDirs) {
      const neighbor = getNeighbor(demandRow, demandCol, dir)
      if (!neighbor) continue
      const neighborAsset = assetMap.get(`${neighbor.row}_${neighbor.col}`)
      if (neighborAsset) {
        const ports = computeRotatedPorts(neighborAsset.asset_type, neighborAsset.rotation_degrees)
        if (ports.includes(OPPOSITE[dir])) {
          // This neighbor has a port pointing toward the demand cell from direction 'dir'
          // That means the pipe enters the demand cell FROM direction 'dir'
          return dir
        }
      }
    }
    return null
  }

  function handleCellClick(row: number, col: string, e: ThreeEvent<MouseEvent>) {
    if (playerState !== 'designing') return
    e.stopPropagation()

    const isDemand = DEMAND_NODES.some((d) => d.row === row && d.col === col)
    if (isDemand) return

    const existing = placedAssets.find((a) => a.row === row && a.col === col)
    if (existing) {
      rotateAsset(row, col)
      return
    }

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

      {/* Column labels - positioned above the grid */}
      {COLUMNS.map((col, idx) => (
        <Text
          key={`col-${col}`}
          position={[idx * CELL_SIZE, 0.01, -0.9]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {col}
        </Text>
      ))}

      {/* Row labels - positioned to the left of the grid */}
      {ROWS.map((row) => (
        <Text
          key={`row-${row}`}
          position={[-0.9, 0.01, (row - 1) * CELL_SIZE]}
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
        const isDemand = cell.land_type.includes('demand')
        const isPlaced = placedAssets.some((a) => a.row === cell.row && a.col === cell.col)

        // Format label for the cell
        const isDemandCell = cell.land_type.includes('demand')
        let landLabel = cell.land_type
          .replace(/_demand$/, '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase())
        if (isDemandCell) landLabel += ' Demand'
        const costLabel = cell.installation_cost > 0 ? `${(cell.installation_cost / 1000).toFixed(0)}k` : ''
        const fullLabel = costLabel ? `${landLabel} ${costLabel}` : landLabel

        return (
          <group key={`${cell.row}-${cell.col}`} position={[x, 0, z]}>
            <TerrainTile
              landType={cell.land_type}
              onClick={(e) => handleCellClick(cell.row, cell.col, e)}
              onContextMenu={(e) => handleCellRightClick(cell.row, cell.col, e)}
              isHighlighted={!isDemand && !isPlaced && !!selectedAssetType && playerState === 'designing'}
            />
            {/* Cell label with name and cost */}
            <Text
              position={[0, 0.02, -0.35]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.065}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.004}
              outlineColor="#000000"
            >
              {fullLabel}
            </Text>
          </group>
        )
      })}

      {/* Reservoir - positioned above the grid, outside */}
      <group position={[0, 0, -1.5]}>
        <ReservoirModel />
      </group>

      {/* Outlet pipe from reservoir to the edge of the grid (ends at column A label, z=-0.9) */}
      {/* Reservoir legs go from y=0 to y=2.5. Pipe drops from bottom of tank (y=2.5) to ground. */}
      {/* Then runs horizontally from z=-1.5 to z=-0.5 (just before the grid starts at z=0) */}

      {/* Vertical segment: drops from reservoir tank bottom (y=2.5) to ground level (y=0.08) */}
      <mesh position={[0, 1.25, -1.5]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 2.44, 10]} />
        <meshStandardMaterial color="#78909C" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Elbow joint at ground level */}
      <mesh position={[0, 0.08, -1.5]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#607D8B" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Horizontal segment: from z=-1.5 to z=-0.5 (stops at grid edge, at the "A" label) */}
      <mesh position={[0, 0.08, -1.0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.0, 10]} />
        <meshStandardMaterial color="#78909C" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* End cap / flange at grid edge (z=-0.5) */}
      <mesh position={[0, 0.08, -0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 0.03, 10]} />
        <meshStandardMaterial color="#546E7A" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Animated train spanning railway cells (Row 1: B1-F1) */}
      <AnimatedTrain />

      {/* Animated river spanning river cells (Row 4: A4-F4) */}
      <AnimatedRiver />

      {/* Demand node tanks - positioned further outside the board */}
      {DEMAND_NODES.map((node) => {
        const level = tankLevels[node.key] ?? 0
        const fraction = level / node.twl
        const [baseX, , baseZ] = cellToWorld(node.row, node.col)
        // Tanks further outside: col A to the left (-0.7), col F to the right (+0.7)
        const xOffset = node.col === 'A' ? -0.7 : node.col === 'F' ? 0.7 : 0
        const connectingDir = getDemandConnectionDirection(node.row, node.col)
        const connected = connectingDir !== null
        const connectionSide = node.col === 'A' ? 'right' as const : 'left' as const
        return (
          <group key={node.key} position={[baseX + xOffset, 0, baseZ]}>
            <TankModel
              name={node.name}
              fillFraction={fraction}
              showConnection={connected}
              connectionSide={connectionSide}
              connectingDirection={connectingDir}
            />
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
