import React, { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAuth } from '../hooks/useContext'
import { Zap, Sun, Battery, Users, ArrowLeftRight, MapPin, Activity } from 'lucide-react'

// ── Fix default Leaflet marker icon (broken in bundlers) ──
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ── Custom marker icons (ArkaGrid Dark Theme Colors) ──
function createIcon(color, size = 28, glowColor = null) {
    const shadow = glowColor ? `0 0 15px ${glowColor}` : '0 2px 8px rgba(0,0,0,0.5)'
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
      width:${size}px;height:${size}px;border-radius:12px;
      background:${color};border:2px solid #111827;
      box-shadow:${shadow};
      display:flex;align-items:center;justify-content:center;
      font-size:12px;color:#111827;font-weight:bold;
    ">${color === '#00FF94' ? '⚡' : color === '#3B82F6' ? '🔌' : color === '#F59E0B' ? '☀️' : '★'}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
    })
}

// Prosumer = Amber, Consumer = Blue
const prosumerIcon = createIcon('#F59E0B', 30, '#F59E0B40')
const consumerIcon = createIcon('#3B82F6', 26, '#3B82F640')

// ── Generate 50 simulated users in Jaipur area ──
const CENTER = [26.9124, 75.7873] // Jaipur, Rajasthan
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
        do { consumerIdx = Math.floor(Math.random() * consumers.length) }
        while (usedConsumers.has(consumerIdx) && usedConsumers.size < consumers.length)
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
    const [filter, setFilter] = useState('all')
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
        <div className="page-container animate-fade-in pb-24 md:pb-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                <div>
                    <h1 className="page-title flex items-center gap-3">
                        <MapPin size={28} className="text-volt-green" />
                        Live Grid Operations
                    </h1>
                    <p className="page-subtitle">Real-time localized P2P energy flow network</p>
                </div>

                {/* Stats Chips */}
                <div className="flex flex-wrap gap-2">
                    <StatChip icon={Users} value={users.length} label="Nodes" color="vblue" />
                    <StatChip icon={Sun} value={prosumerCount} label="Generators" color="accent" />
                    <StatChip icon={ArrowLeftRight} value={activeTrades.length} label="Tx" color="green" />
                    <StatChip icon={Activity} value={`${totalEnergy}kW`} label="Load" color="green" glow />
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { key: 'all', label: 'All Nodes', icon: Users },
                    { key: 'prosumer', label: 'Prosumers', icon: Sun },
                    { key: 'consumer', label: 'Consumers', icon: Zap },
                    { key: 'trades', label: 'Live Trades', icon: ArrowLeftRight },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${filter === f.key
                            ? 'bg-volt-green text-volt-dark border-volt-green shadow-glow-green'
                            : 'bg-volt-dark/60 text-gray-400 border-volt-border hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <f.icon size={14} />
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Map + Sidebar */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Map */}
                <div className="xl:col-span-3 card p-0 overflow-hidden relative border-volt-green/20" style={{ height: '650px' }}>

                    {/* Dark map overlay gradient */}
                    <div className="absolute inset-0 z-[400] pointer-events-none rounded-2xl shadow-[inset_0_0_100px_rgba(10,14,26,1)]" />

                    <MapContainer
                        center={CENTER}
                        zoom={13}
                        style={{ height: '100%', width: '100%', borderRadius: '16px', background: '#0A0E1A' }}
                        scrollWheelZoom={true}
                    >
                        {/* CartoDB Dark Matter Tile Layer */}
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            subdomains="abcd"
                            maxZoom={20}
                        />

                        {/* User Markers */}
                        {filteredUsers.map(u => (
                            <Marker
                                key={u.id}
                                position={[u.lat, u.lng]}
                                icon={u.role === 'prosumer' ? prosumerIcon : consumerIcon}
                                zIndexOffset={u.isOnline ? 100 : 0}
                            >
                                <Popup className="arka-popup">
                                    <UserPopup user={u} />
                                </Popup>
                            </Marker>
                        ))}

                        {/* Trade Lines */}
                        {(filter === 'all' || filter === 'trades') && activeTrades.map((trade, i) => (
                            <React.Fragment key={`trade-${trade.id}`}>
                                {/* Base line shadow */}
                                <Polyline
                                    positions={[[trade.prosumer.lat, trade.prosumer.lng], [trade.consumer.lat, trade.consumer.lng]]}
                                    pathOptions={{ color: '#00FF94', weight: 8, opacity: 0.1 }}
                                />
                                {/* Core line */}
                                <Polyline
                                    positions={[[trade.prosumer.lat, trade.prosumer.lng], [trade.consumer.lat, trade.consumer.lng]]}
                                    pathOptions={{
                                        color: trade.status === 'delivering' ? '#00FF94' : trade.status === 'pending' ? '#F59E0B' : '#A855F7',
                                        weight: 2,
                                        opacity: 0.8,
                                        dashArray: trade.status === 'pending' ? '8 8' : '4 12',
                                        className: trade.status === 'delivering' ? 'animate-flow' : ''
                                    }}
                                />
                                {/* Midpoint energy label */}
                                <Marker
                                    position={[(trade.prosumer.lat + trade.consumer.lat) / 2, (trade.prosumer.lng + trade.consumer.lng) / 2]}
                                    icon={L.divIcon({
                                        className: 'energy-label',
                                        html: `<div style="
                      background:rgba(10,14,26,0.9);border:1px solid ${trade.status === 'delivering' ? '#00FF94' : '#F59E0B'};
                      border-radius:6px;padding:2px 6px;font-size:10px;font-family:monospace;font-weight:700;
                      color:${trade.status === 'delivering' ? '#00FF94' : '#F59E0B'};white-space:nowrap;
                      box-shadow:0 0 10px ${trade.status === 'delivering' ? 'rgba(0,255,148,0.2)' : 'transparent'};
                      backdrop-filter:blur(4px);
                    ">${trade.units}kW</div>`,
                                        iconSize: [60, 24],
                                        iconAnchor: [30, 12],
                                    })}
                                >
                                    <Popup className="arka-popup">
                                        <TradePopup trade={trade} />
                                    </Popup>
                                </Marker>
                            </React.Fragment>
                        ))}

                        {/* Coverage radius */}
                        <Circle
                            center={CENTER}
                            radius={4000}
                            pathOptions={{
                                color: '#00FF94',
                                fillColor: '#00FF94',
                                fillOpacity: 0.02,
                                weight: 1,
                                dashArray: '4 8',
                            }}
                        />
                    </MapContainer>
                </div>

                {/* Sidebar */}
                <div className="xl:col-span-1">
                    <div className="card h-full flex flex-col" style={{ maxHeight: '650px' }}>
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 font-heading">
                            <Activity size={16} className="text-volt-green" />
                            Live Network ({activeTrades.length})
                        </h3>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {activeTrades.map(trade => (
                                <div
                                    key={trade.id}
                                    className={`p-3 rounded-xl border transition-all cursor-pointer ${selectedTrade === trade.id
                                        ? 'border-volt-green bg-volt-green/5 shadow-glow-green'
                                        : 'border-volt-border bg-volt-dark/40 hover:border-gray-600'
                                        }`}
                                    onClick={() => setSelectedTrade(selectedTrade === trade.id ? null : trade.id)}
                                >
                                    {/* Prosumer */}
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="w-5 h-5 rounded-md bg-accent-500/20 border border-accent-500/30 flex items-center justify-center text-[10px] text-accent-400">☀️</div>
                                        <p className="text-xs font-bold text-gray-300 truncate">{trade.prosumer.name}</p>
                                    </div>

                                    <div className="flex flex-col ml-[9px] border-l-2 border-dashed border-gray-700 pl-3 py-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] bg-volt-green/10 text-volt-green border border-volt-green/20 px-1.5 py-0.5 rounded-md font-mono font-bold">
                                                {trade.units} kW
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-mono">₹{trade.total}</span>
                                        </div>
                                    </div>

                                    {/* Consumer */}
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="w-5 h-5 rounded-md bg-vblue-400/20 border border-vblue-400/30 flex items-center justify-center text-[10px] text-vblue-400">⚡</div>
                                        <p className="text-xs font-bold text-gray-300 truncate">{trade.consumer.name}</p>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-volt-border">
                                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${trade.status === 'delivering' ? 'bg-volt-green/10 text-volt-green'
                                            : trade.status === 'pending' ? 'bg-accent-500/10 text-accent-400'
                                                : 'bg-purple-500/10 text-purple-400'
                                            }`}>
                                            {trade.status}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-mono">{trade.minutesLeft}m left</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="mt-4 pt-4 border-t border-volt-border">
                            <div className="space-y-2">
                                <LegendItem color="#F59E0B" label="Generator Node" symbol="☀️" />
                                <LegendItem color="#3B82F6" label="Consumer Node" symbol="⚡" />
                                <LegendItem color="#00FF94" label="Active Flow" dashed={false} />
                                <LegendItem color="#F59E0B" label="Pending Route" dashed={true} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Inject global popup styles directly */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .arka-popup .leaflet-popup-content-wrapper {
                    background: #0A0E1A;
                    color: white;
                    border: 1px solid #1F2937;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 255, 148, 0.1);
                }
                .arka-popup .leaflet-popup-tip {
                    background: #0A0E1A;
                    border: 1px solid #1F2937;
                }
                .arka-popup a.leaflet-popup-close-button {
                    color: #9CA3AF;
                }
                @keyframes flow {
                    0% { stroke-dashoffset: 24; }
                    100% { stroke-dashoffset: 0; }
                }
                .animate-flow {
                    animation: flow 1s linear infinite;
                }
            `}} />
        </div>
    )
}

