import { useEffect } from 'react'
import { ASSET_LABELS, ASSET_SHORTCUTS, AssetType, BUDGET, DEMAND_NODES } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
}

const MOUSE = [
  ['Left drag on tiles', 'Lay a run of pipework'],
  ['Left click a placed piece', 'Rotate it 90°'],
  ['Right click or drag', 'Remove pipework'],
  ['Left drag on empty space', 'Orbit the camera'],
  ['Scroll', 'Zoom'],
  ['Middle drag', 'Pan'],
]

const KEYS: [string, string][] = [
  ...(Object.values(AssetType) as AssetType[]).map(
    (t) => [ASSET_SHORTCUTS[t], `Select ${ASSET_LABELS[t].toLowerCase()}`] as [string, string],
  ),
  ['R', 'Rotate the piece you are about to place'],
  ['Ctrl + Z', 'Undo'],
  ['Ctrl + Shift + Z', 'Redo'],
  ['Esc', 'Deselect'],
  ['?', 'Toggle this panel'],
]

/** Consolidated rules and shortcuts, on demand rather than taking up rail space. */
export default function ShortcutsOverlay({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink-950/75 p-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="How to play"
    >
      <div
        className="max-h-full w-full max-w-3xl animate-fade-up overflow-y-auto rounded-2xl border border-ink-700 bg-ink-850 p-6 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">How to play</h2>
            <p className="mt-1 text-xs text-slate-500">
              Minimise cost and hydraulic penalty at the same time. Both matter.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-ink-800 hover:text-slate-200"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <h3 className="section-title mb-2.5">The objective</h3>
            <ol className="space-y-2 text-xs leading-relaxed text-slate-400">
              <li>
                <Step n={1} /> Lay pipework from the reservoir outlet at the north face of{' '}
                <Ref>A1</Ref> out to the {DEMAND_NODES.length} customer tanks.
              </li>
              <li>
                <Step n={2} /> Ports must face each other. Green markers mean a joint is made, red
                means a port opens onto nothing.
              </li>
              <li>
                <Step n={3} /> Every piece costs its fitting price plus the installation cost of the
                ground it sits on. Budget is {BUDGET.toLocaleString()} credits.
              </li>
              <li>
                <Step n={4} /> Open the valve. The run stops the moment the first tank reaches its{' '}
                {DEMAND_NODES[0].twl} m target.
              </li>
              <li>
                <Step n={5} /> Every other tank is charged the shortfall below target. Those metres
                summed are your hydraulic penalty.
              </li>
            </ol>

            <p className="mt-3 rounded-lg border border-water/25 bg-water/8 p-2.5 text-xs leading-relaxed text-slate-300">
              Because the valve closes on the <em>first</em> tank to fill, balancing the network
              matters more than over-sizing one branch. A cheap design that fills all four evenly
              beats an expensive one that races a single tank to target.
            </p>
          </section>

          <div className="space-y-6">
            <section>
              <h3 className="section-title mb-2.5">Mouse</h3>
              <dl className="space-y-1.5">
                {MOUSE.map(([action, effect]) => (
                  <div key={action} className="flex items-baseline justify-between gap-4 text-xs">
                    <dt className="text-slate-400">{action}</dt>
                    <dd className="shrink-0 text-right text-slate-500">{effect}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section>
              <h3 className="section-title mb-2.5">Keyboard</h3>
              <dl className="space-y-1.5">
                {KEYS.map(([key, effect]) => (
                  <div key={key} className="flex items-baseline justify-between gap-4 text-xs">
                    <dt>
                      <span className="kbd">{key}</span>
                    </dt>
                    <dd className="text-right text-slate-500">{effect}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step({ n }: { n: number }) {
  return (
    <span className="mr-1.5 inline-grid h-4 w-4 place-content-center rounded-full bg-ink-700 text-[9px] font-bold text-slate-300 align-[1px]">
      {n}
    </span>
  )
}

function Ref({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-ink-900 px-1 font-mono text-[11px] text-water-light">{children}</code>
}
