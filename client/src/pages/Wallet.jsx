import React, { useState, useEffect } from 'react'
import { walletAPI } from '../api/wallet'
import { useToast, useAuth } from '../hooks/useContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, TrendingUp, CreditCard } from 'lucide-react'

export default function WalletPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addAmount, setAddAmount] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showAddFunds, setShowAddFunds] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [balRes, txRes] = await Promise.all([
        walletAPI.getBalance(),
        walletAPI.getTransactions(),
      ])
      setBalance(parseFloat(balRes.data?.wallet_balance || 0))
      setTransactions(txRes.data || null)
    } catch (err) {
      toast.error('Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddFunds = async () => {
    const amount = parseFloat(addAmount)
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }
    if (amount > 10000) { toast.error('Maximum ₹10,000 per transaction'); return }

    setIsAdding(true)
    try {
      await walletAPI.addFunds(amount)
      toast.success(`₹${amount.toFixed(2)} added to wallet!`)
      setAddAmount('')
      setShowAddFunds(false)
      await fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add funds')
    } finally {
      setIsAdding(false)
    }
  }

  const quickAmounts = [500, 1000, 2000, 5000]

  if (loading) return <LoadingSpinner message="Loading wallet..." />

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title">💰 Wallet</h1>
      <p className="page-subtitle">Manage your funds and view transaction history</p>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 rounded-2xl p-8 text-white shadow-xl shadow-green-700/30 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-green-200 text-sm font-medium mb-1">Available Balance</p>
            <p className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              ₹{balance.toFixed(2)}
            </p>
            <p className="text-green-200 text-xs mt-2 flex items-center gap-1.5">
              <CreditCard size={14} /> Test wallet — simulated payments
            </p>
          </div>
          <button onClick={() => setShowAddFunds(!showAddFunds)}
            className="px-6 py-3 bg-white text-green-700 rounded-xl font-bold text-sm hover:bg-green-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
            <span className="flex items-center gap-2"><Plus size={18} /> Add Funds</span>
          </button>
        </div>

        {/* Add Funds Section */}
        {showAddFunds && (
          <div className="mt-6 pt-6 border-t border-white/20 animate-slide-up">
            <div className="flex flex-wrap gap-2 mb-4">
              {quickAmounts.map((amt) => (
                <button key={amt} onClick={() => setAddAmount(amt.toString())}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${addAmount === amt.toString()
                      ? 'bg-white text-green-700'
                      : 'bg-white/15 text-white hover:bg-white/25'
                    }`}>
                  ₹{amt}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <input type="number" value={addAmount} onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Custom amount" min="1" max="10000"
                className="flex-1 px-4 py-3 rounded-xl bg-white/15 border border-white/20 text-white placeholder-green-200 focus:outline-none focus:ring-2 focus:ring-white/40" />
              <button onClick={handleAddFunds} disabled={isAdding}
                className="px-6 py-3 bg-white text-green-700 rounded-xl font-bold text-sm hover:bg-green-50 transition-all disabled:opacity-50">
                {isAdding ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {transactions?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <ArrowUpRight size={22} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-xl font-bold text-gray-900">₹{parseFloat(transactions.summary.total_amount_spent || 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <ArrowDownLeft size={22} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Earned</p>
              <p className="text-xl font-bold text-gray-900">₹{parseFloat(transactions.summary.total_amount_earned || 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingUp size={22} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Trades Completed</p>
              <p className="text-xl font-bold text-gray-900">{transactions.summary.completed_trades || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Transaction History</h2>
      <div className="card overflow-hidden p-0">
        {transactions?.transactions_as_buyer?.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Seller</th>
                <th className="text-left px-5 py-3 font-semibold">Units</th>
                <th className="text-left px-5 py-3 font-semibold">Amount</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.transactions_as_buyer.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{tx.seller_name}</td>
                  <td className="px-5 py-3 text-gray-600">{parseFloat(tx.units_requested).toFixed(1)} kWh</td>
                  <td className="px-5 py-3 text-gray-600">₹{parseFloat(tx.total_amount).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${tx.trade_status === 'completed' ? 'bg-green-100 text-green-700' :
                        tx.trade_status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                      }`}>
                      {tx.trade_status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">
            No transactions yet
          </div>
        )}
      </div>
    </div>
  )
}
