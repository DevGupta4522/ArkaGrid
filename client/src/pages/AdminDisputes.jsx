import React, { useState, useEffect } from 'react'
import { adminAPI } from '../api/admin'
import { useToast } from '../hooks/useContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { EmptyState } from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import { Shield, CheckCircle, XCircle, DivideCircle, X } from 'lucide-react'

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
    <div className="page-container animate-fade-in">
      <h1 className="page-title">⚖️ Dispute Resolution</h1>
      <p className="page-subtitle">{trades.length} disputed trade{trades.length !== 1 ? 's' : ''} pending review</p>

      {trades.length === 0 ? (
        <EmptyState
          title="No disputes"
          message="All trades are running smoothly 🎉"
          icon={<Shield className="text-gray-400" size={36} />}
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
    <div className="card ring-2 ring-orange-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400 font-mono mb-1">Trade #{trade.id?.slice(0, 8)}</p>
          <div className="flex items-center gap-3">
            <StatusBadge status="disputed" />
            <StatusBadge status={trade.escrow_status} label="Escrow" />
          </div>
        </div>
        <button onClick={() => onResolve(trade)} className="btn-accent">
          <span className="flex items-center gap-2"><Shield size={16} /> Resolve</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500">Prosumer</p>
          <p className="font-bold text-gray-900">{trade.prosumer_name}</p>
          <p className="text-xs text-gray-400">{trade.prosumer_email}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500">Consumer</p>
          <p className="font-bold text-gray-900">{trade.consumer_name}</p>
          <p className="text-xs text-gray-400">{trade.consumer_email}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500">Units</p>
          <p className="font-bold text-gray-900">{parseFloat(trade.units_requested).toFixed(1)} kWh</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500">Amount (Locked)</p>
          <p className="font-bold text-gray-900">₹{parseFloat(trade.total_amount).toFixed(2)}</p>
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
    if (!resolution) { toast.error('Select a resolution'); return }
    if (resolution === 'partial' && (!unitsDelivered || parseFloat(unitsDelivered) <= 0)) {
      toast.error('Enter units delivered for partial resolution')
      return
    }

    setLoading(true)
    try {
      await adminAPI.resolveDispute(trade.id, resolution, resolution === 'partial' ? parseFloat(unitsDelivered) : undefined)
      toast.success('Dispute resolved successfully')
      onResolved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve dispute')
    } finally {
      setLoading(false)
    }
  }

  const options = [
    { value: 'release', label: 'Release to Seller', desc: 'Full payment released to prosumer', icon: CheckCircle, color: 'green' },
    { value: 'refund', label: 'Refund to Buyer', desc: 'Full refund to consumer', icon: XCircle, color: 'red' },
    { value: 'partial', label: 'Partial Settlement', desc: 'Pay for delivered units only', icon: DivideCircle, color: 'blue' },
  ]

  const colorMap = {
    green: { bg: 'bg-green-50', border: 'border-green-500', ring: 'ring-green-200', text: 'text-green-700' },
    red: { bg: 'bg-red-50', border: 'border-red-500', ring: 'ring-red-200', text: 'text-red-700' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-500', ring: 'ring-blue-200', text: 'text-blue-700' },
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Resolve Dispute</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm text-gray-500">
            Trade #{trade.id?.slice(0, 8)} · {parseFloat(trade.units_requested).toFixed(1)} kWh · ₹{parseFloat(trade.total_amount).toFixed(2)}
          </p>

          {/* Resolution Options */}
          <div className="space-y-2">
            {options.map((opt) => {
              const c = colorMap[opt.color]
              return (
                <button key={opt.value}
                  onClick={() => setResolution(opt.value)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${resolution === opt.value
                      ? `${c.border} ${c.bg} ring-2 ${c.ring}`
                      : 'border-gray-200 hover:border-gray-300'
                    }`}>
                  <opt.icon size={20} className={resolution === opt.value ? c.text : 'text-gray-400'} />
                  <div>
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Partial amount input */}
          {resolution === 'partial' && (
            <div className="animate-fade-in">
              <label className="form-label">Units actually delivered (kWh)</label>
              <input type="number" value={unitsDelivered} onChange={(e) => setUnitsDelivered(e.target.value)}
                min="0.1" max={trade.units_requested} step="0.1" className="form-input" placeholder="e.g. 2.1" />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary" disabled={loading}>Cancel</button>
          <button onClick={handleResolve} disabled={loading || !resolution}
            className="flex-1 btn-primary disabled:opacity-50">
            {loading ? 'Resolving...' : 'Confirm Resolution'}
          </button>
        </div>
      </div>
    </div>
  )
}
