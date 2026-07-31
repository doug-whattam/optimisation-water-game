import { useState } from 'react'
import { LAND_TYPE_COLORS, LAND_TYPE_COSTS, LandType, formatLandType } from '@/types'

const ORDERED = (Object.values(LandType) as LandType[]).sort(
  (a, b) => LAND_TYPE_COSTS[a] - LAND_TYPE_COSTS[b],
)

/**
 * Installation cost by land type, cheapest first.
 *
 * Routing is the core cost decision in this game, and the information was
 * previously only discoverable by hovering tiles one at a time. Sorting by price
 * makes the strategy legible: cross the river once, run along rural ground.
 */
export default function LandLegend() {
  const [open, setOpen] = useState(false)

  return (
    <div className="panel-section">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between"
      >
        <h3 className="section-title">Ground cost</h3>
        <Chevron open={open} />
      </button>

      {open && (
        <ul className="mt-3 space-y-1">
          {ORDERED.map((land) => (
            <li key={land} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <span
                  className="h-2.5 w-2.5 rounded-sm ring-1 ring-inset ring-black/30"
                  style={{ background: LAND_TYPE_COLORS[land] }}
                  aria-hidden
                />
                {formatLandType(land)}
              </span>
              <span className="stat text-slate-400">
                {(LAND_TYPE_COSTS[land] / 1000).toFixed(1)}k
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path d="M2.5 4.5L6 8l3.5-3.5" />
    </svg>
  )
}
