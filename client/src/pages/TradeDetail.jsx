import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { tradesAPI } from '../api/trades'
import { useToast, useAuth } from '../hooks/useContext'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import CountdownTimer from '../components/CountdownTimer'
import { ArrowLeft, Zap, Clock, DollarSign, Users } from 'lucide-react'

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
    } catch (err) {
      toast.error('Failed to load trade details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner message="Loading trade..." />
  if (!trade) return <div className="page-container text-center text-gray-500">Trade not found</div>

  const isActive = ['delivering', 'completing'].includes(trade.trade_status)

  return (
    <div className="page-container animate-fade-in">
      <Link to="/my-trades" className="inline-flex items-center gap-1.5 text-green-600 font-medium text-sm mb-6 hover:text-green-700">
        <ArrowLeft size={16} /> Back to My Trades
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Trade Details</h1>
          <p className="text-gray-400 text-sm font-mono">#{trade.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={trade.trade_status} />
          <StatusBadge status={trade.escrow_status} label="Escrow" />
        </div>
      </div>

      {/* Countdown */}
      {isActive && (
        <div className="card mb-6 bg-amber-50 ring-1 ring-amber-200">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Delivery Deadline</p>
              <CountdownTimer deadline={trade.delivery_deadline} />
            </div>
          </div>
        </div>
      )}

      {/* Trade Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Zap size={18} className="text-green-600" /> Energy Details
          </h3>
          <div className="space-y-3 text-sm">
            <DetailRow label="Units Requested" value={`${parseFloat(trade.units_requested).toFixed(2)} kWh`} />
            <DetailRow label="Units Delivered" value={`${parseFloat(trade.units_delivered || 0).toFixed(2)} kWh`} />
            <DetailRow label="Price per Unit" value={`₹${parseFloat(trade.price_per_unit).toFixed(2)}`} />
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign size={18} className="text-blue-600" /> Payment Details
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
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={18} className="text-purple-600" /> Parties
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Prosumer (Seller)</p>
            <p className="font-semibold text-gray-900">{trade.prosumer_name}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Consumer (Buyer)</p>
            <p className="font-semibold text-gray-900">{trade.consumer_name}</p>
          </div>
        </div>
      </div>

      {/* Meter Readings */}
      {trade.meter_readings?.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">Meter Readings</h3>
          <div className="space-y-3">
            {trade.meter_readings.map((reading) => (
              <div key={reading.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3 text-sm">
                <div className="flex items-center gap-3">
                  <StatusBadge status={reading.reading_type === 'outgoing' ? 'delivering' : 'completed'} />
                  <span className="font-medium">{parseFloat(reading.kwh_value).toFixed(3)} kWh</span>
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
      <div className="card mt-6">
        <h3 className="font-bold text-gray-800 mb-4">Timeline</h3>
        <div className="space-y-3 text-sm">
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
      <span className={`font-semibold ${highlight ? 'text-green-600 text-lg' : 'text-gray-900'}`}>{value}</span>
    </div>
  )
}

function TimelineRow({ label, time }) {
  if (!time) return null
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
      <span className="text-gray-700 font-medium">{label}</span>
      <span className="text-gray-400 text-xs ml-auto">{new Date(time).toLocaleString()}</span>
    </div>
  )
}
