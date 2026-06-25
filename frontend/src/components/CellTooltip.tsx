import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

/**
 * Shows tooltip with land type and installation cost when hovering a grid cell.
 * Listens for a custom event dispatched from the 3D scene.
 */
export default function CellTooltip() {
  const gridConfig = useGameStore((s) => s.gridConfig)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; cell: typeof gridConfig[0] } | null>(null)

  useEffect(() => {
    function handleShow(e: CustomEvent) {
      const { row, col, clientX, clientY } = e.detail
      const cell = gridConfig.find(c => c.row === row && c.col === col)
      if (cell) {
        setTooltip({ x: clientX, y: clientY, cell })
      }
    }
    function handleHide() {
      setTooltip(null)
    }

    window.addEventListener('cell-hover' as any, handleShow)
    window.addEventListener('cell-leave' as any, handleHide)
    return () => {
      window.removeEventListener('cell-hover' as any, handleShow)
      window.removeEventListener('cell-leave' as any, handleHide)
    }
  }, [gridConfig])

  if (!tooltip) return null

  const landTypeLabel = tooltip.cell.land_type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(' Demand', '')

  return (
    <div
      className="fixed z-50 px-3 py-2 bg-[#1a1a2e] border border-water/50 rounded-lg shadow-lg text-xs pointer-events-none"
      style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
    >
      <div className="font-semibold text-gray-200">{landTypeLabel}</div>
      {tooltip.cell.installation_cost > 0 && (
        <div className="text-gray-400">Install: {tooltip.cell.installation_cost.toLocaleString()} credits</div>
      )}
      <div className="text-gray-500">{tooltip.cell.col}{tooltip.cell.row}</div>
    </div>
  )
}
