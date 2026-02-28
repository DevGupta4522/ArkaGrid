import React, { useState, useEffect } from 'react'
import { listingsAPI } from '../api/listings'
import { tradesAPI } from '../api/trades'
import { walletAPI } from '../api/wallet'
import { useToast, useAuth } from '../hooks/useContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { EmptyState } from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import { ShoppingCart, Star, Zap, TrendingDown, Shield, X, MapPin, Clock, Filter } from 'lucide-react'

export default function Marketplace() {
  const { user } = useAuth()
  const toast = useToast()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedListing, setSelectedListing] = useState(null)
  const [units, setUnits] = useState('')
  const [isCreatingTrade, setIsCreatingTrade] = useState(false)
  const [walletBalance, setWalletBalance] = useState(parseFloat(user?.wallet_balance || 0))
  const [filters, setFilters] = useState({ maxPrice: 15, minRating: 0 })
  const [sortBy, setSortBy] = useState('cheapest')

  useEffect(() => { fetchListings(); fetchBalance() }, [])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const response = await listingsAPI.getListings()
      setListings(response.data || [])
    } catch (err) { toast.error('Failed to fetch listings') }
    finally { setLoading(false) }
  }

  const fetchBalance = async () => {
    try {
      const response = await walletAPI.getBalance()
      setWalletBalance(parseFloat(response.data?.wallet_balance || 0))
    } catch (err) { /* silent */ }
  }

  const handleBuy = async (listing) => {
    if (!units || parseFloat(units) <= 0) { toast.error('Enter valid units'); return }
    if (parseFloat(units) > listing.units_remaining) { toast.error(`Max ${listing.units_remaining} kWh`); return }
    setIsCreatingTrade(true)
    try {
      await tradesAPI.createTrade(listing.id, parseFloat(units))
      toast.success('Order placed! Payment locked in escrow 🔒')
      setSelectedListing(null); setUnits('')
      await Promise.all([fetchListings(), fetchBalance()])
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create trade') }
    finally { setIsCreatingTrade(false) }
  }

  let filteredListings = listings.filter((l) =>
    parseFloat(l.price_per_unit) <= filters.maxPrice && (parseFloat(l.rating_avg) || 5.0) >= filters.minRating
  )

  if (sortBy === 'cheapest') filteredListings.sort((a, b) => parseFloat(a.price_per_unit) - parseFloat(b.price_per_unit))
  else if (sortBy === 'rated') filteredListings.sort((a, b) => (parseFloat(b.rating_avg) || 5) - (parseFloat(a.rating_avg) || 5))

  if (loading) return <LoadingSpinner message="Loading marketplace..." />

  return (
    <div className="page-container animate-fade-in pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="page-title">⚡ Energy Marketplace</h1>
        <p className="text-gray-500 text-lg">Buy solar energy from your neighbours at better rates</p>
      </div>

      {/* Sort Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'cheapest', label: 'Cheapest' },
          { key: 'rated', label: 'Highest Rated' },
        ].map(s => (
          <button key={s.key} onClick={() => setSortBy(s.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${sortBy === s.key ? 'bg-volt-green text-volt-dark' : 'bg-volt-surface border border-volt-border text-gray-400 hover:text-white'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
          <div>
            <label className="form-label flex items-center gap-2"><Filter size={12} /> Max Price — <span className="text-volt-green mono-value">₹{filters.maxPrice}/kWh</span></label>
            <input type="range" min={1} max={15} step={0.5} value={filters.maxPrice}
              onChange={(e) => setFilters(p => ({ ...p, maxPrice: parseFloat(e.target.value) }))} className="w-full" />
            <div className="flex justify-between text-xs text-gray-600 mt-1"><span>₹1</span><span>₹15</span></div>
          </div>
          <div>
            <label className="form-label">Min Rating</label>
            <select value={filters.minRating} onChange={(e) => setFilters(p => ({ ...p, minRating: parseFloat(e.target.value) }))} className="form-input">
              <option value={0}>All ratings</option>
              <option value={3}>⭐ 3+ stars</option>
              <option value={4}>⭐ 4+ stars</option>
              <option value={5}>⭐ 5 stars</option>
            </select>
          </div>
          <div>
            <button onClick={fetchListings} className="btn-primary w-full">
              <span className="flex items-center justify-center gap-2"><Zap size={16} /> Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">{filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''} found</p>

      {filteredListings.length === 0 ? (
        <EmptyState title="No listings found" message="Try adjusting your filters or check back later"
          icon={<ShoppingCart className="text-gray-600" size={36} />} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((listing, i) => (
            <ListingCard key={listing.id} listing={listing} onBuy={() => setSelectedListing(listing)} delay={i} />
          ))}
        </div>
      )}

      {selectedListing && (
        <BuyModal listing={selectedListing} units={units} setUnits={setUnits}
          onBuy={handleBuy} onClose={() => { setSelectedListing(null); setUnits('') }}
          isLoading={isCreatingTrade} userBalance={walletBalance} />
      )}
    </div>
  )
}

function ListingCard({ listing, onBuy, delay }) {
  const gridRate = 8
  const savingsPerUnit = gridRate - parseFloat(listing.price_per_unit)
  const rating = parseFloat(listing.rating_avg) || 5.0
  const remaining = parseFloat(listing.units_remaining)
  const total = parseFloat(listing.units_available)
  const pct = ((total - remaining) / total * 100)

  return (
    <div className={`card-hover group animate-slide-up`} style={{ animationDelay: `${delay * 80}ms` }}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-volt-green/20 to-volt-green/5 flex items-center justify-center text-volt-green font-bold text-sm border border-volt-green/20">
            {listing.prosumer_name?.charAt(0)?.toUpperCase() || 'P'}
          </div>
          <div>
            <h3 className="font-bold text-white">{listing.prosumer_name?.split(' ')[0]}</h3>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={10} className={star <= rating ? 'text-accent-400 fill-accent-400' : 'text-gray-700'} />
              ))}
              <span className="text-[10px] text-gray-500 ml-1">({listing.rating_count || 0})</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="live-dot" />
          <span className="text-[10px] text-gray-500">Live</span>
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl font-extrabold font-mono text-volt-green">₹{parseFloat(listing.price_per_unit).toFixed(1)}</span>
        <span className="text-sm text-gray-500">/kWh</span>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Available</span>
            <span className="font-mono text-gray-400">{remaining.toFixed(1)} / {total.toFixed(1)} kWh</span>
          </div>
          <div className="w-full bg-volt-border rounded-full h-1.5 overflow-hidden">
            <div className="bg-volt-green h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100 - pct, 100)}%` }} />
          </div>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Valid until</span>
          <span className="text-gray-400">{new Date(listing.available_until).toLocaleDateString()}</span>
        </div>
      </div>

      {savingsPerUnit > 0 && (
        <div className="flex items-center gap-2 p-2.5 bg-volt-green/5 rounded-xl mb-4 border border-volt-green/20">
          <TrendingDown size={14} className="text-volt-green" />
          <span className="text-xs font-bold text-volt-green">Save ₹{savingsPerUnit.toFixed(1)}/kWh vs DISCOM</span>
        </div>
      )}

      <button onClick={onBuy}
        className="w-full btn-primary group-hover:shadow-glow-green transition-all">
        <span className="flex items-center justify-center gap-2">⚡ Buy Energy</span>
      </button>
    </div>
  )
}

function BuyModal({ listing, units, setUnits, onBuy, onClose, isLoading, userBalance }) {
  const unitsNum = parseFloat(units) || 0
  const total = unitsNum * parseFloat(listing.price_per_unit)
  const platformFee = total * 0.025
  const grandTotal = total + platformFee
  const sufficient = userBalance >= grandTotal

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white font-heading">Buy Energy from {listing.prosumer_name?.split(' ')[0]}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="form-label">Units to buy (kWh)</label>
            <input type="number" value={units} onChange={(e) => setUnits(e.target.value)}
              placeholder="0.00" min="0.1" max={listing.units_remaining} step="0.1"
              className="form-input text-lg font-mono font-semibold" disabled={isLoading} />
            <p className="text-xs text-gray-600 mt-1">Available: <span className="mono-value">{parseFloat(listing.units_remaining).toFixed(2)} kWh</span></p>
          </div>

          {unitsNum > 0 && (
            <div className="bg-volt-dark/80 p-4 rounded-xl space-y-2.5 border border-volt-border animate-fade-in">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{unitsNum} kWh × ₹{parseFloat(listing.price_per_unit).toFixed(2)}</span>
                <span className="font-mono text-gray-300">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Platform fee (2.5%)</span>
                <span className="font-mono text-gray-500">₹{platformFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-volt-border pt-2.5 flex justify-between">
                <span className="font-bold text-white">Total</span>
                <span className="text-xl font-extrabold font-mono text-volt-green">₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className={`flex items-center gap-2 text-xs p-2.5 rounded-lg ${sufficient ? 'bg-volt-green/10 text-volt-green' : 'bg-danger-400/10 text-danger-400'}`}>
                <span>Balance: <span className="mono-value">₹{userBalance.toFixed(2)}</span></span>
                {!sufficient && <span className="font-bold">— Insufficient funds</span>}
              </div>
            </div>
          )}

          {/* Escrow explanation */}
          <div className="flex items-start gap-3 p-3 bg-accent-500/5 rounded-xl text-xs border border-accent-500/20">
            <Shield size={18} className="flex-shrink-0 mt-0.5 text-accent-400" />
            <div className="text-gray-400">
              <p className="font-bold text-accent-400 mb-0.5">🔒 Escrow Protection</p>
              <p>Your payment is locked safely. Released to seller only after energy delivery is confirmed. If undelivered within 60 minutes → instant full refund.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 btn-secondary" disabled={isLoading}>Cancel</button>
          <button onClick={() => onBuy(listing)}
            disabled={isLoading || !units || unitsNum <= 0 || !sufficient}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-volt-dark/30 border-t-volt-dark rounded-full animate-spin" /> Processing...
              </span>
            ) : `🔒 Lock ₹${grandTotal.toFixed(2)} in Escrow`}
          </button>
        </div>
      </div>
    </div>
  )
}
