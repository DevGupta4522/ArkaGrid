import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useContext'
import { Wallet, User } from 'lucide-react'
import NotificationDropdown from './NotificationDropdown'

const pageTitles = {
    '/dashboard': 'Dashboard',
    '/marketplace': 'Marketplace',
    '/my-listings': 'My Listings',
    '/my-trades': 'My Trades',
    '/wallet': 'Wallet',
    '/profile': 'Profile',
    '/map': 'Energy Map',
    '/admin/disputes': 'Dispute Resolution',
}

export default function TopBar() {
    const { user } = useAuth()
    const location = useLocation()

    const title = pageTitles[location.pathname] || 'ArkaGrid'

    return (
        <header className="h-16 bg-volt-surface/50 backdrop-blur-xl border-b border-volt-border flex items-center justify-between px-6 flex-shrink-0">
            {/* Page title */}
            <h1 className="text-lg font-bold font-heading text-white tracking-tight">
                {title}
            </h1>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {/* Notification bell */}
                <NotificationDropdown />

                {/* Wallet balance (consumers) */}
                {user?.role === 'consumer' && (
                    <Link to="/wallet" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-volt-green/10 border border-volt-green/20 hover:border-volt-green/40 transition-all">
                        <Wallet size={14} className="text-volt-green" />
                        <span className="text-volt-green font-mono font-semibold text-sm">
                            ₹{parseFloat(user.wallet_balance || 0).toFixed(0)}
                        </span>
                    </Link>
                )}

                {/* User avatar */}
                <Link to="/profile" className="flex items-center gap-2.5 pl-3 border-l border-volt-border">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-volt-green/30 to-volt-green/10 flex items-center justify-center text-volt-green font-bold text-xs border border-volt-green/20">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-300 hidden lg:block">
                        {user?.name?.split(' ')[0]}
                    </span>
                </Link>
            </div>
        </header>
    )
}
