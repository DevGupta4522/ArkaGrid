import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, useToast } from '../hooks/useContext'
import { walletAPI } from '../api/wallet'
import { tradesAPI } from '../api/trades'
import { listingsAPI } from '../api/listings'
import { adminAPI } from '../api/admin'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  Zap, Sun, Battery, TrendingUp, TrendingDown, DollarSign,
  Activity, Users, ShoppingBag, ArrowRight, Shield,
  Wifi, WifiOff, BarChart3, BatteryCharging, Gauge, Bolt,
  ArrowLeftRight, CircleDollarSign
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Filler, Tooltip, Legend
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Filler, Tooltip, Legend
)

// ─── Simulated real-time data generator ───
function useSimulatedData() {
  const [data, setData] = useState(() => generateSnapshot())

  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateSnapshot())
    }, 5000) // Update every 5 seconds
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
    solarOutput,
    batteryLevel: +batteryLevel.toFixed(0),
    gridPrice,
    arkaPrice,
    savingsToday: +((gridPrice - arkaPrice) * (8 + Math.random() * 4)).toFixed(1),
    monthRevenue: +(1200 + Math.random() * 800).toFixed(0),
    gridStatus: Math.random() > 0.1 ? 'online' : 'peak',
    homeConsumption: +(1.5 + Math.random() * 2).toFixed(2),
    gridExport: +(solarOutput > 2 ? solarOutput - 1.5 - Math.random() : 0).toFixed(2),
    isSunny,
  }
}

function generateHourlyData(hours = 24) {
  const labels = []
  const solar = []
  const battery = []
  const bought = []
  const sold = []
  const now = new Date()

  for (let i = hours - 1; i >= 0; i--) {
    const h = new Date(now - i * 3600000)
    const hr = h.getHours()
    labels.push(`${hr.toString().padStart(2, '0')}:00`)

    const isSun = hr >= 6 && hr <= 18
    const mult = isSun ? Math.sin(((hr - 6) / 12) * Math.PI) : 0
    solar.push(+(mult * (3 + Math.random() * 2)).toFixed(2))
    battery.push(Math.min(95, Math.max(10, 30 + mult * 40 + (Math.random() * 15 - 7))))
    bought.push(+(Math.random() * 3).toFixed(2))
    sold.push(+(mult * (1 + Math.random() * 2)).toFixed(2))
  }

  return { labels, solar, battery, bought, sold }
}