// ── Popup Components ──
function UserPopup({ user }) {
    return (
        <div style={{ minWidth: '180px', fontFamily: '"Inter", sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: user.role === 'prosumer' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    border: `1px solid ${user.role === 'prosumer' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', color: user.role === 'prosumer' ? '#F59E0B' : '#3B82F6'
                }}>
                    {user.role === 'prosumer' ? '☀️' : '⚡'}
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>{user.name}</div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{user.role}</div>
                    <div style={{ fontSize: '10px', color: '#00FF94', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        {user.area}, Jaipur
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', marginBottom: '12px' }}>
                {user.role === 'prosumer' ? (
                    <>
                        <Stat label="Output" value={`${user.currentOutput} kW`} color="#00FF94" />
                        <Stat label="Rate" value={`₹${user.pricePerUnit}`} />
                    </>
                ) : (
                    <>
                        <Stat label="Rating" value={`★ ${user.rating}`} color="#F59E0B" />
                        <Stat label="Trades" value={user.totalTrades} />
                    </>
                )}
            </div>

            <div style={{
                padding: '4px', borderRadius: '6px',
                background: user.isOnline ? 'rgba(0, 255, 148, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                border: `1px solid ${user.isOnline ? 'rgba(0, 255, 148, 0.2)' : 'rgba(255, 68, 68, 0.2)'}`,
                fontSize: '10px', fontWeight: 600, textAlign: 'center',
                color: user.isOnline ? '#00FF94' : '#FF4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
            }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: user.isOnline ? '#00FF94' : '#FF4444' }} />
                {user.isOnline ? 'NODE ACTIVATED' : 'OFFLINE'}
            </div>
        </div>
    )
}

function Stat({ label, value, color = '#E5E7EB' }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#6B7280', fontSize: '9px', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
            <div style={{ fontWeight: 700, color: color, fontSize: '12px', fontFamily: 'monospace' }}>{value}</div>
        </div>
    )
}

