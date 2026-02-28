import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import MobileNav from './components/MobileNav'
import Toast from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './hooks/useContext'

// Pages - Public
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'

// Pages - Protected
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import EnergyMap from './pages/EnergyMap'
import Marketplace from './pages/Marketplace'
import MyListings from './pages/MyListings'
import MyTrades from './pages/MyTrades'
import TradeDetail from './pages/TradeDetail'
import Wallet from './pages/Wallet'
import AdminDisputes from './pages/AdminDisputes'

function AppLayout() {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  const publicPaths = ['/', '/login', '/register']
  const isPublicPage = publicPaths.includes(location.pathname)
  const showDashboardLayout = isAuthenticated && !isPublicPage

  if (showDashboardLayout) {
    return (
      <div className="flex h-screen overflow-hidden bg-volt-dark">
        {/* Sidebar - desktop */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
              <Route path="/my-listings" element={<ProtectedRoute requiredRole="prosumer"><MyListings /></ProtectedRoute>} />
              <Route path="/my-trades" element={<ProtectedRoute><MyTrades /></ProtectedRoute>} />
              <Route path="/trades/:id" element={<ProtectedRoute><TradeDetail /></ProtectedRoute>} />
              <Route path="/map" element={<ProtectedRoute><EnergyMap /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute requiredRole="consumer"><Wallet /></ProtectedRoute>} />
              <Route path="/admin/disputes" element={<ProtectedRoute requiredRole="admin"><AdminDisputes /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-volt-dark">
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/dashboard" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppLayout />
          <Toast />
        </ToastProvider>
      </AuthProvider>
    </Router>
  )
}

function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center animate-fade-in">
        <div className="text-8xl font-extrabold font-heading bg-gradient-to-br from-volt-green to-emerald-500 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Page not found</h2>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <a href="/dashboard" className="btn-primary">
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
