import api from './config'

export const paymentsAPI = {
  createOrder: async (amount, tradeId = null) => {
    const response = await api.post('/payments/create-order', {
      amount,
      tradeId
    })
    return response.data
  }
}
