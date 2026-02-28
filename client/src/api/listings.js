import api from './config'

export const listingsAPI = {
  getListings: async (lat, lng, radiusKm) => {
    const params = new URLSearchParams()
    if (lat) params.append('lat', lat)
    if (lng) params.append('lng', lng)
    if (radiusKm) params.append('radius_km', radiusKm)

    const response = await api.get(`/listings?${params.toString()}`)
    return response.data
  },

  getListingById: async (id) => {
    const response = await api.get(`/listings/${id}`)
    return response.data
  },

  createListing: async (unitsAvailable, pricePerUnit, availableFrom, availableUntil, latitude, longitude) => {
    const response = await api.post('/listings', {
      units_available: unitsAvailable,
      price_per_unit: pricePerUnit,
      available_from: availableFrom,
      available_until: availableUntil,
      latitude,
      longitude,
    })
    return response.data
  },

  updateListing: async (id, pricePerUnit, availableUntil) => {
    const response = await api.patch(`/listings/${id}`, {
      price_per_unit: pricePerUnit,
      available_until: availableUntil,
    })
    return response.data
  },

  deleteListing: async (id) => {
    const response = await api.delete(`/listings/${id}`)
    return response.data
  },

  getMyListings: async () => {
    const response = await api.get('/listings/my')
    return response.data
  },
}
