/**
 * Port alignment feedback shown while designing.
 *
 * Green means two facing ports meet (or the port feeds the reservoir inlet / a
 * demand tank); red means a port opens onto nothing. This is the main signal a
 * player uses to debug a broken run, so the markers sit slightly above pipe
 * height and use unlit materials to stay readable against any background.
 */
import { useMemo } from 'react'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'
import { Direction, RESERVOIR_ENTRY, cellId, isDemandCell } from '@/types'
import { computeRotatedPorts, getNeighbor, OPPOSITE } from '@/utils/portAlignment'
import { HALF_CELL, PIPE_Y, cellToWorld } from './layout'

const GEOM_DOT = new THREE.SphereGeometry(0.028, 10, 8)
const GEOM_HALO = new THREE.RingGeometry(0.036, 0.052, 12)

const MAT_OK = new THREE.MeshBasicMaterial({ color: '#4ade80' })
const MAT_BAD = new THREE.MeshBasicMaterial({ color: '#f87171' })
const MAT_HALO_BAD = new THREE.MeshBasicMaterial({
  color: '#f87171',
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide,
})

/** Offset from cell centre to the midpoint of each face. */
const FACE_OFFSET: Record<Direction, [number, number]> = {
  [Direction.North]: [0, -HALF_CELL],
  [Direction.South]: [0, HALF_CELL],
  [Direction.East]: [HALF_CELL, 0],
  [Direction.West]: [-HALF_CELL, 0],
}

interface Marker {
  key: string
  position: [number, number, number]
  connected: boolean
}

export default function PortIndicators() {
  const placedAssets = useGameStore((s) => s.placedAssets)
  const playerState = useGameStore((s) => s.playerState)

  const markers = useMemo<Marker[]>(() => {
    if (placedAssets.length === 0) return []

    const assetMap = new Map(placedAssets.map((a) => [cellId(a.row, a.col), a]))
    const out: Marker[] = []
    // Two assets share a face; only draw one marker there.
    const seenFaces = new Set<string>()

    for (const asset of placedAssets) {
      const ports = computeRotatedPorts(asset.asset_type, asset.rotation_degrees)
      const [wx, , wz] = cellToWorld(asset.row, asset.col)

      for (const dir of ports) {
        const neighbor = getNeighbor(asset.row, asset.col, dir)
        const [dx, dz] = FACE_OFFSET[dir]

        // Canonical face id, so the same seam isn't evaluated twice.
        const faceId = neighbor
          ? [cellId(asset.row, asset.col), cellId(neighbor.row, neighbor.col)].sort().join('|')
          : `${cellId(asset.row, asset.col)}|edge-${dir}`
        if (seenFaces.has(faceId)) continue
        seenFaces.add(faceId)

        let connected: boolean
        if (!neighbor) {
          // Port opens off the edge of the board.
          connected = false
        } else if (isDemandCell(neighbor.row, neighbor.col)) {
          connected = true
        } else {
          const neighborAsset = assetMap.get(cellId(neighbor.row, neighbor.col))
          connected = neighborAsset
            ? computeRotatedPorts(neighborAsset.asset_type, neighborAsset.rotation_degrees).includes(
                OPPOSITE[dir],
              )
            : false
        }

        // The reservoir drops into the entry cell from above, so a north-facing
        // port there is fed even though there is no cell to the north.
        if (
          !connected &&
          dir === Direction.North &&
          asset.row === RESERVOIR_ENTRY.row &&
          asset.col === RESERVOIR_ENTRY.col
        ) {
          connected = true
        }

        out.push({
          key: faceId,
          position: [wx + dx, PIPE_Y + 0.005, wz + dz],
          connected,
        })
      }
    }

    return out
  }, [placedAssets])

  if (playerState !== 'designing' || markers.length === 0) return null

  return (
    <group>
      {markers.map((m) => (
        <group key={m.key} position={m.position}>
          <mesh geometry={GEOM_DOT} material={m.connected ? MAT_OK : MAT_BAD} />
          {/* Open ports get a halo so unfinished runs are easy to spot */}
          {!m.connected && (
            <mesh geometry={GEOM_HALO} material={MAT_HALO_BAD} rotation={[-Math.PI / 2, 0, 0]} />
          )}
        </group>
      ))}
    </group>
  )
}
