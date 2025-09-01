import { useTranslation } from 'react-i18next'
import { useWallet } from '../context/WalletContext'
import { useEffect } from 'react'
import { languageStorage } from '../utils/languageStorage'

const languages = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'en-US', name: 'English' }
]

function LanguageSelector() {
  const { i18n } = useTranslation()
  const { currentLanguage, dispatch } = useWallet()

  // Sync i18n language with wallet context on mount
  useEffect(() => {
    if (i18n.language !== currentLanguage) {
      i18n.changeLanguage(currentLanguage)
    }
  }, [i18n, currentLanguage])

  const handleLanguageChange = (languageCode) => {
    if (languageStorage.isSupported(languageCode)) {
      i18n.changeLanguage(languageCode)
      dispatch({ type: 'SET_LANGUAGE', payload: languageCode })
      languageStorage.setLanguage(languageCode)
    }
  }

  return (
    <div className="language-selector">
      <select 
        value={currentLanguage} 
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="language-select"
        aria-label="Select Language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default LanguageSelector