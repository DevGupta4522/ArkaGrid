import React, { useState, useEffect } from 'react'
import { adminAPI } from '../api/admin'
import { useToast } from '../hooks/useContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { EmptyState } from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import { Shield, CheckCircle, XCircle, DivideCircle, X, AlertTriangle, User, Zap, DollarSign } from 'lucide-react'

export default function AdminDisputes() {
  const toast = useToast()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [resolvingTrade, setResolvingTrade] = useState(null)

  useEffect(() => { fetchDisputes() }, [])

  const fetchDisputes = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getDisputedTrades()
      setTrades(response.data || [])
    } catch (err) {
      toast.error('Failed to fetch disputed trades')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner message="Loading disputes..." />

  return (
    <div className="page-container animate-fade-in pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Shield size={28} className="text-danger-400" />
            Dispute Resolution
          </h1>
          <p className="page-subtitle text-gray-400">
            {trades.length} disputed trade{trades.length !== 1 ? 's' : ''} pending review in escrow
          </p>
        </div>
        {trades.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-danger-400/10 border border-danger-400/20 rounded-xl">
            <AlertTriangle size={16} className="text-danger-400 animate-pulse" />
            <span className="text-sm font-bold text-danger-400">Action Required</span>
          </div>
        )}
      </div>

      {trades.length === 0 ? (
        <EmptyState
          title="No Active Disputes"
          message="All peer-to-peer trades are operating within nominal parameters. Smart contracts are executing normally."
          icon={<CheckCircle className="text-volt-green/50" size={48} />}
        />
      ) : (
        <div className="space-y-4">
          {trades.map((trade) => (
            <DisputeCard key={trade.id} trade={trade} onResolve={setResolvingTrade} />
          ))}
        </div>
      )}

      {resolvingTrade && (
        <ResolveModal
          trade={resolvingTrade}
          onClose={() => setResolvingTrade(null)}
          onResolved={() => { setResolvingTrade(null); fetchDisputes() }}
        />
      )}
    </div>
  )
}

