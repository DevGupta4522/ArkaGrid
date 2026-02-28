import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { tradesAPI } from '../api/trades'
import { useToast, useAuth } from '../hooks/useContext'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import CountdownTimer from '../components/CountdownTimer'
import { ArrowLeft, Zap, Clock, DollarSign, Users, CheckCircle } from 'lucide-react'

export default function TradeDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const [trade, setTrade] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTrade() }, [id])

  const fetchTrade = async () => {
    try {
      setLoading(true)
      const response = await tradesAPI.getTradeById(id)
      setTrade(response.data)
    } catch (err) { toast.error('Failed to load trade details') }
    finally { setLoading(false) }
  }

  if (loading) return <LoadingSpinner message="Loading trade..." />
  if (!trade) return <div className="page-container text-center text-gray-500">Trade not found</div>

  const isActive = ['delivering', 'completing'].includes(trade.trade_status)

  return (
    <div className="page-container animate-fade-in pb-24 md:pb-8">
      <Link to="/my-trades" className="inline-flex items-center gap-1.5 text-volt-green font-medium text-sm mb-6 hover:text-volt-green/80 transition-colors">
        <ArrowLeft size={16} /> Back to My Trades
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Trade Details</h1>
          <p className="text-gray-600 text-sm font-mono">#{trade.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={trade.trade_status} />
          <StatusBadge status={trade.escrow_status} label="Escrow" />
        </div>
      </div>

      {/* Countdown */}
      {isActive && (
        <div className="card mb-6 bg-accent-500/5 border border-accent-500/20">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-accent-400" />
            <div>
              <p className="text-sm font-semibold text-accent-400">Delivery Deadline</p>
              <CountdownTimer deadline={trade.delivery_deadline} />
            </div>
          </div>
        </div>
      )}

      {/* Trade Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2 font-heading">
            <Zap size={18} className="text-volt-green" /> Energy Details
          </h3>
          <div className="space-y-3 text-sm">
            <DetailRow label="Units Requested" value={`${parseFloat(trade.units_requested).toFixed(2)} kWh`} />
            <DetailRow label="Units Delivered" value={`${parseFloat(trade.units_delivered || 0).toFixed(2)} kWh`} />
            <DetailRow label="Price per Unit" value={`₹${parseFloat(trade.price_per_unit).toFixed(2)}`} />
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2 font-heading">
            <DollarSign size={18} className="text-vblue-400" /> Payment Details
          </h3>
          <div className="space-y-3 text-sm">
            <DetailRow label="Total Amount" value={`₹${parseFloat(trade.total_amount).toFixed(2)}`} />
            <DetailRow label="Platform Fee (2.5%)" value={`₹${parseFloat(trade.platform_fee || 0).toFixed(2)}`} />
            <DetailRow label="Seller Receives" value={`₹${(parseFloat(trade.total_amount) - parseFloat(trade.platform_fee || 0)).toFixed(2)}`} highlight />
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="card mb-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2 font-heading">
          <Users size={18} className="text-purple-400" /> Parties
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-volt-dark/60 rounded-xl p-4 border border-volt-border">
            <p className="text-xs text-gray-500 mb-1">Prosumer (Seller)</p>
            <p className="font-semibold text-white">{trade.prosumer_name}</p>
          </div>
          <div className="bg-volt-dark/60 rounded-xl p-4 border border-volt-border">
            <p className="text-xs text-gray-500 mb-1">Consumer (Buyer)</p>
            <p className="font-semibold text-white">{trade.consumer_name}</p>
          </div>
        </div>
      </div>

      {/* Meter Readings */}
      {trade.meter_readings?.length > 0 && (
        <div className="card mb-6">
          <h3 className="font-bold text-white mb-4 font-heading">Meter Readings</h3>
          <div className="space-y-3">
            {trade.meter_readings.map((reading) => (
              <div key={reading.id} className="flex items-center justify-between bg-volt-dark/60 rounded-xl p-3 text-sm border border-volt-border">
                <div className="flex items-center gap-3">
                  <StatusBadge status={reading.reading_type === 'outgoing' ? 'delivering' : 'completed'} />
                  <span className="font-medium font-mono text-white">{parseFloat(reading.kwh_value).toFixed(3)} kWh</span>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>{reading.source}</p>
                  <p>{new Date(reading.recorded_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="card">
        <h3 className="font-bold text-white mb-4 font-heading">Timeline</h3>
        <div className="space-y-4 text-sm relative">
          <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-volt-border" />
          <TimelineRow label="Trade Created" time={trade.created_at} />
          <TimelineRow label="Escrow Locked" time={trade.escrow_locked_at} />
          {trade.delivery_confirmed_at && <TimelineRow label="Delivery Confirmed" time={trade.delivery_confirmed_at} />}
          {trade.payment_released_at && <TimelineRow label="Payment Released" time={trade.payment_released_at} />}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold font-mono ${highlight ? 'text-volt-green text-lg' : 'text-white'}`}>{value}</span>
    </div>
  )
}

function TimelineRow({ label, time }) {
  if (!time) return null
  return (
    <div className="flex items-center gap-3 relative pl-1">
      <div className="w-3.5 h-3.5 rounded-full bg-volt-green flex items-center justify-center z-10 flex-shrink-0">
        <CheckCircle size={10} className="text-volt-dark" />
      </div>
      <span className="text-gray-300 font-medium">{label}</span>
      <span className="text-gray-600 text-xs ml-auto">{new Date(time).toLocaleString()}</span>
    </div>
  )
}
