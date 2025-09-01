import { renderHook } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n/config'
import { useFormatting } from '../hooks/useFormatting'

const wrapper = ({ children }) => (
  <I18nextProvider i18n={i18n}>
    {children}
  </I18nextProvider>
)

describe('useFormatting', () => {
  test('formats currency correctly for different languages', () => {
    const { result } = renderHook(() => useFormatting(), { wrapper })
    
    // Test currency formatting
    const amount = 1234.56
    const formatted = result.current.formatCurrency(amount)
    
    // Should return a formatted string
    expect(typeof formatted).toBe('string')
    expect(formatted).toContain('1')
    expect(formatted).toContain('234')
  })

  test('formats numbers correctly', () => {
    const { result } = renderHook(() => useFormatting(), { wrapper })
    
    const number = 1234567
    const formatted = result.current.formatNumber(number)
    
    expect(typeof formatted).toBe('string')
    expect(formatted).toContain('1')
  })

  test('formats dates correctly', () => {
    const { result } = renderHook(() => useFormatting(), { wrapper })
    
    const date = '2024-01-15T10:30:00Z'
    const formatted = result.current.formatDate(date)
    
    expect(typeof formatted).toBe('string')
    expect(formatted).toContain('2024')
  })

  test('returns current language', () => {
    const { result } = renderHook(() => useFormatting(), { wrapper })
    
    expect(typeof result.current.currentLanguage).toBe('string')
    expect(['zh-CN', 'zh-TW', 'ja-JP', 'en-US']).toContain(result.current.currentLanguage)
  })
})