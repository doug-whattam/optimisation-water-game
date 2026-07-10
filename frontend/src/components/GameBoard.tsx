import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useGameStore } from '@/store/gameStore'
import { useWebSocketUpdates } from '@/hooks/useWebSocketUpdates'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import AssetPalette from '@/components/AssetPalette'
import CostTracker from '@/components/CostTracker'
import SimulationControls from '@/components/SimulationControls'
import SimulationResults from '@/components/SimulationResults'
import ParetoChart from '@/components/ParetoChart'
import Leaderboard from '@/components/Leaderboard'
import CellTooltip from '@/components/CellTooltip'
import ToastContainer from '@/components/Toast'
import SettingsButton from '@/components/SettingsButton'
import Instructions from '@/components/Instructions'
import GridScene from '@/three/GridScene'

export default function GameBoard() {
  const playerState = useGameStore((s) => s.playerState)
  useWebSocketUpdates()
  useKeyboardShortcuts()

  return (
    <div className="flex w-full h-full">
      {/* Left Panel - Asset Palette & Costs */}
      <div className="w-72 flex flex-col bg-[#0f3460] border-r border-gray-700 overflow-y-auto">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-water-light">💧 Optimisation</h2>
          <button
            onClick={() => useGameStore.getState().resetToLobby()}
            className="text-xs px-2 py-1 bg-[#1a1a2e] text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            New User
          </button>
        </div>
        <Instructions />
        <AssetPalette />
        <CostTracker />
        <SimulationControls />
        <div className="mt-auto">
          <SettingsButton />
        </div>
      </div>

      {/* Center - 3D Viewport */}
      <div className="flex-1 relative min-w-0">
        <Canvas
          camera={{ position: [8, 10, 8], fov: 45 }}
          shadows
          gl={{ antialias: true, pixelRatio: Math.min(window.devicePixelRatio, 2) }}
          style={{ width: '100%', height: '100%' }}
        >
          <color attach="background" args={['#87CEEB']} />
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 10, 5]}
            intensity={0.8}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.5}
            target={[3, 0, 3]}
          />
          <GridScene />
        </Canvas>

        {/* Overlay: simulation running indicator */}
        {playerState === 'simulating' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-water/90 rounded-full text-white font-semibold animate-pulse shadow-lg">
            ⚡ Simulation Running...
          </div>
        )}

        {/* Cell tooltip */}
        <CellTooltip />
      </div>

      {/* Right Panel - Results & Pareto */}
      <div className="w-80 flex flex-col bg-[#0f3460] border-l border-gray-700 overflow-y-auto">
        {playerState === 'results' && <SimulationResults />}
        <ParetoChart />
        <Leaderboard />
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  )
}
