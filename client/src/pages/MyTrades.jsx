import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tradesAPI } from '../api/trades'
import { useToast, useAuth } from '../hooks/useContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { EmptyState } from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import CountdownTimer from '../components/CountdownTimer'
import RatingModal from '../components/RatingModal'
import {
  Clock, ArrowRight, CheckCircle, AlertTriangle, Star, ArrowLeftRight,
  Zap, DollarSign, Shield, User
} from 'lucide-react'

export default function MyTrades() {
  const { user } = useAuth()
  const toast = useToast()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')
  const [ratingTrade, setRatingTrade] = useState(null)
  const [isRating, setIsRating] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { fetchTrades() }, [])

  const fetchTrades = async () => {
    try {
      setLoading(true)
      const response = await tradesAPI.getMyTrades()
      setTrades(response.data || [])
    } catch (err) { toast.error('Failed to load trades') }
    finally { setLoading(false) }
  }

  const handleConfirmDelivery = async (tradeId) => {
    setActionLoading(tradeId + '-deliver')
    try {
      await tradesAPI.confirmDelivery(tradeId)
      toast.success('Delivery confirmed ⚡')
      await fetchTrades()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to confirm delivery') }
    finally { setActionLoading(null) }
  }

  const handleConfirmReceipt = async (tradeId) => {
    setActionLoading(tradeId + '-receipt')
    try {
      await tradesAPI.confirmReceipt(tradeId)
      toast.success('Receipt confirmed! Payment released 🎉')
      await fetchTrades()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to confirm receipt') }
    finally { setActionLoading(null) }
  }

  const handleDispute = async (tradeId) => {
    setActionLoading(tradeId + '-dispute')
    try {
      await tradesAPI.raisDispute(tradeId)
      toast.success('Dispute raised')
      await fetchTrades()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to raise dispute') }
    finally { setActionLoading(null) }
  }

  const handleRateSubmit = async (tradeId, score, comment) => {
    setIsRating(true)
    try {
      await tradesAPI.rateTrade(tradeId, score, comment)
      toast.success('Thanks for rating! ⭐')
      setRatingTrade(null)
      await fetchTrades()
    } catch (err) { toast.error('Failed to submit rating') }
    finally { setIsRating(false) }
  }

  if (loading) return <LoadingSpinner message="Loading trades..." />

  const activeTrades = trades.filter(t => ['pending', 'delivering', 'completing'].includes(t.trade_status))
  const completedTrades = trades.filter(t => t.trade_status === 'completed')
  const disputedTrades = trades.filter(t => ['failed', 'disputed'].includes(t.trade_status))

  const currentTrades = activeTab === 'active' ? activeTrades :
    activeTab === 'completed' ? completedTrades : disputedTrades

  return (
    <div className="page-container animate-fade-in pb-24 md:pb-8">
      <h1 className="page-title">🔄 My Trades</h1>
      <p className="text-gray-500 text-lg mb-6">Track and manage your energy transactions</p>

      {/* Tabs */}
      <div className="tab-container">
        {[
          { key: 'active', label: 'Active', count: activeTrades.length, icon: Clock },
          { key: 'completed', label: 'Completed', count: completedTrades.length, icon: CheckCircle },
          { key: 'disputed', label: 'Disputed', count: disputedTrades.length, icon: AlertTriangle },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`tab-button ${activeTab === tab.key ? 'tab-button-active' : ''} flex items-center gap-2`}>
            <tab.icon size={14} />
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-volt-green/20 text-volt-green' : 'bg-volt-border text-gray-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Trade cards */}
      {currentTrades.length === 0 ? (
        <EmptyState
          title={`No ${activeTab} trades`}
          message={activeTab === 'active' ? 'Start trading from the marketplace!' : `You have no ${activeTab} trades yet`}
          icon={<ArrowLeftRight className="text-gray-600" size={36} />}
          action={activeTab === 'active' && <Link to="/marketplace" className="btn-primary text-sm">Go to Marketplace</Link>}
        />
      ) : (
        <div className="space-y-4">
          {currentTrades.map((trade, i) => {
            const isBuyer = trade.consumer_id === user?.id
            const partnerName = isBuyer ? trade.prosumer_name : trade.consumer_name
            const isActive = ['delivering', 'completing'].includes(trade.trade_status)

            return (
              <div key={trade.id} className={`card animate-slide-up ${isActive ? 'border-accent-500/30' : ''}`}
                style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Trade info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-volt-green/20 to-volt-green/5 flex items-center justify-center text-volt-green text-sm font-bold border border-volt-green/20">
                        {partnerName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white">{partnerName}</p>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${isBuyer ? 'bg-vblue-400/10 text-vblue-400' : 'bg-accent-500/10 text-accent-400'}`}>
                            {isBuyer ? 'Buying' : 'Selling'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 font-mono">#{trade.id?.slice(0, 8)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Units</p>
                        <p className="font-bold font-mono text-white">{parseFloat(trade.units_requested).toFixed(1)} <span className="text-xs text-gray-500 font-sans">kWh</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="font-bold font-mono text-volt-green">₹{parseFloat(trade.total_amount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <StatusBadge status={trade.trade_status} />
                      </div>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-col gap-2 min-w-[180px]">
                    {isActive && trade.delivery_deadline && (
                      <div className="mb-2">
                        <CountdownTimer deadline={trade.delivery_deadline} />
                      </div>
                    )}

                    {/* Prosumer: Confirm Delivery */}
                    {!isBuyer && trade.trade_status === 'delivering' && (
                      <button onClick={() => handleConfirmDelivery(trade.id)}
                        disabled={actionLoading === trade.id + '-deliver'}
                        className="btn-primary text-sm disabled:opacity-50">
                        {actionLoading === trade.id + '-deliver' ? 'Confirming...' : '⚡ Confirm Delivery'}
                      </button>
                    )}

                    {/* Consumer: Confirm Receipt */}
                    {isBuyer && trade.trade_status === 'completing' && (
                      <button onClick={() => handleConfirmReceipt(trade.id)}
                        disabled={actionLoading === trade.id + '-receipt'}
                        className="btn-primary text-sm disabled:opacity-50">
                        {actionLoading === trade.id + '-receipt' ? 'Confirming...' : '✅ Confirm Receipt'}
                      </button>
                    )}

                    {/* Dispute */}
                    {(trade.trade_status === 'delivering' || trade.trade_status === 'completing') && (
                      <button onClick={() => handleDispute(trade.id)}
                        disabled={actionLoading === trade.id + '-dispute'}
                        className="btn-ghost text-xs text-danger-400 disabled:opacity-50">
                        <span className="flex items-center gap-1"><AlertTriangle size={12} /> Dispute</span>
                      </button>
                    )}

                    {/* Completed: Rate + View */}
                    {trade.trade_status === 'completed' && !trade.has_rated && (
                      <button onClick={() => setRatingTrade({
                        ...trade,
                        other_party_name: partnerName
                      })} className="btn-accent text-sm">
                        <span className="flex items-center gap-1"><Star size={14} /> Rate Trade</span>
                      </button>
                    )}

                    <Link to={`/trades/${trade.id}`} className="text-xs text-volt-green font-semibold hover:text-volt-green/80 flex items-center gap-1">
                      View Details <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {ratingTrade && (
        <RatingModal trade={ratingTrade} onClose={() => setRatingTrade(null)}
          onSubmit={handleRateSubmit} isLoading={isRating} />
      )}
    </div>
  )
}
