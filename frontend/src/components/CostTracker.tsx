import { useGameStore } from '@/store/gameStore'
import { BUDGET } from '@/types'

export default function CostTracker() {
  const totalCost = useGameStore((s) => s.totalCost)
  const assetCost = useGameStore((s) => s.assetCost)
  const installationCost = useGameStore((s) => s.installationCost)

  const remaining = BUDGET - totalCost
  const budgetPercent = Math.min((totalCost / BUDGET) * 100, 100)
  const isOverBudget = remaining < 0

  return (
    <div className="p-4 border-b border-gray-700">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Budget</h3>

      {/* Progress bar */}
      <div className="w-full h-3 bg-[#1a1a2e] rounded-full mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isOverBudget ? 'bg-red-500' : budgetPercent > 80 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${budgetPercent}%` }}
        />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Total Cost</span>
          <span className={`font-mono font-bold ${isOverBudget ? 'text-red-400' : 'text-white'}`}>
            {totalCost.toLocaleString()} credits
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Remaining</span>
          <span className={`font-mono ${isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
            {remaining.toLocaleString()} credits
          </span>
        </div>
        <div className="border-t border-gray-700 pt-2 mt-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Asset Cost</span>
            <span className="text-gray-400 font-mono">{assetCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Installation Cost</span>
            <span className="text-gray-400 font-mono">{installationCost.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
