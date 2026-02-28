import React from 'react'
import { Inbox, AlertCircle } from 'lucide-react'

export function EmptyState({ title, message, icon, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-volt-border/50 flex items-center justify-center mb-5">
        {icon || <Inbox className="text-gray-600" size={36} />}
      </div>
      <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm text-center max-w-sm mb-4">{message}</p>
      {action && action}
    </div>
  )
}

export function ErrorMessage({ message }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-danger-400/10 border border-danger-400/30 rounded-xl text-danger-400 text-sm font-medium animate-slide-up">
      <AlertCircle size={18} className="flex-shrink-0" />
      {message}
    </div>
  )
}
