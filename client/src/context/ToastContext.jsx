import React, { createContext, useState, useCallback } from 'react'

export const ToastContext = createContext()

let toastId = 0

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastId
    const newToast = { id, message, type }

    setToasts((prev) => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const hideToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((message) => showToast(message, 'success', 3000), [showToast])
  const error = useCallback((message) => showToast(message, 'error', 4000), [showToast])
  const warning = useCallback((message) => showToast(message, 'warning', 3500), [showToast])
  const info = useCallback((message) => showToast(message, 'info', 3000), [showToast])

  const value = {
    toasts,
    showToast,
    hideToast,
    success,
    error,
    warning,
    info,
  }

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}
