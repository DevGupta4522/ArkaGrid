import React, { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAuth } from '../hooks/useContext'
import { Zap, Sun, Battery, Users, ArrowLeftRight, Filter, MapPin } from 'lucide-react'

// ── Fix default Leaflet marker icon (broken in bundlers) ──
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ── Custom marker icons ──
function createIcon(color, size = 28) {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:12px;color:white;font-weight:bold;
    ">${color === '#f59e0b' ? '☀' : color === '#3b82f6' ? '⚡' : '★'}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
    })
}

const prosumerIcon = createIcon('#f59e0b', 30)
const consumerIcon = createIcon('#3b82f6', 26)
const activeTradeIcon = createIcon('#10b981', 32)

// ── Generate 50 simulated users in Jaipur area ──
const CENTER = [26.9124, 75.7873] // Jaipur, Rajasthan (JVVNL territory)
const NAMES = [
    'Rajesh Sharma', 'Priya Gupta', 'Amit Patel', 'Sunita Devi', 'Rohan Mehra',
    'Kavita Singh', 'Deepak Kumar', 'Anjali Verma', 'Vikram Joshi', 'Neha Agarwal',
    'Sandeep Rathore', 'Pooja Yadav', 'Manoj Tiwari', 'Ritu Chauhan', 'Arun Saxena',
    'Meena Kumari', 'Suresh Tanwar', 'Divya Bhatt', 'Karan Malhotra', 'Seema Jain',
    'Rakesh Tomar', 'Suman Pandey', 'Vikas Rawat', 'Aarti Mishra', 'Nikhil Soni',
    'Geeta Chaudhary', 'Pankaj Goyal', 'Rekha Mathur', 'Ashish Bansal', 'Sapna Sharma',
    'Mohit Choudhary', 'Lata Pareek', 'Gaurav Khandelwal', 'Kusum Bohra', 'Naveen Shekhawat',
    'Usha Purohit', 'Vivek Saini', 'Nirmala Vyas', 'Sanjay Bairwa', 'Anita Meena',
    'Rahul Dadhich', 'Bhavna Rathod', 'Yogesh Kumawat', 'Indira Kanwar', 'Akash Dangayach',
    'Mamta Saran', 'Dheeraj Mittal', 'Pushpa Jangid', 'Tarun Acharya', 'Swati Lodha'
]

const AREAS = [
    'Malviya Nagar', 'Vaishali Nagar', 'Mansarovar', 'Jagatpura', 'Tonk Road',
    'C-Scheme', 'Raja Park', 'Sitapura', 'Sanganer', 'Jhotwara',
    'Pratap Nagar', 'Durgapura', 'Sodala', 'Bapu Nagar', 'Shyam Nagar',
    'Nirman Nagar', 'Lal Kothi', 'Bani Park', 'Adarsh Nagar', 'Civil Lines',
]

function generateUsers() {
    const users = []
    for (let i = 0; i < 50; i++) {
        const role = Math.random() > 0.45 ? 'prosumer' : 'consumer'
        const lat = CENTER[0] + (Math.random() - 0.5) * 0.08
        const lng = CENTER[1] + (Math.random() - 0.5) * 0.1
        users.push({
            id: i + 1,
            name: NAMES[i],
            role,
            area: AREAS[i % AREAS.length],
            lat,
            lng,
            solarCapacity: role === 'prosumer' ? +(3 + Math.random() * 7).toFixed(1) : 0,
            currentOutput: role === 'prosumer' ? +(1 + Math.random() * 4).toFixed(2) : 0,
            pricePerUnit: role === 'prosumer' ? +(5 + Math.random() * 2.5).toFixed(2) : 0,
            unitsAvailable: role === 'prosumer' ? +(2 + Math.random() * 10).toFixed(1) : 0,
            rating: +(3.5 + Math.random() * 1.5).toFixed(1),
            totalTrades: Math.floor(5 + Math.random() * 40),
            walletBalance: +(500 + Math.random() * 4500).toFixed(0),
            isOnline: Math.random() > 0.2,
        })
    }
    return users
}

