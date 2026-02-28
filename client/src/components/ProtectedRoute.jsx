import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useContext'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
