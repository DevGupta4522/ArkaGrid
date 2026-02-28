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
  success: 'bg-volt-surface border-l-4 border-l-volt-green text-gray-200',
  error: 'bg-volt-surface border-l-4 border-l-danger-400 text-gray-200',
  warning: 'bg-volt-surface border-l-4 border-l-accent-500 text-gray-200',
  info: 'bg-volt-surface border-l-4 border-l-vblue-400 text-gray-200',
}

const iconColors = {
  success: 'text-volt-green',
  error: 'text-danger-400',
  warning: 'text-accent-500',
  info: 'text-vblue-400',
}

export default function Toast() {
  const { toasts, hideToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || icons.info
        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto animate-slide-in-right
              flex items-start gap-3 px-4 py-3.5 rounded-xl border border-volt-border shadow-2xl backdrop-blur-xl
              ${styles[toast.type] || styles.info}
            `}
          >
            <Icon size={20} className={`flex-shrink-0 mt-0.5 ${iconColors[toast.type]}`} />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => hideToast(toast.id)}
              className="flex-shrink-0 p-0.5 rounded-lg hover:bg-white/5 transition-colors text-gray-500"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
