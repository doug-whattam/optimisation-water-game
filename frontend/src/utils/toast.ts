/**
 * Tiny pub/sub toast bus.
 *
 * Lives in utils (not components) so the store and 3D scene can raise toasts
 * without importing React components — keeps the dependency direction clean.
 *
 * Identical messages raised inside DEDUPE_MS collapse into one. That matters for
 * drag-painting, where a single gesture can hit the same "over budget" guard
 * dozens of times in a few hundred milliseconds.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: number
  type: ToastType
  message: string
  /** Optional secondary line, e.g. the numbers behind a rejection. */
  detail?: string
  /** Auto-dismiss delay in ms. */
  ttl: number
}

const DEDUPE_MS = 1500
const DEFAULT_TTL: Record<ToastType, number> = {
  success: 3500,
  error: 6000,
  warning: 4500,
  info: 3500,
}

type Listener = (msg: ToastMessage) => void

let nextId = 0
const listeners = new Set<Listener>()
const lastSeen = new Map<string, number>()

export function subscribeToasts(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function showToast(
  message: string,
  type: ToastType = 'info',
  opts: { detail?: string; ttl?: number } = {},
): void {
  const now = Date.now()
  const key = `${type}:${message}`
  const previous = lastSeen.get(key)
  if (previous !== undefined && now - previous < DEDUPE_MS) return
  lastSeen.set(key, now)

  const msg: ToastMessage = {
    id: ++nextId,
    type,
    message,
    detail: opts.detail,
    ttl: opts.ttl ?? DEFAULT_TTL[type],
  }
  listeners.forEach((fn) => fn(msg))
}
