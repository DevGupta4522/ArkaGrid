import api from './config'

export const adminAPI = {
    getStats: async () => {
        const response = await api.get('/admin/stats')
        return response.data
    },

    getDisputedTrades: async () => {
        const response = await api.get('/admin/disputes')
        return response.data
    },

    resolveDispute: async (tradeId, resolution, unitsDelivered) => {
        const response = await api.post(`/admin/trades/${tradeId}/resolve`, {
            resolution,
            units_delivered: unitsDelivered,
        })
        return response.data
    },
}