function generateActiveTrades(users) {
    const prosumers = users.filter(u => u.role === 'prosumer' && u.isOnline)
    const consumers = users.filter(u => u.role === 'consumer' && u.isOnline)
    const trades = []

    const numTrades = Math.min(12, Math.min(prosumers.length, consumers.length))
    const usedConsumers = new Set()

    for (let i = 0; i < numTrades; i++) {
        let consumerIdx
        do {
            consumerIdx = Math.floor(Math.random() * consumers.length)
        } while (usedConsumers.has(consumerIdx) && usedConsumers.size < consumers.length)
        usedConsumers.add(consumerIdx)

        const prosumer = prosumers[i % prosumers.length]
        const consumer = consumers[consumerIdx]
        const units = +(1 + Math.random() * 5).toFixed(1)

        trades.push({
            id: i + 1,
            prosumer,
            consumer,
            units,
            pricePerUnit: prosumer.pricePerUnit,
            total: +(units * prosumer.pricePerUnit).toFixed(2),
            status: ['delivering', 'pending', 'completing'][Math.floor(Math.random() * 3)],
            minutesLeft: Math.floor(10 + Math.random() * 50),
        })
    }
    return trades
}

// ── Map Page ──
export default function EnergyMap() {
    const { user } = useAuth()
    const [filter, setFilter] = useState('all') // all, prosumer, consumer, trades
    const [selectedTrade, setSelectedTrade] = useState(null)

    const users = useMemo(() => generateUsers(), [])
    const activeTrades = useMemo(() => generateActiveTrades(users), [users])

    const filteredUsers = useMemo(() => {
        if (filter === 'all') return users
        if (filter === 'prosumer') return users.filter(u => u.role === 'prosumer')
        if (filter === 'consumer') return users.filter(u => u.role === 'consumer')
        if (filter === 'trades') {
            const tradeUserIds = new Set()
            activeTrades.forEach(t => { tradeUserIds.add(t.prosumer.id); tradeUserIds.add(t.consumer.id) })
            return users.filter(u => tradeUserIds.has(u.id))
        }
        return users
    }, [filter, users, activeTrades])

    const prosumerCount = users.filter(u => u.role === 'prosumer').length
    const consumerCount = users.filter(u => u.role === 'consumer').length
    const totalEnergy = activeTrades.reduce((sum, t) => sum + t.units, 0).toFixed(1)

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        <MapPin size={28} className="text-green-600" />
                        Energy Trading Map
                    </h1>
                    <p className="page-subtitle">Live view of energy transfers across your neighbourhood</p>
                </div>

                {/* Stats Chips */}
                <div className="flex flex-wrap gap-2">
                    <StatChip icon={Users} value={users.length} label="Users" color="blue" />
                    <StatChip icon={Sun} value={prosumerCount} label="Prosumers" color="amber" />
                    <StatChip icon={Zap} value={consumerCount} label="Consumers" color="blue" />
                    <StatChip icon={ArrowLeftRight} value={activeTrades.length} label="Active Trades" color="green" />
                    <StatChip icon={Battery} value={`${totalEnergy} kWh`} label="Flowing" color="emerald" />
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {[
                    { key: 'all', label: 'All Users', icon: Users },
                    { key: 'prosumer', label: 'Prosumers', icon: Sun },
                    { key: 'consumer', label: 'Consumers', icon: Zap },
                    { key: 'trades', label: 'Active Trades', icon: ArrowLeftRight },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === f.key
                                ? 'bg-green-600 text-white shadow-md shadow-green-500/30'
                                : 'bg-white text-gray-600 hover:bg-gray-50 ring-1 ring-gray-200'
                            }`}
                    >
                        <f.icon size={15} />
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Map + Trade List */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Map */}
                <div className="lg:col-span-3 card overflow-hidden" style={{ height: '600px' }}>
                    <MapContainer
                        center={CENTER}
                        zoom={13}
                        style={{ height: '100%', width: '100%', borderRadius: '16px' }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* User Markers */}
                        {filteredUsers.map(u => (
                            <Marker
                                key={u.id}
                                position={[u.lat, u.lng]}
                                icon={u.role === 'prosumer' ? prosumerIcon : consumerIcon}
                            >
                                <Popup>
                                    <UserPopup user={u} />
                                </Popup>
                            </Marker>
                        ))}

                        {/* Trade Lines */}
                        {(filter === 'all' || filter === 'trades') && activeTrades.map(trade => (
                            <React.Fragment key={`trade-${trade.id}`}>
                                <Polyline
                                    positions={[
                                        [trade.prosumer.lat, trade.prosumer.lng],
                                        [trade.consumer.lat, trade.consumer.lng]
                                    ]}
                                    pathOptions={{
                                        color: trade.status === 'delivering' ? '#10b981' : trade.status === 'pending' ? '#f59e0b' : '#8b5cf6',
                                        weight: 3,
                                        opacity: 0.7,
                                        dashArray: trade.status === 'pending' ? '8 8' : null,
                                    }}
                                />
                                {/* Midpoint energy label */}
                                <Marker
                                    position={[
                                        (trade.prosumer.lat + trade.consumer.lat) / 2,
                                        (trade.prosumer.lng + trade.consumer.lng) / 2
                                    ]}
                                    icon={L.divIcon({
                                        className: 'energy-label',
                                        html: `<div style="
                      background:white;border:2px solid #10b981;border-radius:12px;
                      padding:2px 8px;font-size:10px;font-weight:700;color:#059669;
                      white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.15);
                    ">⚡ ${trade.units} kWh</div>`,
                                        iconSize: [80, 24],
                                        iconAnchor: [40, 12],
                                    })}
                                >
                                    <Popup>
                                        <TradePopup trade={trade} />
                                    </Popup>
                                </Marker>
                            </React.Fragment>
                        ))}

                        {/* Coverage radius */}
                        <Circle
                            center={CENTER}
                            radius={3000}
                            pathOptions={{
                                color: '#16a34a',
                                fillColor: '#16a34a',
                                fillOpacity: 0.04,
                                weight: 1,
                                dashArray: '6 4',
                            }}
                        />
                    </MapContainer>
                </div>

                {/* Active Trades Sidebar */}
                <div className="lg:col-span-1">
                    <div className="card p-5" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <ArrowLeftRight size={16} className="text-green-500" />
                            Live Transfers ({activeTrades.length})
                        </h3>

                        <div className="space-y-3">
                            {activeTrades.map(trade => (
                                <div
                                    key={trade.id}
                                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${selectedTrade === trade.id
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-100 bg-white hover:border-green-200'
                                        }`}
                                    onClick={() => setSelectedTrade(selectedTrade === trade.id ? null : trade.id)}
                                >
                                    {/* Prosumer → Consumer */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs">☀</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate">{trade.prosumer.name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pl-3 mb-2">
                                        <div className="w-px h-4 bg-green-300" />
                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                            ⚡ {trade.units} kWh
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">⚡</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate">{trade.consumer.name}</p>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${trade.status === 'delivering' ? 'bg-green-100 text-green-700'
                                                : trade.status === 'pending' ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {trade.status}
                                        </span>
                                        <span className="text-[10px] text-gray-400">{trade.minutesLeft}m left</span>
                                        <span className="text-xs font-bold text-gray-900">₹{trade.total}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="mt-5 pt-4 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-500 mb-2">Map Legend</p>
                            <div className="space-y-2">
                                <LegendItem color="#f59e0b" label="Prosumer (Solar)" symbol="☀" />
                                <LegendItem color="#3b82f6" label="Consumer (Buyer)" symbol="⚡" />
                                <LegendItem color="#10b981" label="Active delivery" dashed={false} />
                                <LegendItem color="#f59e0b" label="Pending trade" dashed={true} />
                                <LegendItem color="#8b5cf6" label="Completing" dashed={false} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Popup Components ──
function UserPopup({ user }) {
    return (
        <div style={{ minWidth: '180px', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: user.role === 'prosumer' ? '#fef3c7' : '#dbeafe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px'
                }}>
                    {user.role === 'prosumer' ? '☀️' : '⚡'}
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#111' }}>{user.name}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{user.area} • {user.role}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                {user.role === 'prosumer' && (
                    <>
                        <Stat label="Solar" value={`${user.solarCapacity} kW`} />
                        <Stat label="Output" value={`${user.currentOutput} kW`} />
                        <Stat label="Price" value={`₹${user.pricePerUnit}/kWh`} />
                        <Stat label="Available" value={`${user.unitsAvailable} kWh`} />
                    </>
                )}
                <Stat label="Rating" value={`★ ${user.rating}`} />
                <Stat label="Trades" value={user.totalTrades} />
            </div>

            <div style={{
                marginTop: '8px', padding: '4px 8px', borderRadius: '8px',
                background: user.isOnline ? '#ecfdf5' : '#fef2f2',
                fontSize: '10px', fontWeight: 600, textAlign: 'center',
                color: user.isOnline ? '#059669' : '#dc2626',
            }}>
                {user.isOnline ? '🟢 Online' : '🔴 Offline'}
            </div>
        </div>
    )
}

function Stat({ label, value }) {
    return (
        <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '4px 8px' }}>
            <div style={{ color: '#9ca3af', fontSize: '10px' }}>{label}</div>
            <div style={{ fontWeight: 700, color: '#111827', fontSize: '12px' }}>{value}</div>
        </div>
    )
}

function TradePopup({ trade }) {
    return (
        <div style={{ minWidth: '200px', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px', color: '#059669' }}>
                ⚡ Active Energy Transfer
            </div>
            <div style={{ fontSize: '11px', lineHeight: '1.8' }}>
                <div><strong>From:</strong> {trade.prosumer.name}</div>
                <div><strong>To:</strong> {trade.consumer.name}</div>
                <div><strong>Energy:</strong> {trade.units} kWh</div>
                <div><strong>Price:</strong> ₹{trade.pricePerUnit}/kWh</div>
                <div><strong>Total:</strong> ₹{trade.total}</div>
                <div><strong>Status:</strong> <span style={{
                    padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                    background: trade.status === 'delivering' ? '#ecfdf5' : '#fffbeb',
                    color: trade.status === 'delivering' ? '#059669' : '#d97706',
                }}>{trade.status}</span></div>
                <div><strong>Time left:</strong> {trade.minutesLeft} min</div>
            </div>
        </div>
    )
}

// ── Helper Components ──
function StatChip({ icon: Icon, value, label, color }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-700 ring-blue-200',
        amber: 'bg-amber-50 text-amber-700 ring-amber-200',
        green: 'bg-green-50 text-green-700 ring-green-200',
        emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    }
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ring-1 ${colors[color]}`}>
            <Icon size={14} />
            <span>{value}</span>
            <span className="text-gray-400 font-medium">{label}</span>
        </div>
    )
}

function LegendItem({ color, label, symbol, dashed }) {
    return (
        <div className="flex items-center gap-2 text-xs">
            {symbol ? (
                <div style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: color, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '10px', color: 'white',
                    border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}>
                    {symbol}
                </div>
            ) : (
                <div style={{
                    width: '20px', height: '3px',
                    background: color,
                    borderRadius: '2px',
                    ...(dashed ? { backgroundImage: `repeating-linear-gradient(90deg, ${color} 0px, ${color} 4px, transparent 4px, transparent 8px)`, background: 'transparent' } : {}),
                }} />
            )}
            <span className="text-gray-600">{label}</span>
        </div>
    )
}
