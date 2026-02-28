import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useContext'
import {
    LayoutDashboard, Zap, List, ArrowLeftRight, Wallet, Shield,
    LogOut, MapPin, ChevronLeft, ChevronRight, User
} from 'lucide-react'

export default function Sidebar() {
    const { user, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [collapsed, setCollapsed] = useState(false)

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const navLinks = getNavLinks(user?.role)
    const isActive = (path) => location.pathname === path

    return (
        <aside className={`
      hidden md:flex flex-col h-screen bg-volt-surface border-r border-volt-border
      transition-all duration-300 relative flex-shrink-0
      ${collapsed ? 'w-[68px]' : 'w-[240px]'}
    `}>
            {/* Logo */}
            <div className={`flex items-center gap-3 px-4 py-5 border-b border-volt-border ${collapsed ? 'justify-center' : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-volt-green/10 border border-volt-green/30 flex items-center justify-center flex-shrink-0">
                    <Zap size={18} className="text-volt-green" />
                </div>
                {!collapsed && (
                    <span className="text-lg font-bold font-heading text-white tracking-tight">
                        Arka<span className="text-volt-green">Grid</span>
                    </span>
                )}
            </div>

            {/* User info */}
            {!collapsed && user && (
                <div className="px-4 py-4 border-b border-volt-border">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-volt-green/30 to-volt-green/10 flex items-center justify-center text-volt-green font-bold text-sm border border-volt-green/20">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user.name?.split(' ')[0]}</p>
                            <span className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider
                ${user.role === 'prosumer' ? 'bg-accent-500/10 text-accent-400' :
                                    user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                                        'bg-vblue-400/10 text-vblue-400'}
              `}>
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
                {navLinks.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        title={collapsed ? link.label : undefined}
                        className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${collapsed ? 'justify-center' : ''}
              ${isActive(link.path)
                                ? 'bg-volt-green/10 text-volt-green border-l-2 border-volt-green shadow-glow-green/5'
                                : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                            }
            `}
                    >
                        <link.icon size={18} className="flex-shrink-0" />
                        {!collapsed && <span>{link.label}</span>}
                    </Link>
                ))}
            </nav>

            {/* Bottom section */}
            <div className="px-2 py-3 border-t border-volt-border space-y-1">
                <button
                    onClick={handleLogout}
                    className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            text-gray-500 hover:text-danger-400 hover:bg-danger-400/5 transition-all duration-200
            ${collapsed ? 'justify-center' : ''}
          `}
                >
                    <LogOut size={18} />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-volt-surface border border-volt-border flex items-center justify-center text-gray-500 hover:text-white transition-colors z-10"
            >
                {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
        </aside>
    )
}

function getNavLinks(role) {
    if (role === 'prosumer') {
        return [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/marketplace', label: 'Marketplace', icon: Zap },
            { path: '/my-listings', label: 'My Listings', icon: List },
            { path: '/my-trades', label: 'My Trades', icon: ArrowLeftRight },
            { path: '/map', label: 'Energy Map', icon: MapPin },
        ]
    } else if (role === 'consumer') {
        return [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/marketplace', label: 'Marketplace', icon: Zap },
            { path: '/my-trades', label: 'My Trades', icon: ArrowLeftRight },
            { path: '/wallet', label: 'Wallet', icon: Wallet },
            { path: '/map', label: 'Energy Map', icon: MapPin },
        ]
    } else if (role === 'admin') {
        return [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/admin/disputes', label: 'Disputes', icon: Shield },
            { path: '/map', label: 'Energy Map', icon: MapPin },
        ]
    }
    return []
}
