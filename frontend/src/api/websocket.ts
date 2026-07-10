type MessageHandler = (data: Record<string, unknown>) => void

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 3
const handlers: Map<string, MessageHandler[]> = new Map()

export function connectWebSocket(sessionId: string, token: string) {
  // In production, connect directly to the backend's WebSocket URL
  // In dev, the Vite proxy handles it via relative path
  let wsUrl: string
  if (import.meta.env.PROD && import.meta.env.VITE_WS_URL) {
    wsUrl = `${import.meta.env.VITE_WS_URL}/ws/sessions/${sessionId}?token=${token}`
  } else {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    wsUrl = `${protocol}//${host}/ws/sessions/${sessionId}?token=${token}`
  }

  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    console.log('[WS] Connected')
    reconnectAttempts = 0
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      const type = msg.type as string
      const messageHandlers = handlers.get(type)
      if (messageHandlers) {
        for (const handler of messageHandlers) {
          handler(msg.data)
        }
      }
    } catch (e) {
      console.error('[WS] Parse error:', e)
    }
  }

  ws.onclose = (event) => {
    // Auth rejection codes — don't reconnect
    if (event.code === 4001 || event.code === 4002 || event.code === 1008) {
      console.log('[WS] Auth rejected, not reconnecting')
      return
    }
    // Limit reconnect attempts (a stale token causes repeated 403 handshake failures)
    reconnectAttempts++
    if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
      console.log('[WS] Max reconnect attempts reached, giving up')
      return
    }
    console.log(`[WS] Disconnected, reconnecting in 3s (attempt ${reconnectAttempts})...`)
    reconnectTimer = setTimeout(() => connectWebSocket(sessionId, token), 3000)
  }

  ws.onerror = (err) => {
    console.error('[WS] Error:', err)
  }
}

export function disconnectWebSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  reconnectAttempts = 0
  if (ws) {
    ws.close()
    ws = null
  }
}

export function onMessage(type: string, handler: MessageHandler) {
  if (!handlers.has(type)) {
    handlers.set(type, [])
  }
  handlers.get(type)!.push(handler)
}

export function offMessage(type: string, handler: MessageHandler) {
  const list = handlers.get(type)
  if (list) {
    const idx = list.indexOf(handler)
    if (idx !== -1) list.splice(idx, 1)
  }
}
