import { useTranslation } from 'react-i18next'

function Loading() {
  const { t } = useTranslation()

  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>{t('messages.loading')}</p>
    </div>
  )
}

export default Loading