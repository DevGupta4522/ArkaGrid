import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useContext'
import { LayoutDashboard, Zap, ArrowLeftRight, Wallet, MapPin, List, Shield } from 'lucide-react'

export default function MobileNav() {
    const { user } = useAuth()
    const location = useLocation()

    const links = getMobileLinks(user?.role)
    const isActive = (path) => location.pathname === path

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-volt-surface/95 backdrop-blur-xl border-t border-volt-border">
            <div className="flex items-center justify-around px-2 py-1.5">
                {links.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`
              flex flex-col items-center gap-0.5 p-2 rounded-xl min-w-[56px] transition-all
              ${isActive(link.path)
                                ? 'text-volt-green'
                                : 'text-gray-500'
                            }
            `}
                    >
                        <link.icon size={20} />
                        <span className="text-[10px] font-semibold">{link.label}</span>
                        {isActive(link.path) && (
                            <div className="w-1 h-1 rounded-full bg-volt-green mt-0.5" />
                        )}
                    </Link>
                ))}
            </div>
        </nav>
    )
}

function getMobileLinks(role) {
    if (role === 'prosumer') {
        return [
            { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
            { path: '/marketplace', label: 'Market', icon: Zap },
            { path: '/my-listings', label: 'Listings', icon: List },
            { path: '/my-trades', label: 'Trades', icon: ArrowLeftRight },
            { path: '/map', label: 'Map', icon: MapPin },
        ]
    } else if (role === 'consumer') {
        return [
            { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
            { path: '/marketplace', label: 'Market', icon: Zap },
            { path: '/my-trades', label: 'Trades', icon: ArrowLeftRight },
            { path: '/wallet', label: 'Wallet', icon: Wallet },
            { path: '/map', label: 'Map', icon: MapPin },
        ]
    } else if (role === 'admin') {
        return [
            { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
            { path: '/admin/disputes', label: 'Disputes', icon: Shield },
            { path: '/map', label: 'Map', icon: MapPin },
        ]
    }
    return []
}
