import { useGameStore } from '@/store/gameStore'
import { BUDGET } from '@/types'

/**
 * Budget readout.
 *
 * The bar is segmented into asset spend and land installation spend, because
 * those are the two levers a player trades off: cheaper fittings versus routing
 * around expensive ground. A single combined bar hid that entirely.
 */
export default function CostTracker() {
  const totalCost = useGameStore((s) => s.totalCost)
  const assetCost = useGameStore((s) => s.assetCost)
  const installationCost = useGameStore((s) => s.installationCost)
  const placedAssets = useGameStore((s) => s.placedAssets)

  const remaining = BUDGET - totalCost
  const overBudget = remaining < 0
  const assetPct = Math.min((assetCost / BUDGET) * 100, 100)
  const installPct = Math.min((installationCost / BUDGET) * 100, 100 - assetPct)
  const usedPct = (totalCost / BUDGET) * 100

  return (
    <div className="panel-section">
      <div className="mb-2.5 flex items-baseline justify-between">
        <h3 className="section-title">Budget</h3>
        <span className="text-[11px] text-slate-500">
          {placedAssets.length} {placedAssets.length === 1 ? 'piece' : 'pieces'}
        </span>
      </div>

      {/* Headline remaining figure */}
      <div className="mb-2.5 flex items-end justify-between">
        <div>
          <div
            className={`stat text-2xl font-semibold leading-none ${
              overBudget ? 'text-bad' : remaining < BUDGET * 0.15 ? 'text-warn' : 'text-slate-100'
            }`}
          >
            {remaining.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">
            credits remaining
          </div>
        </div>
        <div className="text-right">
          <div className="stat text-sm text-slate-300">{totalCost.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">of {BUDGET.toLocaleString()}</div>
        </div>
      </div>

      {/* Segmented spend bar */}
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-ink-950"
        role="progressbar"
        aria-valuenow={Math.round(usedPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Budget used"
      >
        <div
          className={`h-full transition-[width] duration-300 ${overBudget ? 'bg-bad' : 'bg-water'}`}
          style={{ width: `${assetPct}%` }}
        />
        <div
          className={`h-full transition-[width] duration-300 ${overBudget ? 'bg-bad/60' : 'bg-water-deep'}`}
          style={{ width: `${installPct}%` }}
        />
      </div>

      <dl className="mt-3 space-y-1.5 text-xs">
        <Row swatch="bg-water" label="Fittings" value={assetCost} />
        <Row swatch="bg-water-deep" label="Land installation" value={installationCost} />
      </dl>

      {overBudget && (
        <p className="mt-2.5 rounded-md border border-bad/30 bg-bad/10 px-2.5 py-2 text-[11px] leading-snug text-bad">
          Over budget by {Math.abs(remaining).toLocaleString()} credits. The server rejects designs
          above the cap — remove pieces or reroute onto cheaper ground.
        </p>
      )}
    </div>
  )
}

function Row({ swatch, label, value }: { swatch: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="flex items-center gap-2 text-slate-400">
        <span className={`h-2 w-2 rounded-sm ${swatch}`} aria-hidden />
        {label}
      </dt>
      <dd className="stat text-slate-300">{value.toLocaleString()}</dd>
    </div>
  )
}
