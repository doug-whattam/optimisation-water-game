import { useState, useEffect, useCallback } from 'react'

interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

let toastId = 0
const listeners: Set<(msg: ToastMessage) => void> = new Set()

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const msg: ToastMessage = { id: ++toastId, type, message }
  listeners.forEach(fn => fn(msg))
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((msg: ToastMessage) => {
    setToasts(prev => [...prev, msg])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== msg.id))
    }, 4000)
  }, [])

  useEffect(() => {
    listeners.add(addToast)
    return () => { listeners.delete(addToast) }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-right ${
            toast.type === 'success' ? 'bg-green-800 text-green-100' :
            toast.type === 'error' ? 'bg-red-800 text-red-100' :
            'bg-[#0f3460] text-gray-200 border border-water/30'
          }`}
        >
          {toast.type === 'success' && '✓ '}
          {toast.type === 'error' && '✗ '}
          {toast.message}
        </div>
      ))}
    </div>
  )
}
