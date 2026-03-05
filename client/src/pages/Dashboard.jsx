import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, useToast } from '../hooks/useContext'
import { tradesAPI } from '../api/trades'
import { adminAPI } from '../api/admin'
import LoadingSpinner from '../components/LoadingSpinner'
import AnimatedCounter from '../components/AnimatedCounter'
import StatusBadge from '../components/StatusBadge'
import {
  Zap, Sun, Battery, TrendingUp, TrendingDown, DollarSign,
  Activity, Users, ShoppingBag, ArrowRight, Shield,
  Wifi, WifiOff, BarChart3, BatteryCharging, Gauge, Bolt,
  ArrowLeftRight, CircleDollarSign, Star, Plus, Leaf, ExternalLink
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'

// ─── Simulated real-time data ───
function useSimulatedData() {
  const [data, setData] = useState(() => generateSnapshot())
  useEffect(() => {
    const interval = setInterval(() => setData(generateSnapshot()), 5000)
    return () => clearInterval(interval)
  }, [])
  return data
}

function generateSnapshot() {
  const hour = new Date().getHours()
  const isSunny = hour >= 6 && hour <= 18
  const solarMultiplier = isSunny ? Math.sin(((hour - 6) / 12) * Math.PI) : 0
  const solarOutput = +(solarMultiplier * (3.5 + Math.random() * 1.5)).toFixed(2)
  const batteryLevel = Math.min(95, Math.max(15, 40 + solarOutput * 8 + (Math.random() * 10 - 5)))
  const gridPrice = +(7.5 + Math.random() * 1.5).toFixed(2)
  const arkaPrice = +(5.5 + Math.random() * 1.2).toFixed(2)

  return {
    solarOutput, batteryLevel: +batteryLevel.toFixed(0), gridPrice, arkaPrice,
    savingsToday: +((gridPrice - arkaPrice) * (8 + Math.random() * 4)).toFixed(1),
    monthRevenue: +(1200 + Math.random() * 800).toFixed(0),
    gridStatus: Math.random() > 0.1 ? 'online' : 'peak',
    homeConsumption: +(1.5 + Math.random() * 2).toFixed(2),
    gridExport: +(solarOutput > 2 ? solarOutput - 1.5 - Math.random() : 0).toFixed(2),
    isSunny,
  }
}

function generateHourlyData() {
  const data = []
  const now = new Date()
  for (let i = 23; i >= 0; i--) {
    const h = new Date(now - i * 3600000)
    const hr = h.getHours()
    const isSun = hr >= 6 && hr <= 18
    const mult = isSun ? Math.sin(((hr - 6) / 12) * Math.PI) : 0
    data.push({
      time: `${hr.toString().padStart(2, '0')}:00`,
      solar: +(mult * (3 + Math.random() * 2)).toFixed(2),
      battery: Math.min(95, Math.max(10, 30 + mult * 40 + (Math.random() * 15 - 7))),
      bought: +(Math.random() * 3).toFixed(2),
      sold: +(mult * (1 + Math.random() * 2)).toFixed(2),
    })
  }
  return data
}

const EXPLORER_BASE = 'https://explorer.solana.com'
const CLUSTER = 'devnet'

// ─── Main Dashboard ───
export default function Dashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [trades, setTrades] = useState([])
  const [carbonCredits, setCarbonCredits] = useState(null)
  const liveData = useSimulatedData()
  const [hourlyData] = useState(() => generateHourlyData())

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    try {
      const promises = [tradesAPI.getMyTrades()]
      // Fetch carbon credits for prosumers
      if (user?.role === 'prosumer') {
        promises.push(
          fetch('/api/trades/carbon-credits', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }).then(r => r.json()).catch(() => null)
        )
      }
      const [tradesRes, carbonRes] = await Promise.allSettled(promises)
      if (tradesRes.status === 'fulfilled') setTrades(tradesRes.value.data || [])
      if (carbonRes?.status === 'fulfilled' && carbonRes.value?.success) {
        setCarbonCredits(carbonRes.value.data)
      }
    } catch (err) { /* silent */ }
    finally { setLoading(false) }
  }

  if (loading) return <LoadingSpinner message="Loading dashboard..." />

  const activeTrades = trades.filter(t => ['pending', 'delivering', 'completing'].includes(t.trade_status))
  const completedTrades = trades.filter(t => t.trade_status === 'completed')
  const totalTraded = completedTrades.reduce((sum, t) => sum + parseFloat(t.units_requested || 0), 0)

  const partners = [...new Set(trades.map(t =>
    t.prosumer_id === user?.id ? t.consumer_name || 'Consumer' : t.prosumer_name || 'Prosumer'
  ))].slice(0, 5)

  return (
    <div className="page-container animate-fade-in pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-heading">
            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <span className="live-dot" />
            Grid {liveData.gridStatus === 'online' ? 'Online' : 'Peak Hours'} • Live data
          </p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'consumer' && (
            <Link to="/marketplace" className="btn-primary text-sm flex items-center gap-2">
              <ShoppingBag size={16} /> Buy Energy
            </Link>
          )}
          {user?.role === 'prosumer' && (
            <Link to="/my-listings" className="btn-primary text-sm flex items-center gap-2">
              <Plus size={16} /> New Listing
            </Link>
          )}
        </div>
      </div>

      {/* ── Glassmorphism Hero Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {user?.role === 'prosumer' ? (
          <>
            <GlassStatCard
              icon={TrendingUp} color="green" label="Total Earned"
              value={liveData.monthRevenue} prefix="₹" decimals={0}
              sub={`+₹${Math.round(liveData.savingsToday * 7)} this week`}
              subColor="text-volt-green"
            />
            <GlassStatCard
              icon={Zap} color="amber" label="Energy Sold"
              value={totalTraded || 142.6} suffix=" kWh" decimals={1}
              sub="This month"
            />
            <GlassStatCard
              icon={Sun} color="green" label="Active Listings"
              value={activeTrades.length || 3} decimals={0}
              sub="Live now" live
            />
            <GlassStatCard
              icon={Star} color="amber" label="Your Rating"
              value={4.8} prefix="" suffix="" decimals={1}
              sub="Based on 24 trades" stars
            />
          </>
        ) : user?.role === 'consumer' ? (
          <>
            <GlassStatCard
              icon={DollarSign} color="green" label="Wallet Balance"
              value={parseFloat(user?.wallet_balance || 1840)} prefix="₹" decimals={0}
              sub="Available balance"
            />
            <GlassStatCard
              icon={TrendingDown} color="green" label="Saved This Month"
              value={liveData.savingsToday * 7 * 0.8} prefix="₹" decimals={0}
              sub="vs DISCOM rate" subColor="text-volt-green"
            />
            <GlassStatCard
              icon={Zap} color="blue" label="Purchased"
              value={totalTraded || 89.4} suffix=" kWh" decimals={1}
              sub="This month"
            />
            <GlassStatCard
              icon={Activity} color="amber" label="Active Orders"
              value={activeTrades.length} decimals={0}
              sub={activeTrades.length > 0 ? 'In progress' : 'No active orders'}
            />
          </>
        ) : (
          <>
            <GlassStatCard icon={Users} color="blue" label="Total Users" value={340} decimals={0} sub="Active accounts" />
            <GlassStatCard icon={ArrowLeftRight} color="green" label="Total Trades" value={trades.length} decimals={0} sub="All time" />
            <GlassStatCard icon={Shield} color="amber" label="Disputes" value={2} decimals={0} sub="Pending review" />
            <GlassStatCard icon={DollarSign} color="green" label="Platform Revenue" value={12400} prefix="₹" decimals={0} sub="This month" />
          </>
        )}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Solar Output Chart */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2">
              <Sun size={16} className="text-accent-400" />
              Solar Output (24h)
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="live-dot" />
              <span className="text-gray-500">Live</span>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="time" stroke="#4B5563" fontSize={10} tickLine={false} />
                <YAxis stroke="#4B5563" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '12px', color: '#F9FAFB' }}
                  labelStyle={{ color: '#6B7280' }}
                />
                <Area type="monotone" dataKey="solar" stroke="#F59E0B" fill="url(#solarGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Energy Flow */}
        <div className="lg:col-span-2 card">
          <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-volt-green" />
            Live Energy Flow
          </h3>
          <EnergyFlowDiagram data={liveData} />
        </div>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
            <BatteryCharging size={16} className="text-volt-green" />
            Battery Level (24h)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="battGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF94" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00FF94" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="time" stroke="#4B5563" fontSize={10} tickLine={false} />
                <YAxis stroke="#4B5563" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '12px', color: '#F9FAFB' }}
                />
                <Area type="monotone" dataKey="battery" stroke="#00FF94" fill="url(#battGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-vblue-400" />
            Bought vs Sold (24h)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="time" stroke="#4B5563" fontSize={10} tickLine={false} />
                <YAxis stroke="#4B5563" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '12px', color: '#F9FAFB' }}
                />
                <Bar dataKey="bought" fill="#3B82F6" radius={[4, 4, 0, 0]} opacity={0.8} />
                <Bar dataKey="sold" fill="#00FF94" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-vblue-400" /> Bought</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-volt-green" /> Sold</div>
          </div>
        </div>
      </div>

      {/* ── 🌱 Carbon Credits (Prosumer Only) ── */}
      {user?.role === 'prosumer' && (
        <div className="card mb-6 bg-gradient-to-br from-green-900/10 to-transparent border border-green-500/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2">
              <Leaf size={16} className="text-green-400" />
              🌱 Carbon Credits — Verified on Solana
            </h3>
            {carbonCredits && (
              <span className="text-xs text-green-400 font-semibold">{carbonCredits.total_credits} credits</span>
            )}
          </div>

          {/* Hero stat */}
          <div className="flex items-center gap-6 mb-5">
            <div>
              <p className="text-3xl md:text-4xl font-extrabold text-green-400 font-mono tabular-nums">
                {carbonCredits?.total_kwh_verified?.toFixed(1) || '0.0'}
                <span className="text-lg text-green-400/60 ml-1">kWh</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">Total clean energy verified on Solana</p>
            </div>
            <div className="hidden md:block w-px h-12 bg-green-500/20" />
            <div className="hidden md:block">
              <p className="text-xs text-gray-500">🌱 Carbon credit recorded for every verified kWh</p>
              <p className="text-xs text-gray-600 mt-0.5">Each credit represents clean solar energy replacing fossil fuels</p>
            </div>
          </div>

          {/* Credit list */}
          {carbonCredits?.credits?.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {carbonCredits.credits.slice(0, 10).map((credit) => (
                <div key={credit.id} className="flex items-center justify-between bg-volt-dark/60 rounded-xl p-3 text-sm border border-volt-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Leaf size={14} className="text-green-400" />
                    </div>
                    <div>
                      <p className="font-mono text-white text-xs">{credit.kwh.toFixed(2)} kWh</p>
                      <p className="text-[10px] text-gray-600">{new Date(credit.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-volt-green font-mono">₹{credit.earned.toFixed(0)}</span>
                    {credit.tx_hash && (
                      <a href={`${EXPLORER_BASE}/tx/${credit.tx_hash}?cluster=${CLUSTER}`}
                         target="_blank" rel="noopener noreferrer"
                         className="p-1 hover:bg-white/5 rounded-lg transition-colors">
                        <ExternalLink size={12} className="text-green-400" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">No Solana-verified trades yet</p>
              <p className="text-xs text-gray-600 mt-1">Carbon credits appear after trades are settled on-chain</p>
            </div>
          )}
        </div>
      )}

      {/* ── Recent Trades ── */}
      {trades.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2">
              <ArrowLeftRight size={16} className="text-purple-400" />
              Recent Trades
            </h3>
            <Link to="/my-trades" className="text-volt-green text-xs font-semibold hover:text-volt-green/80 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-600 border-b border-volt-border">
                  <th className="text-left pb-3 font-medium">Partner</th>
                  <th className="text-left pb-3 font-medium">Units</th>
                  <th className="text-left pb-3 font-medium">Price</th>
                  <th className="text-left pb-3 font-medium">Total</th>
                  <th className="text-left pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 5).map((trade, i) => (
                  <tr key={trade.id} className={`border-b border-volt-border/50 hover:bg-white/[0.02] transition-colors animate-fade-in stagger-${i + 1}`}>
                    <td className="py-3 font-medium text-gray-300">
                      {trade.prosumer_id === user?.id ? (trade.consumer_name || 'Consumer') : (trade.prosumer_name || 'Prosumer')}
                    </td>
                    <td className="py-3 text-gray-400 mono-value">{parseFloat(trade.units_requested).toFixed(1)} kWh</td>
                    <td className="py-3 text-gray-400 mono-value">₹{parseFloat(trade.price_per_unit).toFixed(2)}</td>
                    <td className="py-3 font-semibold text-white mono-value">₹{parseFloat(trade.total_amount).toFixed(2)}</td>
                    <td className="py-3"><StatusBadge status={trade.trade_status} /></td>
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

// ─── Glass Stat Card ───
function GlassStatCard({ icon: Icon, color, label, value, prefix = '', suffix = '', decimals = 0, sub, subColor = 'text-gray-500', live, stars }) {
  const colorMap = {
    green: 'from-volt-green/20 to-volt-green/5 text-volt-green border-volt-green/20',
    amber: 'from-accent-500/20 to-accent-500/5 text-accent-400 border-accent-500/20',
    blue: 'from-vblue-400/20 to-vblue-400/5 text-vblue-400 border-vblue-400/20',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20',
  }

  const iconColorMap = {
    green: 'text-volt-green',
    amber: 'text-accent-400',
    blue: 'text-vblue-400',
    purple: 'text-purple-400',
  }

  return (
    <div className="card-glass group hover:border-volt-green/20 transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center border`}>
          <Icon size={18} className={iconColorMap[color]} />
        </div>
        {live && <span className="live-dot" />}
      </div>
      <p className="text-2xl font-bold font-mono text-white tracking-tight tabular-nums">
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {stars && (
        <div className="flex items-center gap-0.5 mt-1">
          {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className={s <= 4 ? 'text-accent-400 fill-accent-400' : 'text-accent-400/50 fill-accent-400/50'} />)}
        </div>
      )}
      {sub && <p className={`text-[10px] mt-1 ${subColor}`}>{sub}</p>}
    </div>
  )
}

// ─── Energy Flow ───
function EnergyFlowDiagram({ data }) {
  return (
    <div className="relative flex flex-col items-center gap-3 py-2">
      <div className="flex items-center gap-3 w-full">
        <div className={`flex-1 text-center p-3 rounded-xl border transition-all ${data.isSunny ? 'bg-accent-500/5 border-accent-500/20' : 'bg-volt-border/30 border-volt-border'}`}>
          <Sun size={24} className={data.isSunny ? 'text-accent-400 mx-auto animate-spin-slow' : 'text-gray-600 mx-auto'} />
          <p className="text-[10px] font-bold mt-1 text-gray-400">Solar</p>
          <p className="text-lg font-bold font-mono text-accent-400">{data.solarOutput} kW</p>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className={`w-6 h-0.5 ${data.solarOutput > 0 ? 'bg-accent-400' : 'bg-volt-border'}`} />
          {data.solarOutput > 0 && (
            <div className="flex gap-0.5">
              {[0, 1, 2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-accent-400 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />)}
            </div>
          )}
        </div>
        <div className="flex-1 text-center p-3 rounded-xl bg-vblue-400/5 border border-vblue-400/20">
          <Zap size={24} className="text-vblue-400 mx-auto" />
          <p className="text-[10px] font-bold mt-1 text-gray-400">Home</p>
          <p className="text-lg font-bold font-mono text-vblue-400">{data.homeConsumption} kW</p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full">
        <div className={`flex-1 text-center p-3 rounded-xl border transition-all ${data.batteryLevel > 50 ? 'bg-volt-green/5 border-volt-green/20' : 'bg-accent-500/5 border-accent-500/20'}`}>
          <Battery size={24} className={data.batteryLevel > 50 ? 'text-volt-green mx-auto' : 'text-accent-400 mx-auto'} />
          <p className="text-[10px] font-bold mt-1 text-gray-400">Battery</p>
          <p className="text-lg font-bold font-mono text-volt-green">{data.batteryLevel}%</p>
          <div className="w-full h-1.5 bg-volt-border rounded-full mt-1 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${data.batteryLevel > 60 ? 'bg-volt-green' : data.batteryLevel > 30 ? 'bg-accent-500' : 'bg-danger-400'}`}
              style={{ width: `${data.batteryLevel}%` }} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className={`w-6 h-0.5 ${parseFloat(data.gridExport) > 0 ? 'bg-volt-green' : 'bg-volt-border'}`} />
          {parseFloat(data.gridExport) > 0 && <p className="text-[9px] text-volt-green font-bold">Export</p>}
        </div>
        <div className={`flex-1 text-center p-3 rounded-xl border ${data.gridStatus === 'online' ? 'bg-volt-green/5 border-volt-green/20' : 'bg-accent-500/5 border-accent-500/20'}`}>
          <Bolt size={24} className={data.gridStatus === 'online' ? 'text-volt-green mx-auto' : 'text-accent-400 mx-auto'} />
          <p className="text-[10px] font-bold mt-1 text-gray-400">Grid</p>
          <p className="text-lg font-bold font-mono text-volt-green">₹{data.gridPrice}</p>
          <p className="text-[9px] text-gray-600">/kWh</p>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
