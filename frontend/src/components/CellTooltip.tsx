import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import {
  ASSET_COSTS,
  ASSET_LABELS,
  BUDGET,
  cellId,
  cellLabel,
  formatLandType,
  isDemandCell,
} from '@/types'

/**
 * Hover readout for the tile under the cursor.
 *
 * Content comes from the store's `hoveredCell`, which the 3D scene already
 * maintains; only the screen position needs the pointer. The previous version
 * routed everything through a bespoke `cell-hover` CustomEvent dispatched from
 * the scene, which meant two sources of truth for what was hovered.
 */
export default function CellTooltip() {
  const hoveredCell = useGameStore((s) => s.hoveredCell)
  const gridConfig = useGameStore((s) => s.gridConfig)
  const placedAssets = useGameStore((s) => s.placedAssets)
  const selectedAssetType = useGameStore((s) => s.selectedAssetType)
  const totalCost = useGameStore((s) => s.totalCost)
  const playerState = useGameStore((s) => s.playerState)

  const [pos, setPos] = useState({ x: 0, y: 0 })
  const frame = useRef(0)

  // Only listen while something is hovered, and coalesce to one update a frame.
  useEffect(() => {
    if (!hoveredCell) return

    function onMove(e: PointerEvent) {
      if (frame.current) return
      frame.current = requestAnimationFrame(() => {
        frame.current = 0
        setPos({ x: e.clientX, y: e.clientY })
      })
    }

    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame.current) cancelAnimationFrame(frame.current)
      frame.current = 0
    }
  }, [hoveredCell])

  if (!hoveredCell) return null

  const cell = gridConfig.find((c) => c.row === hoveredCell.row && c.col === hoveredCell.col)
  if (!cell) return null

  const occupied = placedAssets.find(
    (a) => a.row === hoveredCell.row && a.col === hoveredCell.col,
  )
  const demand = isDemandCell(cell.row, cell.col)

  const placementCost = selectedAssetType
    ? ASSET_COSTS[selectedAssetType] + cell.installation_cost
    : null
  const affordable = placementCost === null || totalCost + placementCost <= BUDGET

  // Flip to the left of the cursor near the right edge of the window.
  const flip = pos.x > window.innerWidth - 240

  return (
    <div
      key={cellId(cell.row, cell.col)}
      className="pointer-events-none fixed z-40 w-[210px] rounded-lg border border-ink-600 bg-ink-900/96
        p-2.5 shadow-panel backdrop-blur-sm"
      style={{
        left: flip ? pos.x - 222 : pos.x + 16,
        top: Math.min(pos.y + 12, window.innerHeight - 150),
      }}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-slate-100">{formatLandType(cell.land_type)}</span>
        <span className="stat text-[10px] text-slate-500">{cellLabel(cell.row, cell.col)}</span>
      </div>

      {demand ? (
        <p className="mt-1.5 text-[11px] leading-snug text-slate-400">
          Customer tank. Bring a port up against any face of this cell to connect.
        </p>
      ) : (
        <dl className="mt-1.5 space-y-1 text-[11px]">
          <Row label="Installation" value={`${cell.installation_cost.toLocaleString()} cr`} />

          {occupied && (
            <Row
              label="Placed"
              value={`${ASSET_LABELS[occupied.asset_type]} · ${occupied.rotation_degrees}°`}
            />
          )}

          {!occupied && placementCost !== null && playerState === 'designing' && (
            <Row
              label="Place here"
              value={`${placementCost.toLocaleString()} cr`}
              tone={affordable ? 'default' : 'bad'}
            />
          )}
        </dl>
      )}

      {!occupied && !affordable && (
        <p className="mt-1.5 text-[10px] leading-snug text-bad">Exceeds remaining budget.</p>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'bad'
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`stat ${tone === 'bad' ? 'text-bad' : 'text-slate-300'}`}>{value}</dd>
    </div>
  )
}
