/**
 * Wires session WebSocket traffic into the store.
 *
 * Also surfaces other players' results as toasts. The backend already broadcast
 * `simulation_complete` with the player, cost, and penalty, but nothing in the UI
 * used it, so a session felt single-player until you happened to look at the
 * chart. The type gymnastics in the previous version (conditional types inferring
 * store shape) are replaced with the concrete payload types.
 */
import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { onMessage, offMessage } from '@/api/websocket'
import { getParetoData } from '@/api/client'
import type { ParetoPoint } from '@/types'
import { showToast } from '@/utils/toast'

interface SimulationCompletePayload {
  player_username?: string
  plan_number?: number
  total_cost?: number
  hydraulic_penalty?: number
}

interface ParetoUpdatedPayload {
  designs?: ParetoPoint[]
  pareto_frontier?: { total_cost: number; hydraulic_penalty: number }[]
}

export function useWebSocketUpdates() {
  const sessionId = useGameStore((s) => s.sessionId)
  const updateParetoData = useGameStore((s) => s.updateParetoData)

  useEffect(() => {
    if (!sessionId) return

    async function refreshPareto() {
      try {
        const pareto = await getParetoData(sessionId!)
        updateParetoData(pareto.designs, pareto.pareto_frontier)
      } catch {
        // A failed refresh is not worth interrupting the player for; the next
        // broadcast or their own submission will bring the chart up to date.
      }
    }

    const handleSimComplete = (data: Record<string, unknown>) => {
      const payload = data as SimulationCompletePayload
      const me = useGameStore.getState().username

      if (payload.player_username && payload.player_username !== me) {
        showToast(`${payload.player_username} submitted plan #${payload.plan_number ?? '?'}`, 'info', {
          detail:
            payload.total_cost !== undefined && payload.hydraulic_penalty !== undefined
              ? `${payload.total_cost.toLocaleString()} cr · ${payload.hydraulic_penalty.toFixed(2)} m penalty`
              : undefined,
        })
      }

      void refreshPareto()
    }

    const handleParetoUpdated = (data: Record<string, unknown>) => {
      const payload = data as ParetoUpdatedPayload
      if (payload.designs && payload.pareto_frontier) {
        updateParetoData(payload.designs, payload.pareto_frontier)
      }
    }

    onMessage('simulation_complete', handleSimComplete)
    onMessage('pareto_updated', handleParetoUpdated)

    return () => {
      offMessage('simulation_complete', handleSimComplete)
      offMessage('pareto_updated', handleParetoUpdated)
    }
  }, [sessionId, updateParetoData])
}
