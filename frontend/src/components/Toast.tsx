import { useEffect, useState } from 'react'
import { subscribeToasts, type ToastMessage, type ToastType } from '@/utils/toast'

const STYLES: Record<ToastType, { ring: string; icon: string; iconBg: string }> = {
  success: { ring: 'border-good/40', icon: '✓', iconBg: 'bg-good/15 text-good' },
  error: { ring: 'border-bad/45', icon: '✕', iconBg: 'bg-bad/15 text-bad' },
  warning: { ring: 'border-warn/40', icon: '!', iconBg: 'bg-warn/15 text-warn' },
  info: { ring: 'border-water/35', icon: 'i', iconBg: 'bg-water/15 text-water-light' },
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const timers: number[] = []
    const unsubscribe = subscribeToasts((msg) => {
      setToasts((prev) => [...prev.slice(-3), msg])
      timers.push(
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== msg.id))
        }, msg.ttl),
      )
    })
    return () => {
      unsubscribe()
      timers.forEach(window.clearTimeout)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[320px] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const style = STYLES[toast.type]
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex animate-toast-in items-start gap-3 rounded-xl border ${style.ring}
              bg-ink-850/95 p-3 shadow-panel backdrop-blur-md`}
          >
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-content-center rounded-full text-[11px] font-bold ${style.iconBg}`}
              aria-hidden
            >
              {style.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug text-slate-100">{toast.message}</p>
              {toast.detail && (
                <p className="mt-0.5 text-xs leading-snug text-slate-400">{toast.detail}</p>
              )}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="-mr-1 -mt-1 shrink-0 rounded p-1 text-slate-500 transition-colors hover:text-slate-200"
              aria-label="Dismiss notification"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
