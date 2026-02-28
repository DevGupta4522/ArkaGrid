import api from './config'

export const tradesAPI = {
  createTrade: async (listingId, unitsRequested) => {
    const response = await api.post('/trades', {
      listing_id: listingId,
      units_requested: unitsRequested,
    })
    return response.data
  },

  getTradeById: async (id) => {
    const response = await api.get(`/trades/${id}`)
    return response.data
  },

  getMyTrades: async () => {
    const response = await api.get('/trades/my')
    return response.data
  },

  confirmDelivery: async (id) => {
    const response = await api.post(`/trades/${id}/confirm-delivery`)
    return response.data
  },

  confirmReceipt: async (id) => {
    const response = await api.post(`/trades/${id}/confirm-receipt`)
    return response.data
  },

  raisDispute: async (id) => {
    const response = await api.post(`/trades/${id}/dispute`)
    return response.data
  },

  resolveDispute: async (id, resolution, unitsDelivered) => {
    const response = await api.post(`/trades/${id}/resolve`, {
      resolution,
      units_delivered: unitsDelivered,
    })
    return response.data
  },

  rateTrade: async (tradeId, score, comment) => {
    const response = await api.post(`/trades/${tradeId}/rate`, { score, comment })
    return response.data
  },
}
