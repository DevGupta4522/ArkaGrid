import React from 'react'
import { useToast } from '../hooks/useContext'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const styles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
}

export default function Toast() {
  const { toasts, hideToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || icons.info
        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto animate-slide-in-right
              flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-lg backdrop-blur-sm
              ${styles[toast.type] || styles.info}
            `}
          >
            <Icon size={20} className={`flex-shrink-0 mt-0.5 ${iconColors[toast.type]}`} />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => hideToast(toast.id)}
              className="flex-shrink-0 p-0.5 rounded-lg hover:bg-black/5 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
