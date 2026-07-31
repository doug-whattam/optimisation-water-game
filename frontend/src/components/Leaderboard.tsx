import { useMemo, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { BUDGET } from '@/types'

type SortKey = 'balanced' | 'cost' | 'penalty'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'balanced', label: 'Balanced' },
  { key: 'cost', label: 'Cost' },
  { key: 'penalty', label: 'Penalty' },
]

/**
 * Ranked plans.
 *
 * "Balanced" normalises both objectives against the observed range and ranks by
 * distance to the ideal point — the same idea as the previous implementation,
 * but the divisor now uses BUDGET as a floor so a single early submission can't
 * make its own cost the normalising maximum and score 1.0 by definition.
 * Sorting by either single objective is also available, since a player chasing
 * one end of the front wants to see that leaderboard.
 */
export default function Leaderboard() {
  const paretoDesigns = useGameStore((s) => s.paretoDesigns)
  const username = useGameStore((s) => s.username)
  const [sort, setSort] = useState<SortKey>('balanced')

  const ranked = useMemo(() => {
    if (paretoDesigns.length === 0) return []

    const costScale = Math.max(BUDGET, ...paretoDesigns.map((d) => d.total_cost))
    const penaltyScale = Math.max(1, ...paretoDesigns.map((d) => d.hydraulic_penalty))

    const scored = paretoDesigns.map((d) => ({
      ...d,
      score: Math.hypot(d.total_cost / costScale, d.hydraulic_penalty / penaltyScale),
    }))

    const comparators: Record<SortKey, (a: typeof scored[0], b: typeof scored[0]) => number> = {
      balanced: (a, b) => a.score - b.score,
      cost: (a, b) => a.total_cost - b.total_cost,
      penalty: (a, b) => a.hydraulic_penalty - b.hydraulic_penalty || a.total_cost - b.total_cost,
    }

    return scored.sort(comparators[sort]).slice(0, 12)
  }, [paretoDesigns, sort])

  if (paretoDesigns.length === 0) return null

  return (
    <div className="panel-section border-b-0">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="section-title">Leaderboard</h3>
        <div className="flex rounded-md border border-ink-700 bg-ink-950/60 p-0.5">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                sort === s.key ? 'bg-water/20 text-water-light' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1.4rem_1fr_3.2rem_3.2rem] items-center gap-x-2 pb-1.5 text-[10px] uppercase tracking-wider text-slate-600">
        <span />
        <span>Player</span>
        <span className="text-right">Cost</span>
        <span className="text-right">Penalty</span>
      </div>

      <ol className="space-y-0.5">
        {ranked.map((entry, idx) => {
          const isMe = entry.player_username === username
          return (
            <li
              key={entry.design_id}
              className={`grid grid-cols-[1.4rem_1fr_3.2rem_3.2rem] items-center gap-x-2 rounded-md px-1.5 py-1.5 text-xs ${
                isMe ? 'bg-water/10 ring-1 ring-inset ring-water/25' : 'hover:bg-ink-800/60'
              }`}
            >
              <span className="flex items-center justify-center">
                {idx < 3 ? (
                  <span
                    className={`grid h-4 w-4 place-content-center rounded-full text-[9px] font-bold ${
                      idx === 0
                        ? 'bg-gold/25 text-gold'
                        : idx === 1
                          ? 'bg-slate-400/20 text-slate-300'
                          : 'bg-amber-700/25 text-amber-500'
                    }`}
                  >
                    {idx + 1}
                  </span>
                ) : (
                  <span className="stat text-[10px] text-slate-600">{idx + 1}</span>
                )}
              </span>

              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  className={`truncate ${isMe ? 'font-semibold text-water-light' : 'text-slate-300'}`}
                  title={entry.player_username}
                >
                  {entry.player_username}
                </span>
                <span className="shrink-0 text-[10px] text-slate-600">#{entry.plan_number}</span>
                {entry.is_pareto_optimal && (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                    title="On the Pareto front"
                    aria-label="On the Pareto front"
                  />
                )}
              </span>

              <span className="stat text-right text-slate-400">
                {(entry.total_cost / 1000).toFixed(1)}k
              </span>
              <span
                className={`stat text-right ${
                  entry.hydraulic_penalty === 0 ? 'text-good' : 'text-bad'
                }`}
              >
                {entry.hydraulic_penalty.toFixed(2)}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
