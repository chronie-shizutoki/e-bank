import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'
import jaJP from './locales/ja-JP.json'
import enUS from './locales/en-US.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'zh-TW': { translation: zhTW },
      'ja-JP': { translation: jaJP },
      'en-US': { translation: enUS }
    },
    fallbackLng: 'zh-CN',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
      format: function(value, format, lng) {
        if (format === 'currency') {
          return formatCurrency(value, lng)
        }
        if (format === 'number') {
          return formatNumber(value, lng)
        }
        return value
      }
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language'
    }
  })

// Currency formatting based on language
function formatCurrency(value, language) {
  const formatters = {
    'zh-CN': new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }),
    'zh-TW': new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD' }),
    'ja-JP': new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
    'en-US': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
  }
  
  const formatter = formatters[language] || formatters['zh-CN']
  return formatter.format(value)
}

// Number formatting based on language
function formatNumber(value, language) {
  const formatters = {
    'zh-CN': new Intl.NumberFormat('zh-CN'),
    'zh-TW': new Intl.NumberFormat('zh-TW'),
    'ja-JP': new Intl.NumberFormat('ja-JP'),
    'en-US': new Intl.NumberFormat('en-US')
  }
  
  const formatter = formatters[language] || formatters['zh-CN']
  return formatter.format(value)
}

export default i18n