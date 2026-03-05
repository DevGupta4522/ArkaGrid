import api from './config'

export const walletAPI = {
  getBalance: async () => {
    const response = await api.get('/wallet/balance')
    return response.data
  },

  addFunds: async (amount) => {
    const response = await api.post('/wallet/add-funds', { amount })
    return response.data
  },

  getTransactions: async () => {
    const response = await api.get('/wallet/transactions')
    return response.data
  },

  updateWalletAddress: async (walletAddress, walletType = 'phantom') => {
    const response = await api.patch('/wallet/address', {
      wallet_address: walletAddress,
      wallet_type: walletType,
    })
    return response.data
  },
}
