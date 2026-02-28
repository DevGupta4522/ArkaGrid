import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { tradesAPI } from '../api/trades'
import { listingsAPI } from '../api/listings'
import { walletAPI } from '../api/wallet'
import { adminAPI } from '../api/admin'
import { TrendingUp, Zap, Clock, Wallet, ShoppingBag, List, ArrowLeftRight, Shield, Sun, DollarSign, Users } from 'lucide-react'
import StatCard from '../components/StatCard'

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user.role === 'prosumer') {
          const [listings, trades] = await Promise.all([
            listingsAPI.getMyListings(),
            tradesAPI.getMyTrades(),
          ])
          const activeListings = (listings.data || []).filter((l) => l.status === 'active').length
          const pendingTrades = (trades.data || []).filter((t) => t.trade_status === 'delivering').length
          const completedTrades = (trades.data || []).filter((t) => t.trade_status === 'completed' && t.my_role === 'seller')
          const totalEarnings = completedTrades.reduce((sum, t) => sum + parseFloat(t.total_amount || 0) - parseFloat(t.platform_fee || 0), 0)
          setStats({ activeListings, pendingTrades, totalEarnings, recentTrades: (trades.data || []).slice(0, 5) })
        } else if (user.role === 'consumer') {
          const [listings, trades, balance] = await Promise.all([
            listingsAPI.getListings(),
            tradesAPI.getMyTrades(),
            walletAPI.getBalance(),
          ])
          const nearbyListings = (listings.data || []).length
          const activeOrders = (trades.data || []).filter((t) => ['delivering', 'completing'].includes(t.trade_status)).length
          const completedTrades = (trades.data || []).filter((t) => t.trade_status === 'completed')
          const totalKwh = completedTrades.reduce((sum, t) => sum + parseFloat(t.units_delivered || 0), 0)
          const totalSaved = totalKwh * 2  // ₹2 saved per kWh vs grid
          const walletBalance = parseFloat(balance.data?.wallet_balance || user.wallet_balance || 0)
          setStats({ nearbyListings, activeOrders, totalSaved, walletBalance, recentTrades: (trades.data || []).slice(0, 5) })
        } else {
          // Admin
          try {
            const adminStats = await adminAPI.getStats()
            setStats(adminStats.data || {})
          } catch {
            setStats({ total_users: 0, trades_today: 0, disputed_trades: 0, platform_fees_collected: 0 })
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [user])

  if (loading) return <LoadingSpinner message="Loading dashboard..." />

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Welcome, {user.name?.split(' ')[0]}! 👋</h1>
        <p className="page-subtitle">
          {user.role === 'prosumer' && 'Manage your energy listings and trades'}
          {user.role === 'consumer' && 'Discover and buy renewable energy from neighbours'}
          {user.role === 'admin' && 'Monitor platform activity and resolve disputes'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {user.role === 'prosumer' ? (
          <>
            <StatCard
              icon={<Zap className="text-green-600" size={28} />}
              label="Active Listings"
              value={stats.activeListings || 0}
              subtext="listings available"
            />
            <StatCard
              icon={<Clock className="text-amber-600" size={28} />}
              label="Pending Deliveries"
              value={stats.pendingTrades || 0}
              subtext="awaiting confirmation"
            />
            <StatCard
              icon={<TrendingUp className="text-blue-600" size={28} />}
              label="Total Earned"
              value={`₹${(stats.totalEarnings || 0).toFixed(2)}`}
              subtext="from completed trades"
            />
          </>
        ) : user.role === 'consumer' ? (
          <>
            <StatCard
              icon={<Wallet className="text-green-600" size={28} />}
              label="Wallet Balance"
              value={`₹${(stats.walletBalance || 0).toFixed(2)}`}
              subtext="available funds"
            />
            <StatCard
              icon={<ShoppingBag className="text-amber-600" size={28} />}
              label="Active Orders"
              value={stats.activeOrders || 0}
              subtext="being delivered"
            />
            <StatCard
              icon={<Sun className="text-emerald-600" size={28} />}
              label="Total Savings"
              value={`₹${(stats.totalSaved || 0).toFixed(2)}`}
              subtext="vs DISCOM grid rate"
            />
          </>
        ) : (
          <>
            <StatCard
              icon={<Users className="text-green-600" size={28} />}
              label="Total Users"
              value={stats.total_users || 0}
              subtext="registered"
            />
            <StatCard
              icon={<DollarSign className="text-blue-600" size={28} />}
              label="Platform Fees"
              value={`₹${(stats.platform_fees_collected || 0).toFixed(2)}`}
              subtext="collected"
            />
            <StatCard
              icon={<Shield className="text-red-600" size={28} />}
              label="Disputed Trades"
              value={stats.disputed_trades || 0}
              subtext="need resolution"
            />
          </>
        )}
      </div>

      {/* Quick Navigation */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {user.role === 'prosumer' && (
          <>
            <QuickLink icon={<List size={22} />} title="My Listings" description="Create and manage energy listings" href="/my-listings" color="green" />
            <QuickLink icon={<ArrowLeftRight size={22} />} title="My Trades" description="View and manage active trades" href="/my-trades" color="blue" />
            <QuickLink icon={<ShoppingBag size={22} />} title="Marketplace" description="See what others are selling" href="/marketplace" color="amber" />
          </>
        )}
        {user.role === 'consumer' && (
          <>
            <QuickLink icon={<ShoppingBag size={22} />} title="Marketplace" description="Browse available energy listings" href="/marketplace" color="green" />
            <QuickLink icon={<Wallet size={22} />} title="Wallet" description="Manage your balance and funds" href="/wallet" color="blue" />
            <QuickLink icon={<ArrowLeftRight size={22} />} title="My Trades" description="Track orders and deliveries" href="/my-trades" color="amber" />
          </>
        )}
        {user.role === 'admin' && (
          <>
            <QuickLink icon={<Shield size={22} />} title="Disputes" description="Resolve contested trades" href="/admin/disputes" color="red" />
          </>
        )}
      </div>

      {/* Recent Trades */}
      {stats.recentTrades?.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Trades</h2>
            <Link to="/my-trades" className="text-sm text-green-600 font-semibold hover:text-green-700">
              View all →
            </Link>
          </div>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-semibold">Party</th>
                  <th className="text-left px-5 py-3 font-semibold">Units</th>
                  <th className="text-left px-5 py-3 font-semibold">Amount</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentTrades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{trade.other_party_name}</td>
                    <td className="px-5 py-3 text-gray-600">{parseFloat(trade.units_requested).toFixed(1)} kWh</td>
                    <td className="px-5 py-3 text-gray-600">₹{parseFloat(trade.total_amount).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${trade.trade_status === 'completed' ? 'bg-green-100 text-green-700' :
                          trade.trade_status === 'delivering' ? 'bg-amber-100 text-amber-700' :
                            trade.trade_status === 'disputed' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${trade.trade_status === 'completed' ? 'bg-green-500' :
                            trade.trade_status === 'delivering' ? 'bg-amber-500 animate-pulse' :
                              'bg-gray-400'
                          }`} />
                        {trade.trade_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const colorMap = {
  green: { bg: 'bg-green-50', icon: 'text-green-600', hover: 'hover:border-green-300' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', hover: 'hover:border-blue-300' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', hover: 'hover:border-amber-300' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', hover: 'hover:border-red-300' },
}

function QuickLink({ icon, title, description, href, color = 'green' }) {
  const c = colorMap[color]
  return (
    <Link
      to={href}
      className={`card-hover flex items-center gap-4 border-2 border-transparent ${c.hover}`}
    >
      <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <div>
        <h3 className="font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </Link>
  )
}
