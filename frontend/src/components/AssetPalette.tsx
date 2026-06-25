import { useGameStore } from '@/store/gameStore'
import { AssetType, ASSET_COSTS, ASSET_LABELS } from '@/types'

const assets = Object.values(AssetType)

export default function AssetPalette() {
  const selectedAssetType = useGameStore((s) => s.selectedAssetType)
  const selectAssetType = useGameStore((s) => s.selectAssetType)
  const playerState = useGameStore((s) => s.playerState)

  const disabled = playerState !== 'designing'

  return (
    <div className="p-4 border-b border-gray-700">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Assets</h3>
      <div className="space-y-2">
        {assets.map((type) => {
          const isSelected = selectedAssetType === type
          return (
            <button
              key={type}
              onClick={() => selectAssetType(isSelected ? null : type)}
              disabled={disabled}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : isSelected
                  ? 'bg-water text-white shadow-md'
                  : 'bg-[#1a1a2e] text-gray-300 hover:bg-[#16213e]'
              }`}
            >
              <span className="flex items-center gap-2">
                <AssetIcon type={type} />
                <span>{ASSET_LABELS[type]}</span>
              </span>
              <span className="font-mono text-xs opacity-70">{ASSET_COSTS[type].toLocaleString()}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-gray-500">Click a cell on the board to place. Right-click to remove. R to rotate.</p>
    </div>
  )
}

function AssetIcon({ type }: { type: AssetType }) {
  const icons: Record<AssetType, string> = {
    [AssetType.Pipe]: '│',
    [AssetType.Straight]: '║',
    [AssetType.Elbow]: '╗',
    [AssetType.Tee]: '╠',
    [AssetType.Cross]: '╬',
  }
  return <span className="font-mono text-lg w-5 text-center">{icons[type]}</span>
}
