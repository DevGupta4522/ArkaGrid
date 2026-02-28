import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Navbar from './components/Navbar'
import Toast from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'

// Pages - Public
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'

// Pages - Protected
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Marketplace from './pages/Marketplace'
import MyListings from './pages/MyListings'
import MyTrades from './pages/MyTrades'
import TradeDetail from './pages/TradeDetail'
import Wallet from './pages/Wallet'
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
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
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

                {/* Profile */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
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
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="text-center animate-fade-in">
        <div className="text-8xl font-extrabold bg-gradient-to-br from-green-500 to-emerald-600 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h2>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <a href="/dashboard" className="btn-primary">
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
