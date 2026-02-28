import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Wallet, Menu, X, Zap, LayoutDashboard, ShoppingBag, List, ArrowLeftRight, Shield } from 'lucide-react'
import { useAuth } from '../hooks/useContext'

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  const navLinks = getNavLinks(user?.role)

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-white/80 backdrop-blur-xl shadow-lg border-b border-green-100'
        : 'bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 shadow-md'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className={`flex items-center gap-2.5 group ${scrolled ? 'text-green-700' : 'text-white'
            }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${scrolled ? 'bg-green-100' : 'bg-white/20'
              }`}>
              <Zap size={20} className={scrolled ? 'text-green-600' : 'text-white'} />
            </div>
            <span className="text-xl font-bold tracking-tight">ArkaGrid</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated && user ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive(link.path)
                        ? scrolled
                          ? 'bg-green-100 text-green-700'
                          : 'bg-white/20 text-white'
                        : scrolled
                          ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          : 'text-green-100 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <link.icon size={16} />
                    {link.label}
                  </Link>
                ))}

                <div className="w-px h-8 bg-gray-300/30 mx-2" />

                {/* Wallet Display */}
                {user.role === 'consumer' && (
                  <Link
                    to="/wallet"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${scrolled
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-white/15 text-white hover:bg-white/25'
                      }`}
                  >
                    <Wallet size={16} />
                    ₹{parseFloat(user.wallet_balance || 0).toFixed(0)}
                  </Link>
                )}

                {/* User & Logout */}
                <div className="flex items-center gap-3 ml-2">
                  <div className={`text-sm font-medium ${scrolled ? 'text-gray-600' : 'text-green-100'}`}>
                    {user.name?.split(' ')[0]}
                  </div>
                  <button
                    onClick={handleLogout}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${scrolled
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-red-200 hover:bg-red-500/20'
                      }`}
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${scrolled
                    ? 'text-green-700 hover:bg-green-50'
                    : 'text-white hover:bg-white/10'
                  }`}>
                  Login
                </Link>
                <Link to="/register" className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${scrolled
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-white text-green-700 hover:bg-green-50'
                  }`}>
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-2 rounded-xl transition-colors ${scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={`md:hidden border-t animate-slide-up ${scrolled ? 'bg-white border-gray-100' : 'bg-green-700 border-white/10'
          }`}>
          <div className="px-4 py-3 space-y-1">
            {isAuthenticated && user ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive(link.path)
                        ? scrolled
                          ? 'bg-green-100 text-green-700'
                          : 'bg-white/20 text-white'
                        : scrolled
                          ? 'text-gray-700 hover:bg-gray-50'
                          : 'text-green-100 hover:bg-white/10'
                      }`}
                  >
                    <link.icon size={18} />
                    {link.label}
                  </Link>
                ))}

                {user.role === 'consumer' && (
                  <Link
                    to="/wallet"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${scrolled ? 'bg-green-50 text-green-700' : 'bg-white/15 text-white'
                      }`}
                  >
                    <Wallet size={18} />
                    Wallet: ₹{parseFloat(user.wallet_balance || 0).toFixed(2)}
                  </Link>
                )}

                <div className={`border-t my-2 ${scrolled ? 'border-gray-100' : 'border-white/10'}`} />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <div className="space-y-2 py-2">
                <Link to="/login" className="block px-4 py-3 rounded-xl text-center text-sm font-semibold text-green-100 hover:bg-white/10">
                  Login
                </Link>
                <Link to="/register" className="block px-4 py-3 rounded-xl text-center text-sm font-semibold bg-white text-green-700 hover:bg-green-50">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

function getNavLinks(role) {
  if (role === 'prosumer') {
    return [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
      { path: '/my-listings', label: 'My Listings', icon: List },
      { path: '/my-trades', label: 'My Trades', icon: ArrowLeftRight },
    ]
  } else if (role === 'consumer') {
    return [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
      { path: '/my-trades', label: 'My Trades', icon: ArrowLeftRight },
    ]
  } else if (role === 'admin') {
    return [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/admin/disputes', label: 'Disputes', icon: Shield },
    ]
  }
  return []
}
