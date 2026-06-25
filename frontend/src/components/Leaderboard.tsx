import { useGameStore } from '@/store/gameStore'

export default function Leaderboard() {
  const paretoDesigns = useGameStore((s) => s.paretoDesigns)
  const username = useGameStore((s) => s.username)

  if (paretoDesigns.length === 0) return null

  // Sort by proximity to origin (normalized distance)
  const maxCost = Math.max(...paretoDesigns.map(d => d.total_cost), 1)
  const maxPenalty = Math.max(...paretoDesigns.map(d => d.hydraulic_penalty), 1)

  const ranked = [...paretoDesigns]
    .map(d => ({
      ...d,
      score: Math.sqrt(
        Math.pow(d.total_cost / maxCost, 2) +
        Math.pow(d.hydraulic_penalty / maxPenalty, 2)
      ),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 10)

  return (
    <div className="p-4 border-t border-gray-700">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">🏆 Leaderboard</h3>
      <div className="space-y-1">
        {ranked.map((entry, idx) => {
          const isMe = entry.player_username === username
          return (
            <div
              key={`${entry.design_id}`}
              className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${
                isMe ? 'bg-water/20 text-water-light' : 'text-gray-400'
              } ${entry.is_pareto_optimal ? 'border-l-2 border-yellow-400' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 text-center font-mono text-gray-500">
                  {idx + 1}
                </span>
                <span className={isMe ? 'font-semibold' : ''}>
                  {entry.player_username}
                </span>
                <span className="text-gray-600">#{entry.plan_number}</span>
              </div>
              <div className="flex gap-3 font-mono">
                <span className="text-gray-500">{(entry.total_cost / 1000).toFixed(0)}k</span>
                <span className="text-red-400">{entry.hydraulic_penalty.toFixed(1)}m</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
