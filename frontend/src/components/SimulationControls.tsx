import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { submitDesign, triggerSimulation, getSimulationResult, getParetoData } from '@/api/client'
import { hasValidPath } from '@/utils/pathfinding'

export default function SimulationControls() {
  const {
    placedAssets,
    sessionId,
    playerState,
    totalCost,
    setSimulating,
    setSimulationResult,
    setDesignId,
    updateParetoData,
    setPlayerState,
  } = useGameStore()

  const [error, setError] = useState('')

  const hasPath = placedAssets.length > 0 && hasValidPath(placedAssets)
  const disabled = playerState !== 'designing' || !hasPath || totalCost === 0

  async function handleOpenValve() {
    if (!sessionId) return
    setError('')
    setSimulating(true)

    try {
      // Submit the design
      const design = await submitDesign(sessionId, placedAssets)
      setDesignId(design.id)

      // Trigger simulation
      const simTrigger = await triggerSimulation(design.id)

      // Poll for result (in production this would come via WebSocket)
      if (simTrigger.status === 'completed' || simTrigger.status === 'failed') {
        const result = await getSimulationResult(design.id)
        setSimulationResult(result)
      } else {
        // Wait a bit then check
        await new Promise(r => setTimeout(r, 2000))
        const result = await getSimulationResult(design.id)
        setSimulationResult(result)
      }

      // Refresh Pareto data
      const pareto = await getParetoData(sessionId)
      updateParetoData(pareto.designs, pareto.pareto_frontier)
    } catch (e) {
      setError(String(e))
      setSimulating(false)
      setPlayerState('designing')
    }
  }

  return (
    <div className="p-4">
      <button
        onClick={handleOpenValve}
        disabled={disabled}
        className={`w-full py-3 px-4 rounded-lg font-bold text-lg transition-all ${
          disabled
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-xl active:scale-95'
        }`}
      >
        🔓 Open Reservoir Valve
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {playerState === 'designing' && placedAssets.length === 0 && (
        <p className="mt-2 text-xs text-gray-500 text-center">Place pipes to connect the reservoir to demand nodes first</p>
      )}
      {playerState === 'designing' && placedAssets.length > 0 && !hasPath && (
        <p className="mt-2 text-xs text-yellow-500 text-center">⚠️ No valid path from reservoir to any demand node yet</p>
      )}
      {playerState === 'designing' && hasPath && (
        <p className="mt-2 text-xs text-green-400 text-center">✓ Valid path detected — ready to simulate</p>
      )}
    </div>
  )
}
