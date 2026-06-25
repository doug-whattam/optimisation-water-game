import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { createSession, joinSession, listSessions, setSessionToken } from '@/api/client'
import { connectWebSocket } from '@/api/websocket'
import type { SessionInfo } from '@/types'

export default function Lobby() {
  const setSession = useGameStore((s) => s.setSession)
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [username, setUsername] = useState('')
  const [newSessionName, setNewSessionName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    try {
      const data = await listSessions()
      setSessions(data)
    } catch {
      // Server might not be running yet
    }
  }

  async function handleCreate() {
    if (!newSessionName.trim() || !username.trim()) {
      setError('Please enter both a session name and username')
      return
    }
    setLoading(true)
    setError('')
    try {
      const session = await createSession(newSessionName.trim())
      const joinResult = await joinSession(session.id, username.trim())
      setSessionToken(joinResult.session_token)
      connectWebSocket(session.id, joinResult.session_token)
      setSession(joinResult.session, joinResult.session_token, username.trim())
    } catch (e) {
      setError(String(e))
    }
    setLoading(false)
  }

  async function handleJoin(sessionId: string) {
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }
    setLoading(true)
    setError('')
    try {
      const joinResult = await joinSession(sessionId, username.trim())
      setSessionToken(joinResult.session_token)
      connectWebSocket(sessionId, joinResult.session_token)
      setSession(joinResult.session, joinResult.session_token, username.trim())
    } catch (e) {
      setError(String(e))
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <div className="w-full max-w-lg p-8 space-y-6 bg-[#0f3460] rounded-2xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-water-light">💧 OptiClean Water Game</h1>
          <p className="mt-2 text-gray-400">Design. Simulate. Optimize.</p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-300 bg-red-900/30 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Your Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name..."
            className="w-full px-4 py-2 text-white bg-[#1a1a2e] border border-gray-600 rounded-lg focus:ring-2 focus:ring-water focus:border-transparent"
            maxLength={50}
          />
        </div>

        <div className="border-t border-gray-600 pt-4">
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Create New Session</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="Session name..."
              className="flex-1 px-4 py-2 text-white bg-[#1a1a2e] border border-gray-600 rounded-lg focus:ring-2 focus:ring-water"
              maxLength={100}
            />
            <button
              onClick={handleCreate}
              disabled={loading}
              className="px-4 py-2 font-medium text-white bg-water rounded-lg hover:bg-water-dark disabled:opacity-50 transition-colors"
            >
              Create
            </button>
          </div>
        </div>

        {sessions.length > 0 && (
          <div className="border-t border-gray-600 pt-4">
            <h2 className="text-lg font-semibold text-gray-200 mb-3">Join Existing Session</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-[#1a1a2e] rounded-lg">
                  <div>
                    <div className="font-medium text-gray-200">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.player_count}/{s.max_players} players</div>
                  </div>
                  <button
                    onClick={() => handleJoin(s.id)}
                    disabled={loading}
                    className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