function TradePopup({ trade }) {
    return (
        <div style={{ minWidth: '180px', fontFamily: '"Inter", sans-serif' }}>
            <div style={{ fontWeight: 700, fontSize: '11px', marginBottom: '10px', color: '#00FF94', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00FF94', display: 'inline-block' }} />
                ACTIVE ESCROW
            </div>
            <div style={{ fontSize: '11px', color: '#D1D5DB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: '#6B7280' }}>Route:</span> <span>{trade.prosumer.name.split(' ')[0]} → {trade.consumer.name.split(' ')[0]}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: '#6B7280' }}>Load:</span> <span style={{ fontFamily: 'monospace', color: '#00FF94' }}>{trade.units} kW</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ color: '#6B7280' }}>Value:</span> <span style={{ fontFamily: 'monospace' }}>₹{trade.total}</span></div>
            </div>
        </div>
    )
}

// ── Helper Components ──
function StatChip({ icon: Icon, value, label, color, glow }) {
    const colors = {
        vblue: 'text-vblue-400 border-vblue-400/20 bg-vblue-400/10',
        accent: 'text-accent-400 border-accent-500/20 bg-accent-500/10',
        green: 'text-volt-green border-volt-green/20 bg-volt-green/10',
    }
    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${colors[color]} ${glow ? 'shadow-[0_0_10px_rgba(0,255,148,0.2)]' : ''}`}>
            <Icon size={12} />
            <span className="font-mono">{value}</span>
            <span className="text-gray-400 font-sans font-medium uppercase text-[10px] tracking-wider ml-0.5">{label}</span>
        </div>
    )
}

function LegendItem({ color, label, symbol, dashed }) {
    return (
        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            {symbol ? (
                <div className="flex items-center justify-center rounded border" style={{
                    width: '16px', height: '16px', background: `${color}20`,
                    borderColor: `${color}40`, color: color, fontSize: '10px'
                }}>
                    {symbol}
                </div>
            ) : (
                <div style={{
                    width: '16px', height: '2px', background: dashed ? 'transparent' : color,
                    ...(dashed ? { backgroundImage: `repeating-linear-gradient(90deg, ${color} 0px, ${color} 4px, transparent 4px, transparent 8px)` } : {}),
                }} />
            )}
            <span>{label}</span>
        </div>
    )
}
