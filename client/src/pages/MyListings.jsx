import React, { useState, useEffect } from 'react'
import { listingsAPI } from '../api/listings'
import { useToast, useAuth } from '../hooks/useContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { EmptyState } from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import AnimatedCounter from '../components/AnimatedCounter'
import { Sun, Plus, Zap, Trash2, Edit3, Save, X, Calendar, DollarSign, TrendingUp, Clock, Package } from 'lucide-react'

export default function MyListings() {
  const toast = useToast()
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [newForm, setNewForm] = useState({
    unitsAvailable: '', pricePerUnit: '', availableUntil: '',
    latitude: 26.9, longitude: 75.78
  })
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(null)

  useEffect(() => { fetchMyListings() }, [])

  const fetchMyListings = async () => {
    try {
      setLoading(true)
      const response = await listingsAPI.getMyListings()
      setListings(response.data || [])
    } catch (err) { toast.error('Failed to load listings') }
    finally { setLoading(false) }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const { unitsAvailable, pricePerUnit, availableUntil, latitude, longitude } = newForm
    if (!unitsAvailable || !pricePerUnit || !availableUntil) { toast.error('Fill all fields'); return }
    if (parseFloat(pricePerUnit) < 1 || parseFloat(pricePerUnit) > 15) { toast.error('Price must be ₹1-₹15/kWh'); return }

    setIsCreating(true)
    try {
      const now = new Date().toISOString()
      await listingsAPI.createListing(parseFloat(unitsAvailable), parseFloat(pricePerUnit), now, availableUntil, parseFloat(latitude), parseFloat(longitude))
      toast.success('Listing created! ⚡')
      setShowNewForm(false)
      setNewForm({ unitsAvailable: '', pricePerUnit: '', availableUntil: '', latitude: 26.9, longitude: 75.78 })
      await fetchMyListings()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create listing') }
    finally { setIsCreating(false) }
  }

  const handleDelete = async (id) => {
    setIsDeleting(id)
    try {
      await listingsAPI.deleteListing(id)
      toast.success('Listing removed')
      await fetchMyListings()
    } catch (err) { toast.error('Failed to remove listing') }
    finally { setIsDeleting(null) }
  }

  const handleUpdate = async (id) => {
    try {
      await listingsAPI.updateListing(id, parseFloat(editForm.price_per_unit), editForm.available_until)
      toast.success('Listing updated! ⚡')
      setEditingId(null)
      await fetchMyListings()
    } catch (err) { toast.error('Failed to update listing') }
  }

  if (loading) return <LoadingSpinner message="Loading your listings..." />

  const total = listings.reduce((sum, l) => sum + parseFloat(l.units_available || 0), 0)
  const active = listings.filter(l => new Date(l.available_until) > new Date())
  const potentialRev = listings.reduce((sum, l) => sum + parseFloat(l.units_remaining || 0) * parseFloat(l.price_per_unit || 0), 0)

  return (
    <div className="page-container animate-fade-in pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">☀️ My Listings</h1>
          <p className="text-gray-500 text-lg">Manage your energy listings</p>
        </div>
        <button onClick={() => setShowNewForm(!showNewForm)}
          className={`btn-primary flex items-center gap-2 ${showNewForm ? 'opacity-50' : ''}`}>
          <Plus size={16} /> Create Listing
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card-glass">
          <p className="text-xs text-gray-500">Total Listings</p>
          <p className="text-2xl font-bold font-mono text-white"><AnimatedCounter value={listings.length} decimals={0} /></p>
        </div>
        <div className="card-glass">
          <p className="text-xs text-gray-500">Active Now</p>
          <p className="text-2xl font-bold font-mono text-volt-green"><AnimatedCounter value={active.length} decimals={0} /></p>
        </div>
        <div className="card-glass">
          <p className="text-xs text-gray-500">Energy Listed</p>
          <p className="text-2xl font-bold font-mono text-white"><AnimatedCounter value={total} suffix=" kWh" decimals={1} /></p>
        </div>
        <div className="card-glass">
          <p className="text-xs text-gray-500">Potential Revenue</p>
          <p className="text-2xl font-bold font-mono text-volt-green"><AnimatedCounter value={potentialRev} prefix="₹" decimals={0} /></p>
        </div>
      </div>

      {/* Create form */}
      {showNewForm && (
        <div className="card mb-8 animate-slide-up border-volt-green/30">
          <h3 className="text-lg font-bold text-white mb-6 font-heading">New Energy Listing</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="form-label flex items-center gap-2"><Zap size={12} /> Energy Units (kWh)</label>
              <input type="number" value={newForm.unitsAvailable} onChange={(e) => setNewForm(p => ({ ...p, unitsAvailable: e.target.value }))}
                placeholder="e.g. 5.0" min="0.1" step="0.1" className="form-input" required />
            </div>
            <div>
              <label className="form-label flex items-center gap-2"><DollarSign size={12} /> Price per kWh (₹)</label>
              <input type="number" value={newForm.pricePerUnit} onChange={(e) => setNewForm(p => ({ ...p, pricePerUnit: e.target.value }))}
                placeholder="e.g. 6.50" min="1" max="15" step="0.1" className="form-input" required />
              <p className="text-xs text-gray-600 mt-1">DISCOM rate: ₹8/kWh • Suggested: ₹5-7</p>
            </div>
            <div>
              <label className="form-label flex items-center gap-2"><Calendar size={12} /> Available Until</label>
              <input type="datetime-local" value={newForm.availableUntil} onChange={(e) => setNewForm(p => ({ ...p, availableUntil: e.target.value }))}
                className="form-input" required />
            </div>
            <div className="flex items-end gap-3">
              <button type="submit" disabled={isCreating} className="btn-primary flex-1 disabled:opacity-50">
                {isCreating ? 'Creating...' : '⚡ List Energy'}
              </button>
              <button type="button" onClick={() => setShowNewForm(false)} className="btn-secondary px-4">
                <X size={18} />
              </button>
            </div>
          </form>

          {newForm.unitsAvailable && newForm.pricePerUnit && (
            <div className="mt-5 p-4 bg-volt-green/5 rounded-xl border border-volt-green/20 animate-fade-in">
              <div className="flex items-center gap-2 text-sm text-volt-green font-bold mb-1">
                <TrendingUp size={14} /> Earnings Preview
              </div>
              <p className="text-xs text-gray-400">
                If sold: <span className="mono-value text-volt-green font-bold text-base">₹{(parseFloat(newForm.unitsAvailable || 0) * parseFloat(newForm.pricePerUnit || 0) * 0.975).toFixed(2)}</span>
                <span className="text-gray-600"> (after 2.5% platform fee)</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Listings */}
      {listings.length === 0 ? (
        <EmptyState title="No listings yet" message="Create your first listing to start selling energy"
          icon={<Sun className="text-gray-600" size={36} />}
          action={<button onClick={() => setShowNewForm(true)} className="btn-primary text-sm">Create Listing</button>} />
      ) : (
        <div className="space-y-4">
          {listings.map((listing, i) => {
            const remaining = parseFloat(listing.units_remaining || 0)
            const total = parseFloat(listing.units_available || 0)
            const isEditing = editingId === listing.id
            const isExpired = new Date(listing.available_until) < new Date()
            const soldPct = total > 0 ? ((total - remaining) / total * 100) : 0

            return (
              <div key={listing.id} className={`card animate-fade-in`} style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="text-xl font-bold font-mono text-volt-green">₹{parseFloat(listing.price_per_unit).toFixed(1)}<span className="text-xs text-gray-500 font-sans">/kWh</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Available</p>
                      <p className="font-bold font-mono text-white">{remaining.toFixed(1)} <span className="text-gray-500 text-xs font-sans">/ {total.toFixed(1)} kWh</span></p>
                      <div className="w-full bg-volt-border rounded-full h-1.5 mt-1">
                        <div className="bg-volt-green h-1.5 rounded-full" style={{ width: `${Math.min(100 - soldPct, 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Valid Until</p>
                      <p className="text-sm font-medium text-gray-300">{new Date(listing.available_until).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <StatusBadge status={isExpired ? 'expired' : remaining <= 0 ? 'sold' : 'active'} />
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {!isEditing ? (
                      <>
                        <button onClick={() => { setEditingId(listing.id); setEditForm({ price_per_unit: listing.price_per_unit, available_until: listing.available_until }) }}
                          className="btn-ghost text-xs"><Edit3 size={14} /></button>
                        <button onClick={() => handleDelete(listing.id)} disabled={isDeleting === listing.id}
                          className="btn-ghost text-xs text-danger-400 hover:text-danger-400 hover:bg-danger-400/5 disabled:opacity-50">
                          {isDeleting === listing.id ? '...' : <Trash2 size={14} />}
                        </button>
                      </>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <input type="number" value={editForm.price_per_unit} onChange={(e) => setEditForm(p => ({ ...p, price_per_unit: e.target.value }))}
                          className="form-input w-24 text-sm" step="0.1" />
                        <button onClick={() => handleUpdate(listing.id)} className="btn-primary text-xs px-3"><Save size={14} /></button>
                        <button onClick={() => setEditingId(null)} className="btn-ghost text-xs"><X size={14} /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
