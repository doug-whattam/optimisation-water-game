import { useGameStore } from '@/store/gameStore'
import { DEMAND_NODES } from '@/types'

export default function SimulationResults() {
  const simulationResult = useGameStore((s) => s.simulationResult)
  const setPlayerState = useGameStore((s) => s.setPlayerState)
  const lastPlanNumber = useGameStore((s) => s.lastPlanNumber)

  if (!simulationResult) return null

  const {
    stopping_tank,
    tank_levels,
    individual_penalties,
    hydraulic_penalty,
    total_cost,
    status,
    error_message,
  } = simulationResult

  if (status === 'failed') {
    return (
      <div className="panel-section">
        <h3 className="section-title text-bad">Simulation failed</h3>
        <p className="mt-2 rounded-md border border-bad/30 bg-bad/10 p-2.5 text-xs leading-relaxed text-slate-300">
          {error_message || 'The solver returned no result.'}
        </p>
        <button onClick={() => setPlayerState('designing')} className="btn-primary mt-3">
          Back to design
        </button>
      </div>
    )
  }

  const penalty = hydraulic_penalty ?? 0
  const perfect = penalty === 0

  return (
    <div className="panel-section animate-fade-up">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="section-title text-good">Results</h3>
        {lastPlanNumber !== null && (
          <span className="text-[11px] text-slate-500">Plan #{lastPlanNumber}</span>
        )}
      </div>

      {/* Two headline objectives, side by side — this is a bi-objective problem
          and the scoreboard should read that way. */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <Metric label="Total cost" value={total_cost.toLocaleString()} unit="cr" tone="neutral" />
        <Metric
          label="Hydraulic penalty"
          value={penalty.toFixed(2)}
          unit="m"
          tone={perfect ? 'good' : penalty < 2 ? 'warn' : 'bad'}
        />
      </div>

      {stopping_tank && (
        <p className="mb-3 rounded-md border border-good/25 bg-good/10 px-2.5 py-2 text-xs text-good">
          <strong className="font-semibold">{stopping_tank}</strong> hit its target level first and
          closed the valve.
        </p>
      )}

      <ul className="space-y-2.5">
        {DEMAND_NODES.map((node) => {
          const level = tank_levels?.[node.key] ?? 0
          const nodePenalty = individual_penalties?.[node.key] ?? node.twl
          const pct = Math.min((level / node.twl) * 100, 100)
          const isStopper = stopping_tank === node.name

          return (
            <li key={node.key}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  {node.name}
                  {isStopper && (
                    <span className="rounded bg-good/15 px-1 py-px text-[9px] uppercase tracking-wide text-good">
                      first
                    </span>
                  )}
                </span>
                <span className="stat text-slate-400">
                  {level.toFixed(2)}
                  <span className="text-slate-600">/{node.twl.toFixed(1)} m</span>
                </span>
              </div>

              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-950">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ${
                    nodePenalty === 0 ? 'bg-good' : pct > 50 ? 'bg-warn' : 'bg-bad'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {nodePenalty > 0 && (
                <p className="mt-0.5 text-[11px] text-bad">
                  {nodePenalty.toFixed(2)} m short of target
                </p>
              )}
            </li>
          )
        })}
      </ul>

      <button onClick={() => setPlayerState('designing')} className="btn-primary mt-4">
        Refine design
      </button>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        Your pipework is preserved — adjust and resubmit as a new plan.
      </p>
    </div>
  )
}

function Metric({
  label,
  value,
  unit,
  tone,
}: {
  label: string
  value: string
  unit: string
  tone: 'neutral' | 'good' | 'warn' | 'bad'
}) {
  const toneCls = {
    neutral: 'text-slate-100',
    good: 'text-good',
    warn: 'text-warn',
    bad: 'text-bad',
  }[tone]

  return (
    <div className="rounded-lg border border-ink-700 bg-ink-950/60 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`stat mt-1 text-lg font-semibold leading-none ${toneCls}`}>
        {value}
        <span className="ml-1 text-[11px] font-normal text-slate-500">{unit}</span>
      </div>
    </div>
  )
}