function DisputeCard({ trade, onResolve }) {
  return (
    <div className="card border-danger-400/30 bg-gradient-to-r from-danger-400/[0.02] to-transparent relative overflow-hidden group hover:border-danger-400/50 transition-colors">
      {/* Decorative pulse glow */}
      <div className="absolute top-0 left-0 w-1 h-full bg-danger-400 shadow-[0_0_10px_rgba(255,68,68,0.5)] group-hover:shadow-[0_0_15px_rgba(255,68,68,0.8)] transition-all" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <p className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <span className="text-gray-500">TX_ID:</span>
              <span className="bg-volt-dark px-2 py-0.5 rounded border border-volt-border">{trade.id?.slice(0, 8)}</span>
            </p>
            <StatusBadge status="disputed" />
            <StatusBadge status={trade.escrow_status} label="Escrow" />
          </div>
          <p className="text-xs text-gray-500">Protocol flagged anomaly in delivery confirmation or timeline breach.</p>
        </div>
        <button onClick={() => onResolve(trade)} className="btn-primary bg-danger-400 text-volt-dark hover:bg-danger-300 shadow-[0_0_15px_rgba(255,68,68,0.2)]">
          <span className="flex items-center gap-2 font-bold"><Shield size={16} /> Intervene</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm relative z-10">
        <div className="bg-volt-dark/60 border border-volt-border rounded-xl p-4 flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400">☀️</div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Prosumer Node</p>
            <p className="font-bold text-white mt-0.5">{trade.prosumer_name}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{trade.prosumer_email}</p>
          </div>
        </div>

        <div className="bg-volt-dark/60 border border-volt-border rounded-xl p-4 flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-vblue-400/10 border border-vblue-400/20 flex items-center justify-center text-vblue-400">⚡</div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Consumer Node</p>
            <p className="font-bold text-white mt-0.5">{trade.consumer_name}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{trade.consumer_email}</p>
          </div>
        </div>

        <div className="bg-volt-dark/60 border border-volt-border rounded-xl p-4 flex flex-col justify-center">
          <p className="text-[10px] flex items-center gap-1.5 uppercase font-bold text-gray-500 tracking-wider"><Zap size={10} className="text-volt-green" /> Requested Load</p>
          <p className="text-2xl font-bold font-mono text-volt-green mt-1">
            {parseFloat(trade.units_requested).toFixed(1)} <span className="text-sm text-volt-green/50">kWh</span>
          </p>
        </div>

        <div className="bg-volt-dark/60 border border-volt-border rounded-xl p-4 flex flex-col justify-center">
          <p className="text-[10px] flex items-center gap-1.5 uppercase font-bold text-gray-500 tracking-wider"><DollarSign size={10} className="text-danger-400" /> Locked Funds</p>
          <p className="text-2xl font-bold font-mono text-danger-400 mt-1">
            ₹{parseFloat(trade.total_amount).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}

function ResolveModal({ trade, onClose, onResolved }) {
  const toast = useToast()
  const [resolution, setResolution] = useState('')
  const [unitsDelivered, setUnitsDelivered] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResolve = async () => {
    if (!resolution) { toast.error('Select an arbitration protocol'); return }
    if (resolution === 'partial' && (!unitsDelivered || parseFloat(unitsDelivered) <= 0)) {
      toast.error('Enter verified delivered units for partial settlement')
      return
    }

    setLoading(true)
    try {
      await adminAPI.resolveDispute(trade.id, resolution, resolution === 'partial' ? parseFloat(unitsDelivered) : undefined)
      toast.success('Escrow contract overridden and funds routed successfully ⚡')
      onResolved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Smart contract override failed')
    } finally {
      setLoading(false)
    }
  }

  const options = [
    { value: 'release', label: 'Force Payment to Seller', desc: 'Route full escrow amount to Prosumer wallet', icon: CheckCircle, color: 'green' },
    { value: 'refund', label: 'Force Refund to Buyer', desc: 'Route full escrow amount back to Consumer wallet', icon: XCircle, color: 'red' },
    { value: 'partial', label: 'Partial Protocol Split', desc: 'Settle only for verified delivered units', icon: DivideCircle, color: 'blue' },
  ]

  const colorMap = {
    green: { bg: 'bg-volt-green/5', border: 'border-volt-green/50', ring: 'shadow-[0_0_15px_rgba(0,255,148,0.2)]', text: 'text-volt-green' },
    red: { bg: 'bg-danger-400/5', border: 'border-danger-400/50', ring: 'shadow-[0_0_15px_rgba(255,68,68,0.2)]', text: 'text-danger-400' },
    blue: { bg: 'bg-vblue-400/5', border: 'border-vblue-400/50', ring: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]', text: 'text-vblue-400' },
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-lg border-danger-400/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <Shield className="text-danger-400" /> Arbitration Protocol
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-3 bg-volt-dark border border-volt-border rounded-xl flex justify-between items-center">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Target Contract</p>
              <p className="font-mono text-xs text-danger-400">{trade.id}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Locked Value</p>
              <p className="font-mono text-sm font-bold text-white">₹{parseFloat(trade.total_amount).toFixed(2)}</p>
            </div>
          </div>

          <label className="form-label">Select Override Action</label>
          <div className="space-y-3">
            {options.map((opt) => {
              const c = colorMap[opt.color]
              const isSelected = resolution === opt.value
              return (
                <button key={opt.value}
                  onClick={() => setResolution(opt.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${isSelected
                    ? `${c.border} ${c.bg} ${c.ring}`
                    : 'border-volt-border bg-volt-dark hover:border-gray-600'
                    }`}>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${isSelected ? `border-${opt.color}-500/50` : 'border-volt-border bg-volt-surface'}`}>
                    <opt.icon size={20} className={isSelected ? c.text : 'text-gray-500'} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {resolution === 'partial' && (
            <div className="animate-fade-in p-4 bg-volt-dark rounded-xl border border-vblue-400/30">
              <label className="form-label text-vblue-400">Verified Units Delivered (kWh)</label>
              <div className="relative">
                <Zap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vblue-400" />
                <input type="number" value={unitsDelivered} onChange={(e) => setUnitsDelivered(e.target.value)}
                  min="0.1" max={trade.units_requested} step="0.1"
                  className="form-input pl-10 font-mono text-lg" placeholder="0.0" />
              </div>
              <p className="text-[10px] text-gray-500 mt-2 font-mono">Max allowable: {trade.units_requested} kWh</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary" disabled={loading}>Abort</button>
          <button onClick={handleResolve} disabled={loading || !resolution}
            className="flex-1 btn-primary bg-danger-400 text-volt-dark hover:bg-danger-300 disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-400">
            {loading ? 'Executing Override...' : 'Execute Protocol'}
          </button>
        </div>
      </div>
    </div>
  )
}
