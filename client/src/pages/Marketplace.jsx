import React, { useState, useEffect } from 'react'
import { listingsAPI } from '../api/listings'
import { tradesAPI } from '../api/trades'
import { walletAPI } from '../api/wallet'
import { useToast, useAuth } from '../hooks/useContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { EmptyState } from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import { ShoppingCart, Star, Zap, TrendingDown, Shield, Info, X } from 'lucide-react'

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

  useEffect(() => {
    fetchListings()
    fetchBalance()
  }, [])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const response = await listingsAPI.getListings()
      setListings(response.data || [])
    } catch (err) {
      toast.error('Failed to fetch listings')
    } finally {
      setLoading(false)
    }
  }

  const fetchBalance = async () => {
    try {
      const response = await walletAPI.getBalance()
      setWalletBalance(parseFloat(response.data?.wallet_balance || 0))
    } catch (err) {
      // Silently fail — will use stored balance
    }
  }

  const handleBuy = async (listing) => {
    if (!units || parseFloat(units) <= 0) { toast.error('Please enter valid units'); return }
    if (parseFloat(units) > listing.units_remaining) { toast.error(`Maximum ${listing.units_remaining} kWh available`); return }

    setIsCreatingTrade(true)
    try {
      await tradesAPI.createTrade(listing.id, parseFloat(units))
      toast.success('Order placed! Payment locked in escrow 🔒')
      setSelectedListing(null)
      setUnits('')
      await Promise.all([fetchListings(), fetchBalance()])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create trade')
    } finally {
      setIsCreatingTrade(false)
    }
  }

  const filteredListings = listings.filter((l) => {
    return parseFloat(l.price_per_unit) <= filters.maxPrice && (parseFloat(l.rating_avg) || 5.0) >= filters.minRating
  })

  if (loading) return <LoadingSpinner message="Loading marketplace..." />

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8">
        <h1 className="page-title">⚡ Energy Marketplace</h1>
        <p className="page-subtitle">Buy solar energy from your neighbours at better rates</p>
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
          <div>
            <label className="form-label">Max Price — ₹{filters.maxPrice}/kWh</label>
            <input
              type="range"
              min={1} max={15} step={0.5}
              value={filters.maxPrice}
              onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>₹1</span>
              <span>₹15</span>
            </div>
          </div>
          <div>
            <label className="form-label">Min Rating</label>
            <select
              value={filters.minRating}
              onChange={(e) => setFilters((prev) => ({ ...prev, minRating: parseFloat(e.target.value) }))}
              className="form-input"
            >
              <option value={0}>All ratings</option>
              <option value={3}>⭐ 3+ stars</option>
              <option value={4}>⭐ 4+ stars</option>
              <option value={5}>⭐ 5 stars</option>
            </select>
          </div>
          <div>
            <button onClick={fetchListings} className="btn-primary w-full">
              <span className="flex items-center justify-center gap-2">
                <Zap size={16} /> Refresh
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">
        {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''} found
      </p>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <EmptyState
          title="No listings found"
          message="Try adjusting your filters or check back later"
          icon={<ShoppingCart className="text-gray-400" size={36} />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onBuy={() => setSelectedListing(listing)} />
          ))}
        </div>
      )}

      {/* Buy Modal */}
      {selectedListing && (
        <BuyModal
          listing={selectedListing}
          units={units}
          setUnits={setUnits}
          onBuy={handleBuy}
          onClose={() => { setSelectedListing(null); setUnits('') }}
          isLoading={isCreatingTrade}
          userBalance={walletBalance}
        />
      )}
    </div>
  )
}

function ListingCard({ listing, onBuy }) {
  const gridRate = 8
  const savingsPerUnit = gridRate - parseFloat(listing.price_per_unit)
  const rating = parseFloat(listing.rating_avg) || 5.0

  return (
    <div className="card-hover group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-gray-900">{listing.prosumer_name?.split(' ')[0]}</h3>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={14} className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
            ))}
            <span className="text-xs text-gray-500 ml-1">({listing.rating_count || 0})</span>
          </div>
        </div>
        <StatusBadge status={listing.status} />
      </div>

      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl font-extrabold text-green-600">₹{parseFloat(listing.price_per_unit).toFixed(1)}</span>
        <span className="text-sm text-gray-500">/kWh</span>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Available</span>
          <span className="font-semibold text-gray-900">{parseFloat(listing.units_remaining).toFixed(1)} kWh</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Valid until</span>
          <span className="font-medium text-gray-700">{new Date(listing.available_until).toLocaleDateString()}</span>
        </div>
      </div>

      {savingsPerUnit > 0 && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl mb-4 ring-1 ring-emerald-200">
          <TrendingDown size={16} className="text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700">
            Save ₹{savingsPerUnit.toFixed(1)}/kWh vs DISCOM grid
          </span>
        </div>
      )}

      <button onClick={onBuy}
        className="w-full btn-primary group-hover:shadow-lg group-hover:shadow-green-500/20 transition-all">
        <span className="flex items-center justify-center gap-2">
          <ShoppingCart size={16} /> Buy Energy
        </span>
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
          <h2 className="text-xl font-bold text-gray-900">Order Energy</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Listing info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Zap size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{listing.prosumer_name}</p>
              <p className="text-sm text-gray-500">₹{parseFloat(listing.price_per_unit).toFixed(2)}/kWh</p>
            </div>
          </div>

          {/* Units input */}
          <div>
            <label className="form-label">Units to buy (kWh)</label>
            <input type="number" value={units} onChange={(e) => setUnits(e.target.value)}
              placeholder="0.00" min="0.1" max={listing.units_remaining} step="0.1"
              className="form-input text-lg font-semibold" disabled={isLoading} />
            <p className="text-xs text-gray-400 mt-1">Available: {parseFloat(listing.units_remaining).toFixed(2)} kWh</p>
          </div>

          {/* Calculation */}
          {unitsNum > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl space-y-2.5 ring-1 ring-green-200 animate-fade-in">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{unitsNum} kWh × ₹{parseFloat(listing.price_per_unit).toFixed(2)}</span>
                <span className="font-medium">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Platform fee (2.5%)</span>
                <span className="text-gray-500">₹{platformFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-green-200 pt-2.5 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-xl font-extrabold text-green-600">₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className={`flex items-center gap-2 text-xs p-2.5 rounded-lg ${sufficient ? 'bg-green-100/80 text-green-700' : 'bg-red-100/80 text-red-700'
                }`}>
                <span>Balance: ₹{userBalance.toFixed(2)}</span>
                {!sufficient && <span className="font-bold">— Insufficient, add funds first</span>}
              </div>
            </div>
          )}

          {/* Escrow explanation */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl text-xs text-blue-700 ring-1 ring-blue-200">
            <Shield size={18} className="flex-shrink-0 mt-0.5 text-blue-500" />
            <div>
              <p className="font-bold mb-0.5">Escrow Protection</p>
              <p>Your payment is locked safely. It is released to the seller only after energy delivery is confirmed. If undelivered within 60 minutes, you get a full auto-refund.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 btn-secondary" disabled={isLoading}>Cancel</button>
          <button
            onClick={() => onBuy(listing)}
            disabled={isLoading || !units || unitsNum <= 0 || !sufficient}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : '🔒 Confirm & Lock Escrow'}
          </button>
        </div>
      </div>
    </div>
  )
}