// ─── Main Dashboard ───
export default function Dashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [trades, setTrades] = useState([])
  const liveData = useSimulatedData()
  const [hourlyData] = useState(() => generateHourlyData())

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [tradesRes] = await Promise.allSettled([
        tradesAPI.getMyTrades(),
      ])

      if (tradesRes.status === 'fulfilled') {
        setTrades(tradesRes.value.data || [])
      }

      if (user?.role === 'admin') {
        try {
          const adminRes = await adminAPI.getStats()
          setStats(adminRes.data)
        } catch (e) { /* admin stats optional */ }
      }
    } catch (err) {
      // Silent fail — dashboard still renders with simulated data
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner message="Loading dashboard..." />

  const activeTrades = trades.filter(t => ['pending', 'delivering', 'completing'].includes(t.trade_status))
  const completedTrades = trades.filter(t => t.trade_status === 'completed')
  const totalTraded = completedTrades.reduce((sum, t) => sum + parseFloat(t.units_requested || 0), 0)

  // Unique trade partners
  const partners = [...new Set(trades.map(t =>
    t.prosumer_id === user?.id ? t.consumer_name || 'Consumer' : t.prosumer_name || 'Prosumer'
  ))].slice(0, 5)

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${liveData.gridStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
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
              <Sun size={16} /> Manage Listings
            </Link>
          )}
        </div>
      </div>

      {/* ── Live Metrics Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <MetricCard
          icon={Sun} color="amber" label="Solar Output"
          value={`${liveData.solarOutput} kW`}
          sub={liveData.isSunny ? 'Active' : 'Night'}
          pulse={liveData.isSunny}
        />
        <MetricCard
          icon={Battery} color="green" label="Battery"
          value={`${liveData.batteryLevel}%`}
          sub={liveData.batteryLevel > 60 ? 'Charging' : 'Low'}
          pulse={liveData.batteryLevel > 60}
        />
        <MetricCard
          icon={DollarSign} color="emerald" label="Savings Today"
          value={`₹${liveData.savingsToday}`}
          sub="vs JVVNL grid"
        />
        <MetricCard
          icon={TrendingUp} color="blue" label="Month Revenue"
          value={`₹${liveData.monthRevenue}`}
          sub="This month"
        />
        <MetricCard
          icon={Gauge} color="purple" label="Grid Price"
          value={`₹${liveData.gridPrice}/kWh`}
          sub={`ArkaGrid: ₹${liveData.arkaPrice}`}
        />
        <MetricCard
          icon={liveData.gridStatus === 'online' ? Wifi : WifiOff}
          color={liveData.gridStatus === 'online' ? 'green' : 'amber'}
          label="Grid Status"
          value={liveData.gridStatus === 'online' ? 'Online' : 'Peak'}
          sub={liveData.gridStatus === 'online' ? 'Normal load' : 'High demand'}
          pulse={true}
        />
      </div>

      {/* ── Row 2: Energy Flow + Solar Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Live Energy Flow */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-green-500" />
            Live Energy Flow
          </h3>
          <EnergyFlowDiagram data={liveData} />
        </div>

        {/* Solar Output Chart */}
        <div className="lg:col-span-3 card p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Sun size={16} className="text-amber-500" />
            Solar Output (24h)
          </h3>
          <div className="h-52">
            <Line
              data={{
                labels: hourlyData.labels,
                datasets: [{
                  label: 'Solar kW',
                  data: hourlyData.solar,
                  borderColor: '#f59e0b',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  fill: true,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 5,
                  borderWidth: 2.5,
                }]
              }}
              options={chartOptions('kW')}
            />
          </div>
        </div>
      </div>

      {/* ── Row 3: Battery + Bought vs Sold ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Battery Level Chart */}
        <div className="card p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <BatteryCharging size={16} className="text-green-500" />
            Battery Level (24h)
          </h3>
          <div className="h-48">
            <Line
              data={{
                labels: hourlyData.labels,
                datasets: [{
                  label: 'Battery %',
                  data: hourlyData.battery,
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  fill: true,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 5,
                  borderWidth: 2.5,
                }]
              }}
              options={chartOptions('%', 100)}
            />
          </div>
        </div>

        {/* Energy Bought vs Sold */}
        <div className="card p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-500" />
            Energy Bought vs Sold (24h)
          </h3>
          <div className="h-48">
            <Bar
              data={{
                labels: hourlyData.labels,
                datasets: [
                  {
                    label: 'Bought (kWh)',
                    data: hourlyData.bought,
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderRadius: 4,
                  },
                  {
                    label: 'Sold (kWh)',
                    data: hourlyData.sold,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderRadius: 4,
                  }
                ]
              }}
              options={{
                ...chartOptions('kWh'),
                plugins: {
                  ...chartOptions('kWh').plugins,
                  legend: { display: true, position: 'top', labels: { boxWidth: 12, usePointStyle: true, font: { size: 11 } } }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Row 4: Savings vs JVVNL + Active Trade Partners ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Savings vs JVVNL */}
        <div className="lg:col-span-3 card p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <CircleDollarSign size={16} className="text-emerald-500" />
            Savings vs JVVNL Grid (7 Days)
          </h3>
          <div className="h-48">
            <Bar
              data={{
                labels: getLast7Days(),
                datasets: [
                  {
                    label: 'JVVNL Cost (₹)',
                    data: Array.from({ length: 7 }, () => +(60 + Math.random() * 30).toFixed(0)),
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    borderRadius: 6,
                  },
                  {
                    label: 'ArkaGrid Cost (₹)',
                    data: Array.from({ length: 7 }, () => +(35 + Math.random() * 20).toFixed(0)),
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderRadius: 6,
                  },
                ]
              }}
              options={{
                ...chartOptions('₹'),
                plugins: {
                  ...chartOptions('₹').plugins,
                  legend: { display: true, position: 'top', labels: { boxWidth: 12, usePointStyle: true, font: { size: 11 } } }
                }
              }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between p-3 bg-green-50 rounded-xl">
            <span className="text-sm text-gray-600">Average weekly savings</span>
            <span className="font-bold text-green-600 flex items-center gap-1">
              <TrendingDown size={14} /> ₹{(liveData.savingsToday * 7 * 0.8).toFixed(0)} saved
            </span>
          </div>
        </div>

        {/* Active Trade Partners */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Users size={16} className="text-blue-500" />
            Active Trade Partners
          </h3>

          {partners.length > 0 ? (
            <div className="space-y-3">
              {partners.map((name, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{name}</p>
                    <p className="text-xs text-gray-400">Recent trade partner</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <span className="text-xs font-semibold">★ {(4 + Math.random()).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                <Users size={24} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400 font-medium">No trade partners yet</p>
              <Link to="/marketplace" className="text-green-600 text-xs font-semibold mt-2 hover:text-green-700">
                Start trading →
              </Link>
            </div>
          )}

          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <p className="text-xl font-extrabold text-blue-600">{activeTrades.length}</p>
              <p className="text-xs text-gray-500">Active Trades</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-xl font-extrabold text-green-600">{totalTraded.toFixed(1)}</p>
              <p className="text-xs text-gray-500">kWh Traded</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 5: Recent Trades ── */}
      {trades.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <ArrowLeftRight size={16} className="text-purple-500" />
              Recent Trades
            </h3>
            <Link to="/my-trades" className="text-green-600 text-xs font-semibold hover:text-green-700 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-3 font-medium">Partner</th>
                  <th className="text-left pb-3 font-medium">Units</th>
                  <th className="text-left pb-3 font-medium">Price</th>
                  <th className="text-left pb-3 font-medium">Total</th>
                  <th className="text-left pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 5).map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-medium text-gray-900">
                      {trade.prosumer_id === user?.id ? (trade.consumer_name || 'Consumer') : (trade.prosumer_name || 'Prosumer')}
                    </td>
                    <td className="py-3 text-gray-600">{parseFloat(trade.units_requested).toFixed(1)} kWh</td>
                    <td className="py-3 text-gray-600">₹{parseFloat(trade.price_per_unit).toFixed(2)}</td>
                    <td className="py-3 font-semibold text-gray-900">₹{parseFloat(trade.total_amount).toFixed(2)}</td>
                    <td className="py-3">
                      <StatusPill status={trade.trade_status} />
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

// ─── Metric Card Component ───
function MetricCard({ icon: Icon, color, label, value, sub, pulse }) {
  const colorMap = {
    amber: 'from-amber-500 to-orange-500 shadow-amber-500/20',
    green: 'from-green-500 to-emerald-500 shadow-green-500/20',
    emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/20',
    blue: 'from-blue-500 to-indigo-500 shadow-blue-500/20',
    purple: 'from-purple-500 to-violet-500 shadow-purple-500/20',
  }

  return (
    <div className="card p-4 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
          <Icon size={16} className="text-white" />
        </div>
        {pulse && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
      </div>
      <p className="text-lg font-extrabold text-gray-900 tracking-tight">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Live Energy Flow Diagram ───
function EnergyFlowDiagram({ data }) {
  return (
    <div className="relative flex flex-col items-center gap-4 py-4">
      {/* Solar Panel */}
      <div className="flex items-center gap-4 w-full">
        <div className={`flex-1 text-center p-4 rounded-2xl border-2 transition-all ${data.isSunny ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'
          }`}>
          <Sun size={28} className={data.isSunny ? 'text-amber-500 mx-auto animate-spin-slow' : 'text-gray-300 mx-auto'} />
          <p className="text-xs font-bold mt-2 text-gray-700">Solar Panel</p>
          <p className="text-lg font-extrabold text-amber-600">{data.solarOutput} kW</p>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center">
          <div className={`w-8 h-0.5 ${data.solarOutput > 0 ? 'bg-amber-400' : 'bg-gray-200'}`} />
          {data.solarOutput > 0 && (
            <div className="flex gap-0.5 mt-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
              ))}
            </div>
          )}
        </div>

        {/* Home */}
        <div className="flex-1 text-center p-4 rounded-2xl bg-blue-50 border-2 border-blue-200">
          <Zap size={28} className="text-blue-500 mx-auto" />
          <p className="text-xs font-bold mt-2 text-gray-700">Home</p>
          <p className="text-lg font-extrabold text-blue-600">{data.homeConsumption} kW</p>
        </div>
      </div>

      {/* Second Row: Battery + Grid */}
      <div className="flex items-center gap-4 w-full">
        <div className={`flex-1 text-center p-4 rounded-2xl border-2 transition-all ${data.batteryLevel > 50 ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-200'
          }`}>
          <Battery size={28} className={data.batteryLevel > 50 ? 'text-green-500 mx-auto' : 'text-orange-500 mx-auto'} />
          <p className="text-xs font-bold mt-2 text-gray-700">Battery</p>
          <p className="text-lg font-extrabold text-green-600">{data.batteryLevel}%</p>
          {/* Battery bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${data.batteryLevel > 60 ? 'bg-green-500' : data.batteryLevel > 30 ? 'bg-amber-500' : 'bg-red-500'
                }`}
              style={{ width: `${data.batteryLevel}%` }}
            />
          </div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center">
          <div className={`w-8 h-0.5 ${parseFloat(data.gridExport) > 0 ? 'bg-green-400' : 'bg-gray-200'}`} />
          {parseFloat(data.gridExport) > 0 && (
            <p className="text-[10px] text-green-600 font-bold mt-1">Export</p>
          )}
        </div>

        <div className={`flex-1 text-center p-4 rounded-2xl border-2 ${data.gridStatus === 'online' ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'
          }`}>
          <Bolt size={28} className={data.gridStatus === 'online' ? 'text-emerald-500 mx-auto' : 'text-amber-500 mx-auto'} />
          <p className="text-xs font-bold mt-2 text-gray-700">Grid</p>
          <p className="text-lg font-extrabold text-emerald-600">₹{data.gridPrice}</p>
          <p className="text-[10px] text-gray-400">/kWh</p>
        </div>
      </div>
    </div>
  )
}

// ─── Status Pill ───
function StatusPill({ status }) {
  const config = {
    pending: 'bg-amber-100 text-amber-700',
    delivering: 'bg-blue-100 text-blue-700',
    completing: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    disputed: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${config[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

// ─── Chart defaults ───
function chartOptions(unit, max) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        padding: 12,
        titleFont: { size: 12 },
        bodyFont: { size: 13 },
        cornerRadius: 10,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} ${unit}`
        }
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#9ca3af', maxTicksLimit: 8 },
      },
      y: {
        max,
        grid: { color: '#f3f4f6' },
        ticks: { font: { size: 10 }, color: '#9ca3af' },
      },
    },
  }
}

// ─── Helpers ───
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getLast7Days() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return days[d.getDay()]
  })
}
