import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.197:3200/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Wallet API methods
export const walletAPI = {
  // Create a new wallet
  createWallet: async (username, initialBalance) => {
    const response = await api.post('/wallets', { username, initialBalance })
    return response.data
  },

  // Get wallet information
  getWallet: async (walletId) => {
    const response = await api.get(`/wallets/${walletId}`)
    return response.data
  },

  // Get wallet by username (for login)
  getWalletByUsername: async (username) => {
    const response = await api.get(`/wallets/username/${username}`)
    return response.data
  },

  // Update wallet balance
  updateBalance: async (walletId, amount) => {
    const response = await api.put(`/wallets/${walletId}/balance`, { amount })
    return response.data
  },

  // Execute transfer by wallet ID
  transfer: async (fromWalletId, toWalletId, amount) => {
    const response = await api.post('/transfers', { fromWalletId, toWalletId, amount })
    return response.data
  },

  // Execute transfer by username
  transferByUsername: async (fromUsername, toUsername, amount) => {
    const response = await api.post('/transfers/by-username', { fromUsername, toUsername, amount })
    return response.data
  },

  // Get transaction history
  getTransactionHistory: async (walletId, page = 1, limit = 20) => {
    const response = await api.get(`/wallets/${walletId}/transactions/detailed`, {
      params: { page, limit }
    })
    return response.data
  }
}

export default api