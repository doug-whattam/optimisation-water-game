/**
 * The board: terrain tiles, labels, reservoir, tanks, and the player's pipework.
 *
 * Interaction model (new):
 *   left press on empty cell   → place, and start a paint stroke
 *   left drag across cells     → keep placing; the whole stroke is one undo step
 *   left click on placed asset → rotate it
 *   right press / drag         → remove
 *
 * Painting matters because a typical run is 8-12 cells; placing those one click
 * at a time was the bulk of the interaction cost.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Text } from '@react-three/drei'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'
import type { PlacedAsset } from '@/types'
import {
  ASSET_COSTS,
  BUDGET,
  COLUMNS,
  DEMAND_NODES,
  Direction,
  ROWS,
  cellId,
  isDemandCell,
} from '@/types'
import { computeRotatedPorts, getNeighbor, OPPOSITE } from '@/utils/portAlignment'
import { analyseConnectivity } from '@/utils/pathfinding'
import { AnimationClock } from './animatedMaterials'
import AnimatedRiver from './AnimatedRiver'
import AnimatedTrain from './AnimatedTrain'
import GhostAsset from './GhostAsset'
import PlacedAssetModel from './PlacedAssetModel'
import PortIndicators from './PortIndicators'
import ReservoirModel from './ReservoirModel'
import TankModel from './TankModel'
import TerrainProps from './TerrainProps'
import TerrainTile, { type TileState } from './TerrainTile'
import {
  BOARD_CENTER,
  CELL_SIZE,
  GRID_DEPTH,
  GRID_WIDTH,
  GROUND_Y,
  RESERVOIR_POS,
  cellNoise,
  cellToWorld,
  tankOffsetX,
} from './layout'

type PaintMode = 'place' | 'remove'

export default function GridScene() {
  const gridConfig = useGameStore((s) => s.gridConfig)
  const placedAssets = useGameStore((s) => s.placedAssets)
  const tankLevels = useGameStore((s) => s.tankLevels)
  const selectedAssetType = useGameStore((s) => s.selectedAssetType)
  const playerState = useGameStore((s) => s.playerState)
  const totalCost = useGameStore((s) => s.totalCost)
  const simulationResult = useGameStore((s) => s.simulationResult)

  const designing = playerState === 'designing'
  const showFlow = playerState === 'simulating' || playerState === 'results'

  /** Which pipework is actually fed from the reservoir. */
  const { reachable } = useMemo(() => analyseConnectivity(placedAssets), [placedAssets])

  const assetByCell = useMemo(
    () => new Map(placedAssets.map((a) => [cellId(a.row, a.col), a])),
    [placedAssets],
  )

  /* --------------------------------------------------------- paint gesture */

  const paintMode = useRef<PaintMode | null>(null)
  const controls = useThree((s) => s.controls) as { enabled: boolean } | null

  const applyAt = useCallback((row: number, col: string, mode: PaintMode) => {
    const store = useGameStore.getState()
    if (mode === 'place') store.placeAsset(row, col)
    else store.removeAsset(row, col)
  }, [])

  /**
   * Suspend the orbit controls for the duration of a stroke.
   *
   * OrbitControls applies rotation in its pointermove handler, and that handler
   * returns early when `enabled` is false — so flipping the flag on pointerdown
   * reliably stops the camera moving, regardless of listener ordering between
   * R3F's event system and the controls.
   */
  const beginPaint = useCallback(
    (mode: PaintMode) => {
      paintMode.current = mode
      if (controls) controls.enabled = false
      useGameStore.getState().beginStroke()
    },
    [controls],
  )

  // A stroke can end anywhere — over a tile, over the sky, or outside the
  // canvas entirely — so the release is handled on the window.
  useEffect(() => {
    function endPaint() {
      if (paintMode.current === null) return
      paintMode.current = null
      if (controls) controls.enabled = true
      useGameStore.getState().endStroke()
    }
    window.addEventListener('pointerup', endPaint)
    window.addEventListener('pointercancel', endPaint)
    window.addEventListener('blur', endPaint)
    return () => {
      window.removeEventListener('pointerup', endPaint)
      window.removeEventListener('pointercancel', endPaint)
      window.removeEventListener('blur', endPaint)
      // Never leave the camera locked if this unmounts mid-stroke.
      if (controls) controls.enabled = true
    }
  }, [controls])

  const handlePointerDown = useCallback(
    (row: number, col: string, e: ThreeEvent<PointerEvent>) => {
      if (!designing || isDemandCell(row, col)) return
      e.stopPropagation()

      const store = useGameStore.getState()
      const occupied = store.placedAssets.some((a) => a.row === row && a.col === col)

      // Right button removes, and drags to keep removing.
      if (e.button === 2) {
        beginPaint('remove')
        store.removeAsset(row, col)
        return
      }

      if (e.button !== 0) return

      // Left click on an existing asset cycles its rotation. Not a stroke —
      // dragging over neighbours shouldn't spin the whole run.
      if (occupied) {
        store.rotateAsset(row, col)
        return
      }

      if (!store.selectedAssetType) return
      beginPaint('place')
      store.placeAsset(row, col)
    },
    [designing, beginPaint],
  )

  const handlePointerEnter = useCallback(
    (row: number, col: string) => {
      useGameStore.getState().setHoveredCell({ row, col })
      if (!designing || isDemandCell(row, col)) return
      if (paintMode.current) applyAt(row, col, paintMode.current)
    },
    [designing, applyAt],
  )

  const handlePointerLeave = useCallback((row: number, col: string) => {
    const current = useGameStore.getState().hoveredCell
    // Only clear if we're still the cell being reported, otherwise a fast move
    // between tiles can clear the newly-entered one.
    if (current?.row === row && current?.col === col) {
      useGameStore.getState().setHoveredCell(null)
    }
  }, [])

  const suppressContextMenu = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.nativeEvent.preventDefault()
    e.stopPropagation()
  }, [])

  /* ------------------------------------------------------------ tile state */

  const tileState = useCallback(
    (row: number, col: string, landType: string, installationCost: number): TileState => {
      if (!designing) return 'idle'
      if (landType.includes('demand')) return 'idle'
      if (assetByCell.has(cellId(row, col))) return 'removable'
      if (!selectedAssetType) return 'idle'
      const affordable = totalCost + ASSET_COSTS[selectedAssetType] + installationCost <= BUDGET
      return affordable ? 'placeable' : 'blocked'
    },
    [designing, assetByCell, selectedAssetType, totalCost],
  )

  return (
    <group>
      <AnimationClock />
      <BoardPlinth />
      <BoardLabels />

      {/* Terrain */}
      {gridConfig.map((cell) => {
        const [x, , z] = cellToWorld(cell.row, cell.col)
        const isDemand = cell.land_type.includes('demand')
        return (
          <group key={cellId(cell.row, cell.col)} position={[x, 0, z]}>
            <TerrainTile
              landType={cell.land_type}
              state={tileState(cell.row, cell.col, cell.land_type, cell.installation_cost)}
              lift={cellNoise(cell.row, cell.col) * 0.012}
              onPointerDown={(e) => handlePointerDown(cell.row, cell.col, e)}
              onPointerEnter={() => handlePointerEnter(cell.row, cell.col)}
              onPointerLeave={() => handlePointerLeave(cell.row, cell.col)}
              onContextMenu={suppressContextMenu}
            >
              <TerrainProps landType={cell.land_type} />
              {!isDemand && cell.installation_cost > 0 && (
                <CellCostLabel cost={cell.installation_cost} />
              )}
            </TerrainTile>
          </group>
        )
      })}

      <AnimatedTrain />
      <AnimatedRiver />

      {/* Source */}
      <group position={RESERVOIR_POS}>
        <ReservoirModel flowing={showFlow} />
      </group>

      {/* Demand tanks */}
      {DEMAND_NODES.map((node) => {
        const level = tankLevels[node.key] ?? 0
        const [baseX, , baseZ] = cellToWorld(node.row, node.col)
        const inletDir = findInletDirection(node.row, node.col, assetByCell)
        return (
          <group key={node.key} position={[baseX + tankOffsetX(node.col), 0, baseZ]}>
            <TankModel
              name={node.name}
              fillFraction={level / node.twl}
              showConnection={inletDir !== null}
              connectionSide={node.col === COLUMNS[0] ? 'right' : 'left'}
              connectingDirection={inletDir}
              penalty={simulationResult?.individual_penalties?.[node.key] ?? 0}
            />
          </group>
        )
      })}

      {/* Player pipework */}
      {placedAssets.map((asset) => {
        const [x, , z] = cellToWorld(asset.row, asset.col)
        return (
          <group key={cellId(asset.row, asset.col)} position={[x, 0, z]}>
            <PlacedAssetModel
              asset={asset}
              wet={showFlow && reachable.has(cellId(asset.row, asset.col))}
            />
          </group>
        )
      })}

      <GhostAsset />
      <PortIndicators />
    </group>
  )
}

