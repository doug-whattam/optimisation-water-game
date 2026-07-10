import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { joinSession, setSessionToken } from '@/api/client'
import { connectWebSocket } from '@/api/websocket'

async function getDefaultSession() {
  // Render free tier can take up to 60s to wake. Retry with patience.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('/api/sessions/default', { signal: AbortSignal.timeout(45000) })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }
      return res.json()
    } catch (e) {
      if (attempt < 2) {
        // Retry
        continue
      }
      throw e
    }
  }
}

// Also try with the full production URL as fallback
async function getDefaultSessionWithFallback() {
  try {
    return await getDefaultSession()
  } catch {
    // If relative path fails, try the direct API URL
    const directUrl = import.meta.env.VITE_API_URL || '/api'
    const res = await fetch(`${directUrl}/sessions/default`, { signal: AbortSignal.timeout(45000) })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export default function Lobby() {
  const setSession = useGameStore((s) => s.setSession)
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGo() {
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Get or create the single shared session
      const session = await getDefaultSessionWithFallback()
      // Join it
      const joinResult = await joinSession(session.id, username.trim())
      setSessionToken(joinResult.session_token)
      connectWebSocket(session.id, joinResult.session_token)
      setSession(joinResult.session, joinResult.session_token, username.trim())
    } catch (e) {
      const msg = String(e)
      if (msg.includes('already taken')) {
        setError(`Username "${username.trim()}" is already in use. Pick a different name.`)
      } else {
        setError(msg)
      }
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleGo()
  }

  return (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <div className="w-full max-w-md p-8 space-y-6 bg-[#0f3460] rounded-2xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-water-light">💧 Optimisation Water Game</h1>
          <p className="mt-2 text-gray-400">Design. Simulate. Optimise.</p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-300 bg-red-900/30 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Your Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your name..."
            className="w-full px-4 py-3 text-white text-lg bg-[#1a1a2e] border border-gray-600 rounded-lg focus:ring-2 focus:ring-water focus:border-transparent"
            maxLength={50}
            autoFocus
          />
        </div>

        <button
          onClick={handleGo}
          disabled={loading || !username.trim()}
          className={`w-full py-3 px-4 rounded-lg font-bold text-lg transition-all ${
            loading || !username.trim()
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-xl active:scale-95'
          }`}
        >
          {loading ? 'Connecting... (may take up to 30s if server is waking)' : 'Go →'}
        </button>
      </div>
    </div>
  )
}
