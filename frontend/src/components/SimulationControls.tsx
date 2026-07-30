import { useMemo, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { submitDesign, triggerSimulation, getSimulationResult, getParetoData } from '@/api/client'
import { analyseConnectivity } from '@/utils/pathfinding'
import { showToast } from '@/utils/toast'
import { BUDGET, DEMAND_NODES } from '@/types'

function isSessionError(err: unknown): boolean {
  const msg = String(err).toLowerCase()
  return (
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('invalid session') ||
    msg.includes('not found') ||
    msg.includes('session token')
  )
}

export default function SimulationControls() {
  const placedAssets = useGameStore((s) => s.placedAssets)
  const sessionId = useGameStore((s) => s.sessionId)
  const playerState = useGameStore((s) => s.playerState)
  const totalCost = useGameStore((s) => s.totalCost)
  const clearDesign = useGameStore((s) => s.clearDesign)

  const [busy, setBusy] = useState(false)

  const { connectedDemands } = useMemo(() => analyseConnectivity(placedAssets), [placedAssets])

  const designing = playerState === 'designing'
  const overBudget = totalCost > BUDGET
  const connectedCount = connectedDemands.size
  const ready = designing && connectedCount > 0 && !overBudget && !busy

  async function handleOpenValve() {
    if (!sessionId) return
    const store = useGameStore.getState()
    setBusy(true)
    store.setSimulating(true)

    // Never leave the UI stuck on "simulating".
    const safety = window.setTimeout(() => {
      showToast('Simulation timed out', 'error', {
        detail: 'The solver did not report back. Your design is unchanged — try again.',
      })
      store.setSimulating(false)
      store.setPlayerState('designing')
      setBusy(false)
    }, 40000)

    try {
      const design = await submitDesign(sessionId, placedAssets)
      store.setDesignId(design.id)
      store.setLastPlanNumber(design.plan_number)

      await triggerSimulation(design.id)

      let result = null
      for (let attempt = 0; attempt < 25; attempt++) {
        result = await getSimulationResult(design.id)
        if (result.status === 'completed' || result.status === 'failed') break
        await new Promise((r) => setTimeout(r, 800))
      }

      window.clearTimeout(safety)

      if (!result || result.status === 'failed') {
        showToast('Simulation failed', 'error', {
          detail: result?.error_message || 'The solver did not produce results.',
        })
        store.setSimulating(false)
        store.setPlayerState('designing')
        return
      }

      store.setSimulationResult(result)
      showToast(`Plan #${design.plan_number} simulated`, 'success', {
        detail: `Cost ${design.total_cost.toLocaleString()} cr · penalty ${(
          result.hydraulic_penalty ?? 0
        ).toFixed(2)} m`,
      })

      const pareto = await getParetoData(sessionId)
      store.updateParetoData(pareto.designs, pareto.pareto_frontier)
    } catch (e) {
      window.clearTimeout(safety)
      if (isSessionError(e)) {
        showToast('Session expired', 'error', {
          detail: 'The lobby may have been reset. Re-enter your username to continue.',
        })
        store.resetToLobby()
        return
      }
      showToast('Could not submit design', 'error', { detail: String(e) })
      store.setSimulating(false)
      store.setPlayerState('designing')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel-section">
      {/* Readiness checklist — states the exact reason the button is disabled */}
      <ul className="mb-3 space-y-1.5 text-xs">
        <Check
          ok={placedAssets.length > 0}
          label={
            placedAssets.length > 0
              ? `${placedAssets.length} pieces placed`
              : 'Place pipework on the board'
          }
        />
        <Check
          ok={connectedCount > 0}
          label={
            connectedCount > 0
              ? `${connectedCount} of ${DEMAND_NODES.length} tanks connected to the reservoir`
              : 'No route from the reservoir to a tank yet'
          }
        />
        <Check ok={!overBudget} label={overBudget ? 'Over budget' : 'Within budget'} />
      </ul>

      <button onClick={handleOpenValve} disabled={!ready} className="btn-primary">
        {busy || playerState === 'simulating' ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner />
            Simulating…
          </span>
        ) : (
          'Open reservoir valve'
        )}
      </button>

      {designing && connectedCount > 0 && connectedCount < DEMAND_NODES.length && (
        <p className="mt-2 text-[11px] leading-snug text-warn">
          {DEMAND_NODES.length - connectedCount} tank
          {DEMAND_NODES.length - connectedCount === 1 ? '' : 's'} unconnected — those will score the
          full shortfall as penalty.
        </p>
      )}

      <button
        onClick={clearDesign}
        disabled={!designing || placedAssets.length === 0}
        className="btn-ghost mt-2.5 w-full"
      >
        Clear network
      </button>
    </div>
  )
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-start gap-2 ${ok ? 'text-slate-300' : 'text-slate-500'}`}>
      <span
        className={`mt-[3px] grid h-3.5 w-3.5 shrink-0 place-content-center rounded-full text-[9px] font-bold ${
          ok ? 'bg-good/20 text-good' : 'bg-ink-750 text-slate-500'
        }`}
        aria-hidden
      >
        {ok ? '✓' : '·'}
      </span>
      <span className="leading-snug">{label}</span>
    </li>
  )
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" className="animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