/**
 * Direction from which pipework enters a demand cell, or null if nothing
 * connects. Used to route the tank's inlet pipe to the right face.
 */
function findInletDirection(
  row: number,
  col: string,
  assetByCell: Map<string, PlacedAsset>,
): Direction | null {
  for (const dir of [Direction.North, Direction.East, Direction.South, Direction.West]) {
    const neighbor = getNeighbor(row, col, dir)
    if (!neighbor) continue
    const neighborAsset = assetByCell.get(cellId(neighbor.row, neighbor.col))
    if (!neighborAsset) continue
    const ports = computeRotatedPorts(neighborAsset.asset_type, neighborAsset.rotation_degrees)
    // A neighbour to our `dir` connects if it has a port facing back at us.
    if (ports.includes(OPPOSITE[dir])) return dir
  }
  return null
}

/* -------------------------------------------------------------- decoration */

const MAT_PLINTH_TOP = new THREE.MeshStandardMaterial({
  color: '#3f4a37',
  roughness: 0.95,
  metalness: 0,
})
const MAT_PLINTH_SIDE = new THREE.MeshStandardMaterial({
  color: '#2b3324',
  roughness: 1,
  metalness: 0,
})

/**
 * Base the tiles sit on, so the board reads as a built model.
 *
 * The margin has to clear the row/column labels, which sit one cell-width out
 * from the edge tiles — otherwise they hang over the side onto the grass.
 */
