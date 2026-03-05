import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { tradesAPI } from '../api/trades'
import { useToast, useAuth } from '../hooks/useContext'
import { useMeterData } from '../hooks/useMeterData'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import CountdownTimer from '../components/CountdownTimer'
import { ArrowLeft, Zap, Clock, DollarSign, Users, CheckCircle, ExternalLink, Link2, Shield, Copy, Leaf, Activity, Wifi, WifiOff } from 'lucide-react'

const PROGRAM_ID = import.meta.env.VITE_SOLANA_PROGRAM_ID || '5fwjpuJMz8hfbtfVVMGfdq7Lu2WcDNoSpMf1HvkNU3Ga'
const EXPLORER_BASE = import.meta.env.VITE_SOLANA_EXPLORER || 'https://explorer.solana.com'
const CLUSTER = 'devnet'

function shortenHash(hash, chars = 8) {
  if (!hash || hash.length < chars * 2) return hash || '—'
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`
}

export default function TradeDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const [trade, setTrade] = useState(null)
  const [loading, setLoading] = useState(true)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const meterData = useMeterData(user?.id, id)

  useEffect(() => { fetchTrade() }, [id])

  // Update "seconds ago" counter
  useEffect(() => {
    if (!meterData.lastUpdated) return
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - meterData.lastUpdated.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [meterData.lastUpdated])

  const fetchTrade = async () => {
    try {
      setLoading(true)
      const response = await tradesAPI.getTradeById(id)
      setTrade(response.data)
    } catch (err) { toast.error('Failed to load trade details') }
    finally { setLoading(false) }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
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

      {/* ⛓️ On-Chain Record — Solana Blockchain */}
      {trade.blockchain_tx_hash && trade.blockchain_status !== 'simulated' ? (
        <div className="card mb-6 bg-gradient-to-br from-volt-green/5 to-transparent border border-volt-green/20">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2 font-heading">
            <Link2 size={18} className="text-volt-green" /> ⛓️ Verified on Solana
          </h3>
          <div className="space-y-3 text-sm">
            {/* Escrow TX */}
            <div className="flex items-center justify-between bg-volt-dark/60 rounded-xl p-3 border border-volt-border">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Escrow Transaction</p>
                <p className="font-mono text-volt-green text-xs">{shortenHash(trade.blockchain_tx_hash)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => copyToClipboard(trade.blockchain_tx_hash)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                  <Copy size={14} className="text-gray-500" />
                </button>
                <a href={`${EXPLORER_BASE}/tx/${trade.blockchain_tx_hash}?cluster=${CLUSTER}`} target="_blank" rel="noopener noreferrer"
                   className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                  <ExternalLink size={14} className="text-volt-green" />
                </a>
              </div>
            </div>

            {/* Settlement TX */}
            {trade.delivery_tx_hash && (
              <div className="flex items-center justify-between bg-volt-dark/60 rounded-xl p-3 border border-volt-border">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Settlement Transaction</p>
                  <p className="font-mono text-vblue-400 text-xs">{shortenHash(trade.delivery_tx_hash)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyToClipboard(trade.delivery_tx_hash)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                    <Copy size={14} className="text-gray-500" />
                  </button>
                  <a href={`${EXPLORER_BASE}/tx/${trade.delivery_tx_hash}?cluster=${CLUSTER}`} target="_blank" rel="noopener noreferrer"
                     className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                    <ExternalLink size={14} className="text-vblue-400" />
                  </a>
                </div>
              </div>
            )}

            {/* Program ID */}
            <div className="flex items-center justify-between bg-volt-dark/60 rounded-xl p-3 border border-volt-border">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">ArkaGrid Program</p>
                <p className="font-mono text-gray-400 text-xs">{shortenHash(PROGRAM_ID)}</p>
              </div>
              <a href={`${EXPLORER_BASE}/address/${PROGRAM_ID}?cluster=${CLUSTER}`} target="_blank" rel="noopener noreferrer"
                 className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                <ExternalLink size={14} className="text-gray-500" />
              </a>
            </div>

            {/* Badge */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-volt-green" />
                <span className="text-xs text-volt-green font-semibold">✅ Tamper-proof — Solana blockchain</span>
              </div>
              <span className="text-[10px] text-gray-600">Confirmed in &lt; 1 second at &lt; $0.001</span>
            </div>
          </div>
        </div>
      ) : trade.blockchain_status === 'simulated' || !trade.blockchain_tx_hash ? (
        <div className="card mb-6 bg-accent-500/5 border border-accent-500/20">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2 font-heading">
            <Shield size={18} className="text-accent-400" /> 📋 Secured in ArkaGrid Database
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            This trade is secured by ArkaGrid's database escrow. Connect a Phantom wallet to enable blockchain verification for future trades.
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-500/10 text-accent-400 text-xs font-semibold border border-accent-500/20">
              {trade.blockchain_status === 'simulated' ? '🔒 DB Escrow Active' : '⏳ Blockchain Pending'}
            </span>
          </div>
        </div>
      ) : null}

      {/* Carbon Credit (for prosumer on settled trades) */}
      {trade.blockchain_status === 'settled' && trade.prosumer_id === user?.id && (
        <div className="card mb-6 bg-gradient-to-br from-green-900/20 to-transparent border border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <Leaf size={20} className="text-green-400" />
            </div>
            <div>
              <p className="font-bold text-green-400 text-sm">🌱 Carbon Credit Issued</p>
              <p className="text-xs text-gray-400">
                ArkaGrid verified {parseFloat(trade.units_delivered || trade.units_requested).toFixed(2)} kWh of clean solar energy.
                Carbon credit recorded on Solana.
              </p>
            </div>
          </div>
          {trade.delivery_tx_hash && (
            <a href={`${EXPLORER_BASE}/tx/${trade.delivery_tx_hash}?cluster=${CLUSTER}`} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 mt-3 text-xs text-green-400 hover:text-green-300 font-mono">
              View on Solana <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}

      {/* 📡 Live Meter Feed */}
      {isActive && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2 font-heading">
              <Activity size={18} className="text-volt-green" /> Live Meter Feed
            </h3>
            <div className="flex items-center gap-2">
              {meterData.isConnected ? (
                <>
                  <Wifi size={14} className="text-volt-green" />
                  <span className="text-xs text-volt-green font-semibold">LIVE</span>
                  <span className="live-dot" />
                </>
              ) : (
                <>
                  <WifiOff size={14} className="text-gray-500" />
                  <span className="text-xs text-gray-500">Offline</span>
                </>
              )}
            </div>
          </div>

          {meterData.tradeStatus ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-volt-dark/60 rounded-xl p-3 border border-volt-border text-center">
                  <p className="text-[10px] text-gray-500 mb-1">Outgoing</p>
                  <p className="text-lg font-bold font-mono text-accent-400">{meterData.tradeStatus.kwhOut?.toFixed(3) || '—'}</p>
                  <p className="text-[10px] text-gray-600">kWh</p>
                </div>
                <div className="bg-volt-dark/60 rounded-xl p-3 border border-volt-border text-center">
                  <p className="text-[10px] text-gray-500 mb-1">Incoming</p>
                  <p className="text-lg font-bold font-mono text-vblue-400">{meterData.tradeStatus.kwhIn?.toFixed(3) || '—'}</p>
                  <p className="text-[10px] text-gray-600">kWh</p>
                </div>
                <div className="bg-volt-dark/60 rounded-xl p-3 border border-volt-border text-center">
                  <p className="text-[10px] text-gray-500 mb-1">Delivery</p>
                  <p className={`text-lg font-bold font-mono ${(meterData.tradeStatus.deliveryPct || 0) >= 98 ? 'text-volt-green' : 'text-accent-400'}`}>{meterData.tradeStatus.deliveryPct || '0'}%</p>
                  <p className="text-[10px] text-gray-600">complete</p>
                </div>
              </div>
              {meterData.lastUpdated && (
                <p className="text-[10px] text-gray-600 text-right">
                  Last updated: {secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ago`}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Activity size={24} className="text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Waiting for meter data...</p>
              <p className="text-xs text-gray-600 mt-1">Readings arrive every 5 minutes</p>
            </div>
          )}
        </div>
      )}

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
          {trade.blockchain_tx_hash && <TimelineRow label="⛓️ Recorded on Solana" time={trade.created_at} />}
          {trade.delivery_tx_hash && <TimelineRow label="⛓️ Settled on Solana" time={trade.delivery_confirmed_at || trade.payment_released_at} />}
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
