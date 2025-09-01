import { useTranslation } from 'react-i18next'
import LanguageSelector from './LanguageSelector'

function Layout({ children }) {
  const { t } = useTranslation()

  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-to-main">
        {t('accessibility.skipToMain', 'Skip to main content')}
      </a>
      <header className="app-header">
        <h1 className="app-title">{t('wallet.title')}</h1>
        <LanguageSelector />
      </header>
      <main id="main-content" className="app-main">
        {children}
      </main>
    </div>
  )
}

export default Layout