import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { joinSession, setSessionToken } from '@/api/client'
import { connectWebSocket } from '@/api/websocket'
import { BUDGET, DEMAND_NODES } from '@/types'

/**
 * The backend can be cold on a free hosting tier, so the first request may take
 * the better part of a minute. Retry the relative path, then fall back to the
 * absolute API URL in case a proxy rewrite is the thing that's failing.
 */
async function getDefaultSession() {
  const attempts = ['/api/sessions/default', `${import.meta.env.VITE_API_URL || '/api'}/sessions/default`]
  let lastError: unknown = new Error('Unable to reach the server')

  for (const url of attempts) {
    for (let retry = 0; retry < 2; retry++) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(45000) })
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      } catch (e) {
        lastError = e
      }
    }
  }
  throw lastError
}

export default function Lobby() {
  const setSession = useGameStore((s) => s.setSession)
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGo() {
    const name = username.trim()
    if (!name) {
      setError('Enter a username to continue.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const session = await getDefaultSession()
      const joinResult = await joinSession(session.id, name)
      setSessionToken(joinResult.session_token)
      connectWebSocket(session.id, joinResult.session_token)
      setSession(joinResult.session, joinResult.session_token, name)
    } catch (e) {
      const msg = String(e)
      setError(
        msg.includes('already taken')
          ? `"${name}" is already in use in this session. Pick another name.`
          : msg.replace(/^Error:\s*/, ''),
      )
      setLoading(false)
    }
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-ink-950">
      {/* Ambient backdrop */}
      <div
        className="pointer-events-none absolute inset-0 animate-drift opacity-70"
        style={{
          background:
            'radial-gradient(60% 55% at 22% 18%, rgba(56,189,248,0.20), transparent 60%),' +
            'radial-gradient(55% 50% at 82% 78%, rgba(14,116,144,0.24), transparent 62%)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-grid-fade bg-grid opacity-40"
        aria-hidden
      />

      <div className="relative w-full max-w-[420px] px-6">
        <div className="rounded-2xl border border-ink-700 bg-ink-850/85 p-7 shadow-panel backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden>
              <defs>
                <linearGradient id="lobbyDrop" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#7dd3fc" />
                  <stop offset="1" stopColor="#0284c7" />
                </linearGradient>
              </defs>
              <path
                d="M16 3c4.8 5.7 8 10.3 8 14.3a8 8 0 1 1-16 0C8 13.3 11.2 8.7 16 3z"
                fill="url(#lobbyDrop)"
              />
            </svg>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-50">OptiClean</h1>
              <p className="text-xs text-slate-500">Water network optimisation</p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-400">
            Design pipework from an elevated reservoir to {DEMAND_NODES.length} customer tanks on a{' '}
            {BUDGET.toLocaleString()} credit budget. Every plan is solved in EPANET and plotted
            against everyone else's on the cost–performance front.
          </p>

          <label className="mt-6 block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
              Username
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGo()}
              placeholder="Your name"
              className="field text-base"
              maxLength={50}
              autoFocus
              disabled={loading}
            />
          </label>

          {error && (
            <p
              className="mt-3 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-xs leading-snug text-bad"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            onClick={handleGo}
            disabled={loading || !username.trim()}
            className="btn-primary mt-5"
          >
            {loading ? 'Connecting…' : 'Enter session'}
          </button>

          {loading && (
            <p className="mt-2.5 text-center text-[11px] leading-snug text-slate-500">
              The solver can take up to 30 seconds to wake if it has been idle.
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-600">
          EPANET 2.2 via WNTR · multiplayer Pareto scoring
        </p>
      </div>
    </div>
  )
}
