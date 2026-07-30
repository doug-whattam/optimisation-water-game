/**
 * Global keyboard handling for the build loop.
 *
 * The palette and the old hook's own docblock both advertised `R` to rotate, but
 * no handler existed — rotation was only reachable by placing a piece and then
 * clicking it. `R` now rotates the pending placement, which pairs with the ghost
 * preview so the player can aim before committing.
 */
import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ASSET_SHORTCUTS, AssetType } from '@/types'

/** Reverse of ASSET_SHORTCUTS, so the two can't drift apart. */
const KEY_TO_ASSET = Object.fromEntries(
  (Object.entries(ASSET_SHORTCUTS) as [AssetType, string][]).map(([type, key]) => [key, type]),
) as Record<string, AssetType>

interface Options {
  onToggleHelp?: () => void
}

/** True when focus is in a field, so typing a name doesn't trigger shortcuts. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

export function useKeyboardShortcuts({ onToggleHelp }: Options = {}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return

      const store = useGameStore.getState()

      // Help works in any state.
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault()
        onToggleHelp?.()
        return
      }

      // Undo / redo. Accept both Ctrl+Shift+Z and Ctrl+Y for redo.
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) store.redo()
        else store.undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        store.redo()
        return
      }

      // Everything below is a design-time action.
      if (store.playerState !== 'designing') return
      if (e.ctrlKey || e.metaKey || e.altKey) return

      if (e.key in KEY_TO_ASSET) {
        store.selectAssetType(KEY_TO_ASSET[e.key])
        return
      }

      if (e.key === 'r' || e.key === 'R') {
        const hovered = store.hoveredCell
        const placed =
          hovered && store.placedAssets.find((a) => a.row === hovered.row && a.col === hovered.col)

        // Rotating the piece under the cursor is the more useful reading of `R`
        // when one is there; otherwise rotate what's about to be placed.
        if (placed) store.rotateAsset(placed.row, placed.col)
        else store.rotatePending()
        return
      }

      if (e.key === 'Escape') {
        store.selectAssetType(null)
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const hovered = store.hoveredCell
        if (hovered) {
          e.preventDefault()
          store.removeAsset(hovered.row, hovered.col)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onToggleHelp])
}
