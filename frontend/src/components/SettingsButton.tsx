import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'

const ADMIN_PASSWORD = 'Optimatics2026!'

export default function SettingsButton() {
  const [showModal, setShowModal] = useState(false)
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  function handleOpen() {
    setShowModal(true)
    setPassword('')
    setAuthenticated(false)
    setError('')
    setResetDone(false)
  }

  function handleAuth() {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect password')
    }
  }

  async function handleResetLobby() {
    setResetting(true)
    setError('')
    try {
      const res = await fetch('/api/sessions/reset', { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      setResetDone(true)
      // Reset the local state back to lobby
      setTimeout(() => {
        useGameStore.getState().resetToLobby()
        setShowModal(false)
      }, 1500)
    } catch (e) {
      setError(String(e))
    }
    setResetting(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAuth()
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-full p-3 text-xs text-gray-500 hover:text-gray-300 hover:bg-[#1a1a2e] border-t border-gray-700 transition-colors flex items-center gap-2"
      >
        ⚙️ Settings
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#0f3460] rounded-xl p-6 w-80 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">⚙️ Admin Settings</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            {!authenticated ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-400">Enter admin password to access settings.</p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Password..."
                  className="w-full px-3 py-2 text-white bg-[#1a1a2e] border border-gray-600 rounded-lg focus:ring-2 focus:ring-water"
                  autoFocus
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button
                  onClick={handleAuth}
                  className="w-full py-2 bg-water text-white rounded-lg font-medium hover:bg-water-dark transition-colors"
                >
                  Unlock
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {resetDone ? (
                  <div className="p-3 bg-green-900/30 rounded-lg text-sm text-green-300">
                    ✓ Lobby has been reset. Redirecting...
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-400">Admin actions:</p>
                    <button
                      onClick={handleResetLobby}
                      disabled={resetting}
                      className="w-full py-3 bg-red-700 hover:bg-red-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {resetting ? 'Resetting...' : '🗑️ Reset Lobby (Delete All Data)'}
                    </button>
                    <p className="text-xs text-gray-500">
                      This will delete all sessions, players, designs, and simulation results. Everyone will need to rejoin.
                    </p>
                  </>
                )}
                {error && <p className="text-xs text-red-400">{error}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
