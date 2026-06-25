import { useGameStore } from '@/store/gameStore'
import Lobby from '@/components/Lobby'
import GameBoard from '@/components/GameBoard'

export default function App() {
  const playerState = useGameStore((s) => s.playerState)

  if (playerState === 'lobby') {
    return <Lobby />
  }

  return <GameBoard />
}
