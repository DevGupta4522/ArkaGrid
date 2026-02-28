import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Navbar from './components/Navbar'
import Toast from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'

// Pages - Auth
import Login from './pages/Login'
import Register from './pages/Register'

// Pages - Dashboard
import Dashboard from './pages/Dashboard'

// Pages - Marketplace (Consumer)
import Marketplace from './pages/Marketplace'

// Pages - Listings (Prosumer)
import MyListings from './pages/MyListings'

// Pages - Trades
import MyTrades from './pages/MyTrades'
import TradeDetail from './pages/TradeDetail'

// Pages - Wallet (Consumer)
import Wallet from './pages/Wallet'

// Pages - Admin
import AdminDisputes from './pages/AdminDisputes'

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-green-50 flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Marketplace */}
                <Route
                  path="/marketplace"
                  element={
                    <ProtectedRoute>
                      <Marketplace />
                    </ProtectedRoute>
                  }
                />

                {/* My Listings (Prosumer) */}
                <Route
                  path="/my-listings"
                  element={
                    <ProtectedRoute requiredRole="prosumer">
                      <MyListings />
                    </ProtectedRoute>
                  }
                />

                {/* My Trades */}
                <Route
                  path="/my-trades"
                  element={
                    <ProtectedRoute>
                      <MyTrades />
                    </ProtectedRoute>
                  }
                />

                {/* Trade Detail */}
                <Route
                  path="/trades/:id"
                  element={
                    <ProtectedRoute>
                      <TradeDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Wallet (Consumer) */}
                <Route
                  path="/wallet"
                  element={
                    <ProtectedRoute requiredRole="consumer">
                      <Wallet />
                    </ProtectedRoute>
                  }
                />

                {/* Admin */}
                <Route
                  path="/admin/disputes"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDisputes />
                    </ProtectedRoute>
                  }
                />

                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
          <Toast />
        </ToastProvider>
      </AuthProvider>
    </Router>
  )
}

function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-gray-600 mb-6">Page not found</p>
        <a href="/dashboard" className="btn-primary">
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
