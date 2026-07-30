import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { showToast } from '@/utils/toast'

/**
 * Admin controls.
 *
 * Note on the gate below: this password check runs in the browser against a
 * constant compiled into the bundle, so it is a guard against accidental clicks,
 * not a security boundary. Anyone who opens devtools can call the reset endpoint
 * directly. If this needs to be a real control, the check has to move to
 * `POST /api/sessions/reset` on the backend.
 */
const ADMIN_PASSWORD = 'Optimatics2026!'

export default function SettingsButton() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [resetting, setResetting] = useState(false)

  function handleOpen() {
    setOpen(true)
    setPassword('')
    setAuthenticated(false)
    setError('')
  }

  function handleAuth() {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect password.')
    }
  }

  async function handleResetLobby() {
    setResetting(true)
    setError('')
    try {
      const res = await fetch('/api/sessions/reset', { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      showToast('Lobby reset', 'success', { detail: 'All players will need to rejoin.' })
      setOpen(false)
      useGameStore.getState().resetToLobby()
    } catch (e) {
      setError(String(e))
    } finally {
      setResetting(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex w-full items-center gap-2 border-t border-ink-700 px-4 py-3 text-xs text-slate-500 transition-colors hover:bg-ink-800 hover:text-slate-300"
      >
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <circle cx="10" cy="10" r="2.6" />
          <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4" strokeLinecap="round" />
        </svg>
        Admin
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink-950/75 p-6 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm animate-fade-up rounded-2xl border border-ink-700 bg-ink-850 p-6 shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-base font-semibold text-slate-100">Admin</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-ink-800 hover:text-slate-200"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {!authenticated ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">Enter the admin password.</p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  placeholder="Password"
                  className="field py-2.5 text-sm"
                  autoFocus
                />
                {error && <p className="text-xs text-bad">{error}</p>}
                <button onClick={handleAuth} className="btn-primary py-2.5 text-sm">
                  Unlock
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-bad/30 bg-bad/8 p-3">
                  <p className="text-xs font-medium text-slate-200">Reset lobby</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    Deletes every session, player, design, and simulation result. Everyone currently
                    playing is disconnected and loses their submitted plans. This cannot be undone.
                  </p>
                </div>
                <button
                  onClick={handleResetLobby}
                  disabled={resetting}
                  className="w-full rounded-lg bg-bad/90 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-bad disabled:opacity-50"
                >
                  {resetting ? 'Resetting…' : 'Delete all data'}
                </button>
                {error && <p className="text-xs text-bad">{error}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
