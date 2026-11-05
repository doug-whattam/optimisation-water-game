import { Suspense, useCallback, useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useGameStore } from '@/store/gameStore'
import { useWebSocketUpdates } from '@/hooks/useWebSocketUpdates'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useIsCompact, useIsTouch } from '@/hooks/useMediaQuery'
import AssetPalette from '@/components/AssetPalette'
import CellTooltip from '@/components/CellTooltip'
import CostTracker from '@/components/CostTracker'
import HeaderBar from '@/components/HeaderBar'
import Instructions from '@/components/Instructions'
import LandLegend from '@/components/LandLegend'
import Leaderboard from '@/components/Leaderboard'
import ParetoChart from '@/components/ParetoChart'
import SettingsButton from '@/components/SettingsButton'
import ShortcutsOverlay from '@/components/ShortcutsOverlay'
import SimulationControls from '@/components/SimulationControls'
import SimulationResults from '@/components/SimulationResults'
import ToastContainer from '@/components/Toast'
import GridScene from '@/three/GridScene'
import SceneEnvironment from '@/three/SceneEnvironment'
import { BOARD_CENTER } from '@/three/layout'
import { BUDGET } from '@/types'

const CAMERA_START: [number, number, number] = [9.5, 8.5, 11.5]

export default function GameBoard() {
  const playerState = useGameStore((s) => s.playerState)
  const [showHelp, setShowHelp] = useState(false)
  const [railOpen, setRailOpen] = useState(true)
  const compact = useIsCompact()

  useWebSocketUpdates()
  useKeyboardShortcuts({ onToggleHelp: () => setShowHelp((v) => !v) })

  return (
    <div className="flex h-full w-full flex-col bg-ink-900">
      <HeaderBar onShowHelp={() => setShowHelp(true)} />

      {compact ? (
        <MobileLayout />
      ) : (
        <div className="flex min-h-0 flex-1">
          {/* Build rail */}
          <aside className="panel flex w-[288px] shrink-0 flex-col overflow-y-auto border-r">
            <AssetPalette />
            <CostTracker />
            <SimulationControls />
            <LandLegend />
            <Instructions />
            <div className="mt-auto">
              <SettingsButton />
            </div>
          </aside>

          <Viewport compact={false}>
            {/* Rail toggle, for players who want the board full width */}
            <button
              onClick={() => setRailOpen((v) => !v)}
              className="absolute right-3 top-3 z-10 rounded-md border border-ink-700 bg-ink-900/85 px-2.5 py-1.5 text-[11px]
                font-medium text-slate-300 backdrop-blur transition-colors hover:bg-ink-800"
              title={railOpen ? 'Hide results panel' : 'Show results panel'}
            >
              {railOpen ? 'Hide results ›' : '‹ Results'}
            </button>
          </Viewport>

          {/* Results rail */}
          {railOpen && (
            <aside className="panel flex w-[336px] shrink-0 animate-fade-in flex-col overflow-y-auto border-l">
              {playerState === 'results' && <SimulationResults />}
              <ParetoChart />
              <Leaderboard />
            </aside>
          )}
        </div>
      )}

      <ToastContainer />
      <ShortcutsOverlay open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  )
}

/** The 3D board plus the overlays drawn on top of it. */
function Viewport({ compact, children }: { compact: boolean; children?: React.ReactNode }) {
  const playerState = useGameStore((s) => s.playerState)
  const setHoveredCell = useGameStore((s) => s.setHoveredCell)
  const touch = useIsTouch()

  // Right-drag is the removal gesture, so the native context menu has to go.
  const blockContextMenu = useCallback((e: React.MouseEvent) => e.preventDefault(), [])

  return (
    <main
      className="relative min-h-0 min-w-0 flex-1"
      onContextMenu={blockContextMenu}
      onPointerLeave={() => setHoveredCell(null)}
    >
      <Canvas
        camera={{ position: CAMERA_START, fov: 38, near: 0.1, far: 120 }}
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <SceneEnvironment />
          <GridScene />
        </Suspense>
        {/*
          `makeDefault` publishes the controls on the R3F state so GridScene
          can suspend them for the duration of a paint stroke — otherwise
          dragging to lay pipe would also swing the camera.
        */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.07}
          minPolarAngle={Math.PI / 9}
          maxPolarAngle={Math.PI / 2.25}
          minDistance={4}
          maxDistance={compact ? 44 : 26}
          target={BOARD_CENTER}
        />
        {compact && <FitBoardToPortrait />}
      </Canvas>

      <ViewportOverlay state={playerState} touch={touch} />
      {/* A finger has no hover, so the tooltip would only flash on each tap */}
      {!touch && <CellTooltip />}
      {children}
    </main>
  )
}

