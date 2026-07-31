import { useState } from 'react'
import { DEMAND_NODES } from '@/types'

/**
 * Condensed brief in the rail. The full rules and shortcut list live in the help
 * overlay, so this stays short enough to leave room for the tools above it.
 */
export default function Instructions() {
  const [open, setOpen] = useState(false)

  return (
    <div className="panel-section">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between"
      >
        <h3 className="section-title">Brief</h3>
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
      </button>

      {open && (
        <div className="mt-3 space-y-2.5 text-[11px] leading-relaxed text-slate-400">
          <p>
            Route water from the elevated reservoir to all {DEMAND_NODES.length} customer tanks. You
            are scored on two objectives at once: total cost and hydraulic penalty.
          </p>
          <p>
            The valve shuts as soon as the first tank reaches its {DEMAND_NODES[0].twl} m target, so
            every other tank is charged whatever it is short. Balanced beats fast.
          </p>
          <p className="text-slate-500">
            Ports must face each other for a joint to carry flow — watch the green and red markers
            while you build.
          </p>
        </div>
      )}
    </div>
  )
}
