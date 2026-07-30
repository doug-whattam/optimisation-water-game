import { Suspense, useCallback, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useGameStore } from '@/store/gameStore'
import { useWebSocketUpdates } from '@/hooks/useWebSocketUpdates'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
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

export default function GameBoard() {
  const playerState = useGameStore((s) => s.playerState)
  const setHoveredCell = useGameStore((s) => s.setHoveredCell)
  const [showHelp, setShowHelp] = useState(false)
  const [railOpen, setRailOpen] = useState(true)

  useWebSocketUpdates()
  useKeyboardShortcuts({ onToggleHelp: () => setShowHelp((v) => !v) })

  // Right-drag is the removal gesture, so the native context menu has to go.
  const blockContextMenu = useCallback((e: React.MouseEvent) => e.preventDefault(), [])

  return (
    <div className="flex h-full w-full flex-col bg-ink-900">
      <HeaderBar onShowHelp={() => setShowHelp(true)} />

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

        {/* Viewport */}
        <main
          className="relative min-w-0 flex-1"
          onContextMenu={blockContextMenu}
          onPointerLeave={() => setHoveredCell(null)}
        >
          <Canvas
            camera={{ position: [9.5, 8.5, 11.5], fov: 38, near: 0.1, far: 120 }}
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
              maxDistance={26}
              target={BOARD_CENTER}
            />
          </Canvas>

          <ViewportOverlay state={playerState} />
          <CellTooltip />

          {/* Rail toggle, for players who want the board full width */}
          <button
            onClick={() => setRailOpen((v) => !v)}
            className="absolute right-3 top-3 z-10 rounded-md border border-ink-700 bg-ink-900/85 px-2.5 py-1.5 text-[11px]
              font-medium text-slate-300 backdrop-blur transition-colors hover:bg-ink-800"
            title={railOpen ? 'Hide results panel' : 'Show results panel'}
          >
            {railOpen ? 'Hide results ›' : '‹ Results'}
          </button>
        </main>

        {/* Results rail */}
        {railOpen && (
          <aside className="panel flex w-[336px] shrink-0 animate-fade-in flex-col overflow-y-auto border-l">
            {playerState === 'results' && <SimulationResults />}
            <ParetoChart />
            <Leaderboard />
          </aside>
        )}
      </div>

      <ToastContainer />
      <ShortcutsOverlay open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  )
}

/** Non-interactive status layered over the 3D view. */
function ViewportOverlay({ state }: { state: string }) {
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
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 select-none rounded-md border border-ink-700/70 bg-ink-950/60 px-2.5 py-1.5 text-[10px] leading-relaxed text-slate-500 backdrop-blur">
      Drag to orbit · scroll to zoom · left-drag tiles to lay pipe · right-drag to remove
    </div>
  )
}