/**
 * The default camera is framed for a landscape viewport; in a portrait one the
 * board's sides are cropped. Pull the camera back along the same line until it
 * fits. Runs on orientation change only, so it never undoes the player's own
 * orbit when a phone's address bar shows or hides.
 */
function FitBoardToPortrait() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as { update?: () => void } | null
  const size = useThree((s) => s.size)
  const portrait = size.width < size.height

  useEffect(() => {
    const aspect = size.width / size.height
    const scale = Math.min(Math.max(1.15 / aspect, 1), 2.6)
    const [tx, ty, tz] = BOARD_CENTER
    camera.position.set(
      tx + (CAMERA_START[0] - tx) * scale,
      ty + (CAMERA_START[1] - ty) * scale,
      tz + (CAMERA_START[2] - tz) * scale,
    )
    camera.lookAt(tx, ty, tz)
    controls?.update?.()
    // Deliberately keyed on orientation, not size — see above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portrait, camera, controls])

  return null
}

type MobileTab = 'build' | 'run' | 'results' | 'guide'

/**
 * Phone layout: the board takes the screen, and the rails' contents move into a
 * bottom sheet switched by a tab bar. Tapping the open tab folds the sheet away
 * for a full-height board.
 */
function MobileLayout() {
  const playerState = useGameStore((s) => s.playerState)
  const totalCost = useGameStore((s) => s.totalCost)
  const [tab, setTab] = useState<MobileTab | null>('build')

  // Results arrive while the sheet may be on another tab; bring them forward.
  useEffect(() => {
    if (playerState === 'results') setTab('results')
  }, [playerState])

  const tabs: { id: MobileTab; label: string; badge?: string }[] = [
    { id: 'build', label: 'Build' },
    { id: 'run', label: 'Run', badge: `${(totalCost / 1000).toFixed(0)}k` },
    { id: 'results', label: 'Results' },
    { id: 'guide', label: 'Guide' },
  ]

  return (
    <>
      <Viewport compact />

      {tab && (
        <div className="panel max-h-[46dvh] shrink-0 animate-fade-in overflow-y-auto border-t">
          {tab === 'build' && <AssetPalette compact />}
          {tab === 'run' && (
            <>
              <CostTracker />
              <SimulationControls />
            </>
          )}
          {tab === 'results' && (
            <>
              {playerState === 'results' && <SimulationResults />}
              <ParetoChart />
              <Leaderboard />
            </>
          )}
          {tab === 'guide' && (
            <>
              <LandLegend />
              <Instructions />
              <SettingsButton />
            </>
          )}
        </div>
      )}

      <nav
        className="grid shrink-0 grid-cols-4 border-t border-ink-700 bg-ink-900/95 pb-[env(safe-area-inset-bottom)]"
        aria-label="Panels"
      >
        {tabs.map((t) => {
          const active = tab === t.id
          const over = t.id === 'run' && totalCost > BUDGET
          return (
            <button
              key={t.id}
              onClick={() => setTab(active ? null : t.id)}
              aria-pressed={active}
              className={`relative flex h-12 items-center justify-center gap-1.5 text-xs font-medium transition-colors ${
                active ? 'text-water-light' : 'text-slate-400'
              }`}
            >
              {active && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-water" />}
              {t.label}
              {t.badge && (
                <span className={`stat text-[10px] ${over ? 'text-bad' : 'text-slate-500'}`}>{t.badge}</span>
              )}
            </button>
          )
        })}
      </nav>
    </>
  )
}

/** Non-interactive status layered over the 3D view. */
function ViewportOverlay({ state, touch }: { state: string; touch: boolean }) {
  const eraseMode = useGameStore((s) => s.eraseMode)

  if (state === 'simulating') {
    return (
      <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-full border border-water/40 bg-ink-900/90 px-5 py-2.5 shadow-glow backdrop-blur">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-water" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-water" />
          </span>
          <span className="text-sm font-medium text-slate-100">Valve open — running EPANET</span>
        </div>
      </div>
    )
  }

  return (
    <>
      {eraseMode && state === 'designing' && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-bad/50 bg-ink-900/90 px-3 py-1 text-[11px] font-medium text-bad backdrop-blur">
          Erase on · {touch ? 'tap' : 'click'} or drag pieces to remove
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 select-none md:right-auto">
        <div className="inline-block rounded-md border border-ink-700/70 bg-ink-950/60 px-2.5 py-1.5 text-[10px] leading-relaxed text-slate-500 backdrop-blur">
          {touch
            ? 'Pick a piece, then drag tiles to lay pipe · drag the board to orbit · pinch to zoom'
            : 'Drag to orbit · scroll to zoom · left-drag tiles to lay pipe · right-drag to remove'}
        </div>
      </div>
    </>
  )
}
