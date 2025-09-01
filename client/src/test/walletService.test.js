import { vi, describe, test, expect, beforeEach } from 'vitest'
import WalletService from '../services/walletService'
import { walletAPI } from '../services/api'

// Mock the API
vi.mock('../services/api', () => ({
  walletAPI: {
    createWallet: vi.fn(),
    getWallet: vi.fn(),
    transfer: vi.fn(),
    getTransactionHistory: vi.fn()
  }
}))

describe('WalletService', () => {
  let mockDispatch
  let walletService

  beforeEach(() => {
    mockDispatch = vi.fn()
    walletService = new WalletService(mockDispatch)
    vi.clearAllMocks()
  })

  test('createWallet dispatches correct actions on success', async () => {
    const mockWallet = { id: '1', username: 'test', balance: 100 }
    walletAPI.createWallet.mockResolvedValue({ success: true, wallet: mockWallet })

    await walletService.createWallet('test', 100)

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_LOADING', payload: true })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_WALLET', payload: mockWallet })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_LOADING', payload: false })
  })

  test('createWallet dispatches error on failure', async () => {
    walletAPI.createWallet.mockRejectedValue(new Error('API Error'))

    await expect(walletService.createWallet('test', 100)).rejects.toThrow('API Error')

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_LOADING', payload: true })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_ERROR', payload: 'API Error' })
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_LOADING', payload: false })
  })

  test('clearError dispatches CLEAR_ERROR action', () => {
    walletService.clearError()
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLEAR_ERROR' })
  })
})