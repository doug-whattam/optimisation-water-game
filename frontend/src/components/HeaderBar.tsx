import { useGameStore } from '@/store/gameStore'
import { BUDGET } from '@/types'

interface Props {
  onShowHelp: () => void
}

/**
 * Persistent top bar: identity, run status, and the two numbers a player checks
 * constantly (spend and plan number). Keeping these fixed means the side rails
 * can scroll without the headline figures leaving the screen.
 */
export default function HeaderBar({ onShowHelp }: Props) {
  const username = useGameStore((s) => s.username)
  const playerState = useGameStore((s) => s.playerState)
  const totalCost = useGameStore((s) => s.totalCost)
  const lastPlanNumber = useGameStore((s) => s.lastPlanNumber)
  const session = useGameStore((s) => s.session)
  const past = useGameStore((s) => s.past)
  const future = useGameStore((s) => s.future)
  const undo = useGameStore((s) => s.undo)
  const redo = useGameStore((s) => s.redo)
  const resetToLobby = useGameStore((s) => s.resetToLobby)

  const spentPct = Math.min((totalCost / BUDGET) * 100, 100)
  const overBudget = totalCost > BUDGET
  const designing = playerState === 'designing'

  return (
    <header className="z-20 flex h-12 shrink-0 items-center gap-4 border-b border-ink-700 bg-ink-900/95 px-4 backdrop-blur">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden>
          <defs>
            <linearGradient id="hdrDrop" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7dd3fc" />
              <stop offset="1" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          <path
            d="M16 4c4.4 5.2 7.4 9.4 7.4 13.1a7.4 7.4 0 1 1-14.8 0C8.6 13.4 11.6 9.2 16 4z"
            fill="url(#hdrDrop)"
          />
        </svg>
        <div className="leading-none">
          <span className="text-sm font-semibold tracking-tight text-slate-100">OptiClean</span>
          <span className="ml-2 hidden text-[11px] text-slate-500 lg:inline">
            Water Network Optimisation
          </span>
        </div>
      </div>

      <StatusChip state={playerState} />

      <div className="flex-1" />

      {/* Compact budget readout */}
      <div className="hidden items-center gap-2.5 sm:flex">
        <span className="text-[11px] uppercase tracking-wider text-slate-500">Spend</span>
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-ink-750">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${
              overBudget ? 'bg-bad' : spentPct > 85 ? 'bg-warn' : 'bg-water'
            }`}
            style={{ width: `${spentPct}%` }}
          />
        </div>
        <span
          className={`stat text-xs ${overBudget ? 'text-bad' : 'text-slate-200'}`}
          title={`${totalCost.toLocaleString()} of ${BUDGET.toLocaleString()} credits`}
        >
          {(totalCost / 1000).toFixed(1)}k
          <span className="text-slate-500">/{BUDGET / 1000}k</span>
        </span>
      </div>

      {/* Undo / redo */}
      <div className="flex items-center gap-1">
        <IconButton
          label="Undo (Ctrl+Z)"
          disabled={!designing || past.length === 0}
          onClick={undo}
        >
          <path d="M4 8h7a4 4 0 1 1 0 8H7" />
          <path d="M7 5L4 8l3 3" />
        </IconButton>
        <IconButton
          label="Redo (Ctrl+Shift+Z)"
          disabled={!designing || future.length === 0}
          onClick={redo}
        >
          <path d="M16 8H9a4 4 0 1 0 0 8h4" />
          <path d="M13 5l3 3-3 3" />
        </IconButton>
      </div>

      <div className="h-5 w-px bg-ink-700" />

      {lastPlanNumber !== null && (
        <span className="hidden text-[11px] text-slate-500 md:inline">
          Last submitted <span className="stat text-slate-300">#{lastPlanNumber}</span>
        </span>
      )}

      {session && (
        <span
          className="hidden items-center gap-1.5 text-[11px] text-slate-500 md:flex"
          title={`${session.player_count} player(s) in this session`}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-good" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-good" />
          </span>
          {session.player_count}
        </span>
      )}

      <button
        onClick={onShowHelp}
        className="btn-ghost"
        title="Keyboard shortcuts and rules (?)"
      >
        Help
      </button>

      <div className="flex items-center gap-2 rounded-md border border-ink-700 bg-ink-950/60 py-1 pl-2.5 pr-1">
        <span className="max-w-[130px] truncate text-xs font-medium text-slate-200" title={username ?? ''}>
          {username}
        </span>
        <button
          onClick={resetToLobby}
          className="rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-500 transition-colors hover:bg-ink-800 hover:text-slate-200"
          title="Leave and rejoin as a different user"
        >
          Switch
        </button>
      </div>
    </header>
  )
}

function StatusChip({ state }: { state: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    designing: { label: 'Designing', cls: 'border-water/40 bg-water/10 text-water-light' },
    simulating: { label: 'Simulating', cls: 'border-warn/40 bg-warn/10 text-warn' },
    results: { label: 'Results', cls: 'border-good/40 bg-good/10 text-good' },
  }
  const item = map[state]
  if (!item) return null

  return (
    <span
      className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium md:inline-flex ${item.cls}`}
    >
      {state === 'simulating' && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {item.label}
    </span>
  )
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="rounded-md p-1.5 text-slate-400 transition-colors enabled:hover:bg-ink-800 enabled:hover:text-slate-100 disabled:opacity-30"
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {children}
      </svg>
    </button>
  )
}
