/**
 * Translucent preview of the asset about to be placed, drawn on the hovered
 * cell at the current pending rotation.
 *
 * Without this, rotation is invisible until after placement — the player had to
 * place, look, and rotate to correct. Showing the orientation up front is the
 * single biggest usability gain in the build loop.
 *
 * Subscribes to the store directly and sits outside GridScene's render path so
 * that pointer movement doesn't re-render the whole 36-tile board.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'
import { ASSET_COSTS, BUDGET, isDemandCell } from '@/types'
import { AssetGeometry } from './PlacedAssetModel'
import { PIPE_Y, cellToWorld } from './layout'

export default function GhostAsset() {
  const hoveredCell = useGameStore((s) => s.hoveredCell)
  const selectedAssetType = useGameStore((s) => s.selectedAssetType)
  const pendingRotation = useGameStore((s) => s.pendingRotation)
  const playerState = useGameStore((s) => s.playerState)
  const placedAssets = useGameStore((s) => s.placedAssets)
  const gridConfig = useGameStore((s) => s.gridConfig)
  const totalCost = useGameStore((s) => s.totalCost)

  const group = useRef<THREE.Group>(null)

  // Gentle hover so the preview reads as provisional rather than placed.
  useFrame((state) => {
    if (group.current) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.012
    }
  })

  if (playerState !== 'designing' || !selectedAssetType || !hoveredCell) return null

  const { row, col } = hoveredCell
  if (isDemandCell(row, col)) return null

  const occupied = placedAssets.some((a) => a.row === row && a.col === col)
  if (occupied) return null

  const cell = gridConfig.find((c) => c.row === row && c.col === col)
  if (!cell) return null

  const affordable = totalCost + ASSET_COSTS[selectedAssetType] + cell.installation_cost <= BUDGET
  const [x, , z] = cellToWorld(row, col)

  return (
    <group position={[x, 0, z]}>
      <group ref={group}>
        <group rotation={[0, -(pendingRotation * Math.PI) / 180, 0]}>
          <AssetGeometry
            type={selectedAssetType}
            skin={affordable ? 'ghost' : 'ghost-invalid'}
          />
        </group>
      </group>
      {/* Direction pip marking the asset's primary inlet at this rotation */}
      <RotationPip rotation={pendingRotation} valid={affordable} />
    </group>
  )
}

const GEOM_PIP = new THREE.ConeGeometry(0.035, 0.07, 4)
const MAT_PIP_OK = new THREE.MeshBasicMaterial({ color: '#e0f2fe' })
const MAT_PIP_BAD = new THREE.MeshBasicMaterial({ color: '#fecaca' })

/**
 * Small arrow on the north face at 0°, rotating with the asset. Gives the
 * player an unambiguous read on "which way is this thing facing".
 */
function RotationPip({ rotation, valid }: { rotation: number; valid: boolean }) {
  return (
    <group rotation={[0, -(rotation * Math.PI) / 180, 0]}>
      <mesh
        geometry={GEOM_PIP}
        material={valid ? MAT_PIP_OK : MAT_PIP_BAD}
        position={[0, PIPE_Y + 0.1, -0.32]}
        rotation={[Math.PI, 0, 0]}
      />
    </group>
  )
}
