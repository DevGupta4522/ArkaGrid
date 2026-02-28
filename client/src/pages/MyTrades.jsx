import React, { useState, useEffect } from 'react'
import { tradesAPI } from '../api/trades'
import { useToast } from '../hooks/useContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { EmptyState } from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import CountdownTimer from '../components/CountdownTimer'
import { AlertCircle, ArrowLeftRight, CheckCircle, XCircle } from 'lucide-react'

export default function MyTrades() {
  const toast = useToast()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { fetchTrades() }, [])

  const fetchTrades = async () => {
    try {
      setLoading(true)
      const response = await tradesAPI.getMyTrades()
      setTrades(response.data || [])
    } catch (err) {
      toast.error('Failed to fetch trades')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action, tradeId) => {
    setActionLoading(tradeId)
    try {
      switch (action) {
        case 'deliver':
          await tradesAPI.confirmDelivery(tradeId)
          toast.success('Delivery confirmed! Waiting for buyer confirmation.')
          break
        case 'receipt':
          await tradesAPI.confirmReceipt(tradeId)
          toast.success('Receipt confirmed! Trade complete.')
          break
        case 'dispute':
          await tradesAPI.raisDispute(tradeId)
          toast.warning('Dispute raised. Admin will review shortly.')
          break
      }
      await fetchTrades()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'disputed', label: 'Disputed' },
  ]

  const filteredTrades = trades.filter((t) => {
    if (activeTab === 'active') return ['pending', 'delivering', 'completing'].includes(t.trade_status)
    if (activeTab === 'completed') return t.trade_status === 'completed'
    if (activeTab === 'disputed') return t.trade_status === 'disputed'
    return true
  })

  if (loading) return <LoadingSpinner message="Loading trades..." />

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title">🔄 My Trades</h1>
      <p className="page-subtitle">{trades.length} total trade{trades.length !== 1 ? 's' : ''}</p>

      {/* Tabs */}
      <div className="tab-container">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`tab-button ${activeTab === tab.key ? 'tab-button-active' : ''}`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ml-1.5 text-xs opacity-60">
                ({trades.filter((t) => {
                  if (tab.key === 'active') return ['pending', 'delivering', 'completing'].includes(t.trade_status)
                  if (tab.key === 'completed') return t.trade_status === 'completed'
                  if (tab.key === 'disputed') return t.trade_status === 'disputed'
                  return false
                }).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredTrades.length === 0 ? (
        <EmptyState
          title="No trades found"
          message={`No ${activeTab === 'all' ? '' : activeTab + ' '}trades yet`}
          icon={<ArrowLeftRight className="text-gray-400" size={36} />}
        />
      ) : (
        <div className="space-y-4">
          {filteredTrades.map((trade) => (
            <TradeCard
              key={trade.id}
              trade={trade}
              onAction={handleAction}
              isLoading={actionLoading === trade.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TradeCard({ trade, onAction, isLoading }) {
  const isActive = ['delivering', 'completing'].includes(trade.trade_status)
  const deadline = new Date(trade.delivery_deadline)
  const isExpiring = isActive && deadline - new Date() < 10 * 60 * 1000 && deadline > new Date()

  return (
    <div className={`card transition-all ${isExpiring ? 'ring-2 ring-red-200 shadow-glow-amber' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg text-gray-900">{trade.other_party_name}</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg font-mono">
              {trade.my_role === 'seller' ? '📤 Selling' : '📥 Buying'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">#{trade.id?.slice(0, 8)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={trade.trade_status} />
          <StatusBadge status={trade.escrow_status} label="Escrow" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Units</p>
          <p className="font-bold text-gray-900">{parseFloat(trade.units_requested).toFixed(1)} kWh</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Amount</p>
          <p className="font-bold text-gray-900">₹{parseFloat(trade.total_amount).toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Fee</p>
          <p className="font-bold text-gray-900">₹{parseFloat(trade.platform_fee || 0).toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Delivered</p>
          <p className="font-bold text-gray-900">{parseFloat(trade.units_delivered || 0).toFixed(1)} kWh</p>
        </div>
      </div>

      {/* Countdown */}
      {isActive && (
        <div className={`p-3 rounded-xl mb-4 flex items-center gap-3 ${isExpiring ? 'bg-red-50 ring-1 ring-red-200' : 'bg-amber-50 ring-1 ring-amber-200'
          }`}>
          <AlertCircle size={18} className={isExpiring ? 'text-red-500 animate-pulse' : 'text-amber-600'} />
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-600 mb-0.5">Delivery Deadline</p>
            <CountdownTimer deadline={trade.delivery_deadline} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {trade.trade_status === 'delivering' && trade.my_role === 'seller' && (
          <button onClick={() => onAction('deliver', trade.id)} disabled={isLoading}
            className="flex-1 btn-primary disabled:opacity-50">
            {isLoading ? 'Processing...' : '✓ Mark as Delivered'}
          </button>
        )}

        {trade.trade_status === 'completing' && trade.my_role === 'buyer' && (
          <>
            <button onClick={() => onAction('receipt', trade.id)} disabled={isLoading}
              className="flex-1 btn-primary disabled:opacity-50">
              <span className="flex items-center justify-center gap-2">
                <CheckCircle size={16} /> Confirm Receipt
              </span>
            </button>
            <button onClick={() => onAction('dispute', trade.id)} disabled={isLoading}
              className="flex-1 btn-danger disabled:opacity-50">
              <span className="flex items-center justify-center gap-2">
                <XCircle size={16} /> Raise Dispute
              </span>
            </button>
          </>
        )}

        {trade.trade_status === 'disputed' && (
          <div className="flex-1 p-3 bg-orange-50 rounded-xl text-orange-700 text-sm font-semibold ring-1 ring-orange-200">
            ⚖️ Dispute raised — Admin will review shortly
          </div>
        )}

        {trade.trade_status === 'completed' && (
          <div className="flex-1 p-3 bg-green-50 rounded-xl text-green-700 text-sm font-semibold ring-1 ring-green-200">
            ✓ Trade completed successfully
          </div>
        )}

        {trade.trade_status === 'failed' && (
          <div className="flex-1 p-3 bg-red-50 rounded-xl text-red-700 text-sm font-semibold ring-1 ring-red-200">
            ✗ Trade failed — Amount refunded
          </div>
        )}
      </div>
    </div>
  )
}