function BoardPlinth() {
  const [cx, , cz] = BOARD_CENTER
  // 2.5 cells of margin: enough for the labels plus the train's return leg and
  // its turn past F, which both sit outside the tile grid.
  const margin = CELL_SIZE * 2.5
  const w = GRID_WIDTH + margin
  const d = GRID_DEPTH + margin
  const h = 0.1

  const materials = useMemo(
    () => [
      MAT_PLINTH_SIDE,
      MAT_PLINTH_SIDE,
      MAT_PLINTH_TOP,
      MAT_PLINTH_SIDE,
      MAT_PLINTH_SIDE,
      MAT_PLINTH_SIDE,
    ],
    [],
  )
  const geometry = useMemo(() => new THREE.BoxGeometry(w, h, d), [w, h, d])

  return (
    <mesh geometry={geometry} material={materials} position={[cx, h / 2 - 0.001, cz]} receiveShadow />
  )
}

/**
 * Column letters and row numbers around the edge of the board.
 *
 * Pulled in from 0.82 to 0.66 so the column letters sit in the gap between the
 * tile edge and the train's return leg at z=-0.98 rather than under it.
 */
function BoardLabels() {
  const edge = CELL_SIZE * 0.66

  return (
    <group>
      {COLUMNS.map((col, idx) => (
        <Text
          key={`col-${col}`}
          position={[idx * CELL_SIZE, GROUND_Y + 0.005, -edge]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.24}
          color="#e8f2fa"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor="#1b2415"
        >
          {col}
        </Text>
      ))}
      {ROWS.map((row) => (
        <Text
          key={`row-${row}`}
          position={[-edge, GROUND_Y + 0.005, (row - 1) * CELL_SIZE]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.24}
          color="#e8f2fa"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor="#1b2415"
        >
          {String(row)}
        </Text>
      ))}
    </group>
  )
}

/**
 * Installation cost stamped on the tile.
 *
 * The original also printed the land type on every cell, which produced 36
 * overlapping strings across the board. The land type is now conveyed by the
 * tile colour and its 3D props, with the full name available on hover, so only
 * the number the player is actually budgeting against is drawn here.
 */
function CellCostLabel({ cost }: { cost: number }) {
  return (
    <Text
      position={[0, 0.004, 0.36]}
      rotation={[-Math.PI / 2, 0, 0]}
      fontSize={0.088}
      color="#f8fafc"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.007}
      outlineColor="#0f172a"
    >
      {`${(cost / 1000).toFixed(0)}k`}
    </Text>
  )
}
