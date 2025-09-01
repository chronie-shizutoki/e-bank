import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n/config'
import WalletProvider from '../context/WalletContext'
import LanguageSelector from '../components/LanguageSelector'

const renderWithProviders = (component) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <WalletProvider>
        {component}
      </WalletProvider>
    </I18nextProvider>
  )
}

describe('LanguageSelector', () => {
  test('renders language selector with all language options', () => {
    renderWithProviders(<LanguageSelector />)
    
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    
    // Check if all language options are present
    expect(screen.getByText('简体中文')).toBeInTheDocument()
    expect(screen.getByText('繁體中文')).toBeInTheDocument()
    expect(screen.getByText('日本語')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
  })

  test('changes language when option is selected', () => {
    renderWithProviders(<LanguageSelector />)
    
    const select = screen.getByRole('combobox')
    
    // Change to English
    fireEvent.change(select, { target: { value: 'en-US' } })
    expect(select.value).toBe('en-US')
    
    // Change to Japanese
    fireEvent.change(select, { target: { value: 'ja-JP' } })
    expect(select.value).toBe('ja-JP')
  })
})