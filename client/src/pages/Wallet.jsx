import React, { useState, useEffect } from 'react'
import { walletAPI } from '../api/wallet'
import { useToast, useAuth } from '../hooks/useContext'
import LoadingSpinner from '../components/LoadingSpinner'
import AnimatedCounter from '../components/AnimatedCounter'
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, TrendingUp, CreditCard, Zap, X, Shield } from 'lucide-react'

export default function WalletPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addAmount, setAddAmount] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showAddFunds, setShowAddFunds] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [balRes, txRes] = await Promise.all([
        walletAPI.getBalance(),
        walletAPI.getTransactions(),
      ])
      setBalance(parseFloat(balRes.data?.wallet_balance || 0))
      setTransactions(txRes.data || null)
    } catch (err) { toast.error('Failed to load wallet data') }
    finally { setLoading(false) }
  }

  const handleAddFunds = async () => {
    const amount = parseFloat(addAmount)
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }
    if (amount > 10000) { toast.error('Maximum ₹10,000 per transaction'); return }

    setIsAdding(true)
    try {
      await walletAPI.addFunds(amount)
      toast.success(`₹${amount.toFixed(2)} added to wallet! ⚡`)
      setAddAmount('')
      setShowAddFunds(false)
      await fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add funds') }
    finally { setIsAdding(false) }
  }

  const quickAmounts = [500, 1000, 2000, 5000]

  if (loading) return <LoadingSpinner message="Loading wallet..." />

  return (
    <div className="page-container animate-fade-in pb-24 md:pb-8">
      <h1 className="page-title">💰 Wallet</h1>
      <p className="page-subtitle">Manage your funds and view transaction history</p>

      {/* Hero Balance Card */}
      <div className="relative overflow-hidden rounded-2xl p-8 mb-8 bg-gradient-to-br from-volt-surface via-volt-surface to-volt-dark border border-volt-green/20">
        {/* Glow background */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-volt-green/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-vblue-400/5 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className="text-volt-green" />
              <p className="text-gray-400 text-sm font-medium">Available Balance</p>
            </div>
            <p className="text-5xl sm:text-6xl font-extrabold font-mono text-white tracking-tight">
              ₹<AnimatedCounter value={balance} decimals={2} />
            </p>
            <p className="text-gray-600 text-xs mt-2 flex items-center gap-1.5">
              <CreditCard size={14} />
              Test wallet — simulated payments
            </p>
          </div>
          <button onClick={() => setShowAddFunds(!showAddFunds)}
            className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 font-bold shadow-glow-green">
            <Plus size={18} /> Add Funds
          </button>
        </div>

        {/* Add Funds Section */}
        {showAddFunds && (
          <div className="relative mt-8 pt-6 border-t border-volt-green/10 animate-slide-up">
            <div className="flex flex-wrap gap-2 mb-4">
              {quickAmounts.map((amt) => (
                <button key={amt} onClick={() => setAddAmount(amt.toString())}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${addAmount === amt.toString()
                    ? 'bg-volt-green text-volt-dark shadow-glow-green'
                    : 'bg-volt-border text-gray-400 hover:bg-volt-green/10 hover:text-volt-green border border-volt-border'
                    }`}>
                  ₹{amt.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <input type="number" value={addAmount} onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Or enter custom amount" min="1" max="10000"
                className="flex-1 form-input bg-volt-dark/80 text-lg font-mono" />
              <button onClick={handleAddFunds} disabled={isAdding}
                className="btn-primary px-8 text-lg font-bold disabled:opacity-50">
                {isAdding ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-volt-dark/30 border-t-volt-dark rounded-full animate-spin" />
                  </span>
                ) : 'Add'}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
              <Shield size={12} className="text-volt-green" />
              <span>Secure test transaction • Maximum ₹10,000 per transaction</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {transactions?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-danger-400/10 flex items-center justify-center">
              <ArrowUpRight size={22} className="text-danger-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-xl font-bold font-mono text-white">
                ₹{parseFloat(transactions.summary.total_amount_spent || 0).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-volt-green/10 flex items-center justify-center">
              <ArrowDownLeft size={22} className="text-volt-green" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Earned</p>
              <p className="text-xl font-bold font-mono text-white">
                ₹{parseFloat(transactions.summary.total_amount_earned || 0).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-vblue-400/10 flex items-center justify-center">
              <TrendingUp size={22} className="text-vblue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Trades Completed</p>
              <p className="text-xl font-bold font-mono text-white">
                {transactions.summary.completed_trades || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <h2 className="text-xl font-bold text-white mb-4 font-heading">Transaction History</h2>
      <div className="card p-0 overflow-hidden">
        {transactions?.transactions_as_buyer?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-volt-border text-xs text-gray-600 uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Seller</th>
                  <th className="text-left px-5 py-3 font-medium">Units</th>
                  <th className="text-left px-5 py-3 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.transactions_as_buyer.map((tx, i) => (
                  <tr key={tx.id} className="border-b border-volt-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-300">{tx.seller_name}</td>
                    <td className="px-5 py-3.5 text-gray-400 font-mono">{parseFloat(tx.units_requested).toFixed(1)} kWh</td>
                    <td className="px-5 py-3.5 text-white font-mono font-semibold">₹{parseFloat(tx.total_amount).toFixed(2)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                        ${tx.trade_status === 'completed' ? 'bg-volt-green/10 text-volt-green' :
                          tx.trade_status === 'failed' ? 'bg-danger-400/10 text-danger-400' :
                            'bg-accent-500/10 text-accent-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${tx.trade_status === 'completed' ? 'bg-volt-green' :
                            tx.trade_status === 'failed' ? 'bg-danger-400' : 'bg-accent-400 animate-pulse'
                          }`} />
                        {tx.trade_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-16 text-center text-gray-600 text-sm">
            <Wallet size={32} className="mx-auto mb-3 text-gray-700" />
            <p>No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
