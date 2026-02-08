'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

let toastListeners: ((toasts: Toast[]) => void)[] = []
let toasts: Toast[] = []

const notify = (message: string, type: Toast['type'] = 'info') => {
  const id = Math.random().toString(36).substr(2, 9)
  toasts = [...toasts, { id, message, type }]
  toastListeners.forEach((listener) => listener(toasts))

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    toastListeners.forEach((listener) => listener(toasts))
  }, 5000)
}

export const toast = {
  success: (message: string) => notify(message, 'success'),
  error: (message: string) => notify(message, 'error'),
  info: (message: string) => notify(message, 'info'),
}

export function Toaster() {
  const [localToasts, setLocalToasts] = useState<Toast[]>([])

  useEffect(() => {
    toastListeners.push(setLocalToasts)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setLocalToasts)
    }
  }, [])

  const removeToast = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id)
    setLocalToasts(toasts)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {localToasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                : toast.type === 'error'
                ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {toast.type === 'info' && <Info className="w-5 h-5" />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
