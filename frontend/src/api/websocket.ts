type MessageHandler = (data: Record<string, unknown>) => void

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
const handlers: Map<string, MessageHandler[]> = new Map()

export function connectWebSocket(sessionId: string, token: string) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  const url = `${protocol}//${host}/ws/sessions/${sessionId}?token=${token}`

  ws = new WebSocket(url)

  ws.onopen = () => {
    console.log('[WS] Connected')
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

  ws.onclose = () => {
    console.log('[WS] Disconnected, reconnecting in 3s...')
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
