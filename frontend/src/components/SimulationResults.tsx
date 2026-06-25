import { useGameStore } from '@/store/gameStore'
import { DEMAND_NODES } from '@/types'

export default function SimulationResults() {
  const simulationResult = useGameStore((s) => s.simulationResult)
  const setPlayerState = useGameStore((s) => s.setPlayerState)

  if (!simulationResult) return null

  const { stopping_tank, tank_levels, individual_penalties, hydraulic_penalty, status, error_message } = simulationResult

  if (status === 'failed') {
    return (
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3">⚠️ Simulation Failed</h3>
        <p className="text-sm text-gray-300">{error_message || 'Unknown error'}</p>
        <button
          onClick={() => setPlayerState('designing')}
          className="mt-4 w-full py-2 px-4 bg-water rounded-lg text-white font-medium hover:bg-water-dark"
        >
          ← Edit Network
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 border-b border-gray-700">
      <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide mb-3">✅ Results</h3>

      {stopping_tank && (
        <div className="mb-3 p-2 bg-green-900/30 rounded-lg text-sm text-green-300">
          🏆 <strong>{stopping_tank}</strong> reached TWL first!
        </div>
      )}

      <div className="space-y-2">
        {DEMAND_NODES.map((node) => {
          const level = tank_levels?.[node.key] ?? 0
          const penalty = individual_penalties?.[node.key] ?? node.twl
          const percent = (level / node.twl) * 100

          return (
            <div key={node.key} className="text-sm">
              <div className="flex justify-between text-gray-300">
                <span>{node.name}</span>
                <span className="font-mono">{level.toFixed(2)}m / {node.twl}m</span>
              </div>
              <div className="w-full h-2 bg-[#1a1a2e] rounded-full mt-1">
                <div
                  className={`h-full rounded-full ${penalty === 0 ? 'bg-green-500' : 'bg-yellow-500'}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              {penalty > 0 && (
                <div className="text-xs text-red-400 mt-0.5">Penalty: {penalty.toFixed(2)}m</div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="flex justify-between text-sm font-bold">
          <span className="text-gray-300">Total Penalty</span>
          <span className="text-red-400 font-mono">{hydraulic_penalty?.toFixed(2) ?? '—'}m</span>
        </div>
      </div>

      <button
        onClick={() => setPlayerState('designing')}
        className="mt-4 w-full py-2 px-4 bg-water rounded-lg text-white font-medium hover:bg-water-dark transition-colors"
      >
        ← Edit Network
      </button>
    </div>
  )
}
