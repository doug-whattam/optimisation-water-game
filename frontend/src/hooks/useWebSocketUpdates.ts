/**
 * Hook to wire WebSocket messages into the Zustand store for real-time updates.
 */
import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { onMessage, offMessage } from '@/api/websocket'
import { getParetoData } from '@/api/client'

export function useWebSocketUpdates() {
  const sessionId = useGameStore((s) => s.sessionId)
  const updateParetoData = useGameStore((s) => s.updateParetoData)

  useEffect(() => {
    if (!sessionId) return

    const handleSimComplete = async () => {
      // Refresh Pareto data when any simulation completes
      try {
        const pareto = await getParetoData(sessionId)
        updateParetoData(pareto.designs, pareto.pareto_frontier)
      } catch {
        // ignore fetch errors
      }
    }

    const handleParetoUpdated = (data: Record<string, unknown>) => {
      const designs = data.designs as typeof useGameStore.getState extends () => infer S ? S extends { paretoDesigns: infer P } ? P : never : never
      const frontier = data.pareto_frontier as typeof useGameStore.getState extends () => infer S ? S extends { paretoFrontier: infer F } ? F : never : never
      if (designs && frontier) {
        updateParetoData(designs as any, frontier as any)
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
