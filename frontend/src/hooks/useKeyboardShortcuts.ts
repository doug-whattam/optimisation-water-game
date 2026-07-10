/**
 * Keyboard shortcut handler for the game.
 * R - rotate selected/last placed asset
 * 1-5 - quick-select asset types
 * Escape - deselect asset
 */
import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { AssetType } from '@/types'

const NUMBER_TO_ASSET: Record<string, AssetType> = {
  '1': AssetType.Pipe,
  '2': AssetType.Elbow,
  '3': AssetType.Tee,
  '4': AssetType.Cross,
}

export function useKeyboardShortcuts() {
  const selectAssetType = useGameStore((s) => s.selectAssetType)
  const playerState = useGameStore((s) => s.playerState)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (playerState !== 'designing') return

      // Number keys for quick asset selection
      if (e.key in NUMBER_TO_ASSET) {
        selectAssetType(NUMBER_TO_ASSET[e.key])
        return
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        selectAssetType(null)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [playerState, selectAssetType])
}
