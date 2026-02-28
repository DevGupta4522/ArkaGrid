import React, { useState, useEffect } from 'react'
import { listingsAPI } from '../api/listings'
import { useToast } from '../hooks/useContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { EmptyState } from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import { Plus, Edit3, Trash2, Eye, List, X, Zap } from 'lucide-react'

export default function MyListings() {
  const toast = useToast()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editListing, setEditListing] = useState(null)

  useEffect(() => { fetchListings() }, [])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const response = await listingsAPI.getMyListings()
      setListings(response.data || [])
    } catch (err) {
      toast.error('Failed to fetch listings')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Cancel this listing?')) return
    try {
      await listingsAPI.deleteListing(id)
      toast.success('Listing cancelled')
      await fetchListings()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel listing')
    }
  }

  const activeCount = listings.filter(l => l.status === 'active').length
  const totalUnits = listings.filter(l => l.status === 'active').reduce((s, l) => s + parseFloat(l.units_remaining || 0), 0)

  if (loading) return <LoadingSpinner message="Loading listings..." />

  return (
    <div className="page-container animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">☀️ My Listings</h1>
          <p className="text-gray-500">{activeCount} active · {totalUnits.toFixed(1)} kWh available</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <span className="flex items-center gap-2"><Plus size={18} /> New Listing</span>
        </button>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title="No listings yet"
          message="Create your first energy listing to start selling"
          icon={<Zap className="text-gray-400" size={36} />}
          action={
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-2">
              <span className="flex items-center gap-2"><Plus size={16} /> Create Listing</span>
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <ListingRow key={listing.id} listing={listing} onDelete={handleDelete} onEdit={setEditListing} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateListingModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchListings() }}
        />
      )}

      {editListing && (
        <EditListingModal
          listing={editListing}
          onClose={() => setEditListing(null)}
          onUpdated={() => { setEditListing(null); fetchListings() }}
        />
      )}
    </div>
  )
}

function ListingRow({ listing, onDelete, onEdit }) {
  const soldPercentage = ((parseFloat(listing.units_available) - parseFloat(listing.units_remaining)) / parseFloat(listing.units_available) * 100)
  const earnings = (parseFloat(listing.units_available) - parseFloat(listing.units_remaining)) * parseFloat(listing.price_per_unit)

  return (
    <div className="card-hover">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Price</p>
            <p className="text-lg font-bold text-green-600">₹{parseFloat(listing.price_per_unit).toFixed(2)}/kWh</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Available</p>
            <p className="font-semibold">{parseFloat(listing.units_remaining).toFixed(1)}/{parseFloat(listing.units_available).toFixed(1)} kWh</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(soldPercentage, 100)}%` }} />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Earnings</p>
            <p className="font-semibold text-gray-900">₹{earnings.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Valid Until</p>
            <p className="font-medium text-sm">{new Date(listing.available_until).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center">
            <StatusBadge status={listing.status} />
          </div>
        </div>

        {listing.status === 'active' && (
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(listing)} className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
              <Edit3 size={16} />
            </button>
            <button onClick={() => onDelete(listing.id)} className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function CreateListingModal({ onClose, onCreated }) {
  const toast = useToast()
  const [form, setForm] = useState({
    units_available: '', price_per_unit: '', available_from: '', available_until: '',
    latitude: '28.7041', longitude: '77.1025'
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const estimatedEarnings = () => {
    const u = parseFloat(form.units_available) || 0
    const p = parseFloat(form.price_per_unit) || 0
    const fee = u * p * 0.025
    return (u * p - fee).toFixed(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await listingsAPI.createListing(
        parseFloat(form.units_available), parseFloat(form.price_per_unit),
        form.available_from, form.available_until,
        parseFloat(form.latitude), parseFloat(form.longitude)
      )
      toast.success('Listing created! 🎉')
      onCreated()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Create Energy Listing</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><X size={20} className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Units (kWh)</label>
              <input type="number" name="units_available" value={form.units_available}
                onChange={handleChange} placeholder="10" min="0.1" step="0.1" className="form-input" required />
            </div>
            <div>
              <label className="form-label">Price (₹/kWh)</label>
              <input type="number" name="price_per_unit" value={form.price_per_unit}
                onChange={handleChange} placeholder="6.50" min="0.1" max="15" step="0.1" className="form-input" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Available From</label>
              <input type="datetime-local" name="available_from" value={form.available_from}
                onChange={handleChange} className="form-input" required />
            </div>
            <div>
              <label className="form-label">Available Until</label>
              <input type="datetime-local" name="available_until" value={form.available_until}
                onChange={handleChange} className="form-input" required />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Latitude</label>
              <input type="number" name="latitude" value={form.latitude}
                onChange={handleChange} step="0.0001" className="form-input" required />
            </div>
            <div>
              <label className="form-label">Longitude</label>
              <input type="number" name="longitude" value={form.longitude}
                onChange={handleChange} step="0.0001" className="form-input" required />
            </div>
          </div>

          {/* Earnings Preview */}
          {form.units_available && form.price_per_unit && (
            <div className="p-3 bg-green-50 rounded-xl text-center ring-1 ring-green-200 animate-fade-in">
              <p className="text-sm text-green-700">
                Estimated earnings: <span className="font-bold text-lg">₹{estimatedEarnings()}</span>
                <span className="text-xs block mt-0.5 text-green-600">(after 2.5% platform fee)</span>
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary" disabled={loading}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditListingModal({ listing, onClose, onUpdated }) {
  const toast = useToast()
  const [form, setForm] = useState({
    price_per_unit: listing.price_per_unit || '',
    available_until: listing.available_until ? new Date(listing.available_until).toISOString().slice(0, 16) : ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await listingsAPI.updateListing(listing.id, parseFloat(form.price_per_unit), form.available_until)
      toast.success('Listing updated')
      onUpdated()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Edit Listing</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><X size={20} className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Price (₹/kWh)</label>
            <input type="number" value={form.price_per_unit}
              onChange={(e) => setForm((p) => ({ ...p, price_per_unit: e.target.value }))}
              min="0.1" max="15" step="0.1" className="form-input" />
          </div>
          <div>
            <label className="form-label">Available Until</label>
            <input type="datetime-local" value={form.available_until}
              onChange={(e) => setForm((p) => ({ ...p, available_until: e.target.value }))}
              className="form-input" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
