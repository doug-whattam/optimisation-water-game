/**
 * One board cell, rendered as an extruded block rather than a flat plane.
 *
 * Giving each tile real thickness (with exposed earth on the sides) is what
 * makes the board read as a physical model on a table instead of a texture on
 * the ground. Geometry is shared across all 36 tiles and materials are cached
 * per land type, so the whole board is 36 draw calls for the ground plus a
 * highlight quad only on the tile under the cursor.
 */
import { useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { LAND_TYPE_COLORS, LAND_TYPE_EDGE_COLORS } from '@/types'
import { GROUND_Y, TILE_HEIGHT, TILE_SIZE } from './layout'

export type TileState = 'idle' | 'placeable' | 'blocked' | 'removable'

const GEOM_TILE = new THREE.BoxGeometry(TILE_SIZE, TILE_HEIGHT, TILE_SIZE)
const GEOM_OVERLAY = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE)
const GEOM_OUTLINE = new THREE.RingGeometry(TILE_SIZE * 0.46, TILE_SIZE * 0.5, 4, 1)

/**
 * BoxGeometry material slots are ordered +X, -X, +Y, -Y, +Z, -Z, so the land
 * colour goes on slot 2 and the earth colour everywhere else.
 */
const materialCache = new Map<string, THREE.Material[]>()

function tileMaterials(landType: string): THREE.Material[] {
  const cached = materialCache.get(landType)
  if (cached) return cached

  const top = new THREE.MeshStandardMaterial({
    color: LAND_TYPE_COLORS[landType] ?? '#6b7280',
    roughness: landType === 'river' ? 0.25 : 0.9,
    metalness: 0,
  })
  const side = new THREE.MeshStandardMaterial({
    color: LAND_TYPE_EDGE_COLORS[landType] ?? '#4b4235',
    roughness: 1,
    metalness: 0,
  })

  const mats = [side, side, top, side, side, side]
  materialCache.set(landType, mats)
  return mats
}

const OVERLAY_MATS: Record<Exclude<TileState, 'idle'>, THREE.Material> = {
  placeable: new THREE.MeshBasicMaterial({
    color: '#7dd3fc',
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  }),
  blocked: new THREE.MeshBasicMaterial({
    color: '#f87171',
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
  }),
  removable: new THREE.MeshBasicMaterial({
    color: '#fbbf24',
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  }),
}

const OUTLINE_MATS: Record<Exclude<TileState, 'idle'>, THREE.Material> = {
  placeable: new THREE.MeshBasicMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.9 }),
  blocked: new THREE.MeshBasicMaterial({ color: '#fecaca', transparent: true, opacity: 0.85 }),
  removable: new THREE.MeshBasicMaterial({ color: '#fde68a', transparent: true, opacity: 0.85 }),
}

interface Props {
  landType: string
  state: TileState
  /** Small vertical jitter so the board looks laid by hand, not stamped. */
  lift?: number
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void
  onPointerEnter?: (e: ThreeEvent<PointerEvent>) => void
  onPointerLeave?: (e: ThreeEvent<PointerEvent>) => void
  onContextMenu?: (e: ThreeEvent<MouseEvent>) => void
  children?: React.ReactNode
}

export default function TerrainTile({
  landType,
  state,
  lift = 0,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onContextMenu,
  children,
}: Props) {
  const materials = useMemo(() => tileMaterials(landType), [landType])
  const active = state !== 'idle'
  // Hovered tiles rise a touch — cheap, readable tactile feedback.
  const y = lift + (active ? 0.022 : 0)

  return (
    <group position={[0, y, 0]}>
      <mesh
        geometry={GEOM_TILE}
        material={materials}
        position={[0, TILE_HEIGHT / 2, 0]}
        receiveShadow
        castShadow
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onContextMenu={onContextMenu}
      />

      {active && (
        <>
          <mesh
            geometry={GEOM_OVERLAY}
            material={OVERLAY_MATS[state]}
            position={[0, GROUND_Y + 0.004, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
          <mesh
            geometry={GEOM_OUTLINE}
            material={OUTLINE_MATS[state]}
            position={[0, GROUND_Y + 0.006, 0]}
            rotation={[-Math.PI / 2, 0, Math.PI / 4]}
          />
        </>
      )}

      {/* Props and labels sit on the tile's top surface */}
      <group position={[0, GROUND_Y, 0]}>{children}</group>
    </group>
  )
}
