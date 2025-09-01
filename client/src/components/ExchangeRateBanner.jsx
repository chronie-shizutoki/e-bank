import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormatting } from '../hooks/useFormatting'

function ExchangeRateBanner() {
  const { t } = useTranslation()
  const { formatNumber } = useFormatting()
  
  // 生成随机汇率（1美元=200~10000此货币）
  const generateRandomRate = () => {
    const min = 200
    const max = 10000
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  const [exchangeRate, setExchangeRate] = useState(generateRandomRate())
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // 初始化汇率并设置每小时更新
  useEffect(() => {
    const updateRate = () => {
      setExchangeRate(generateRandomRate())
      setLastUpdated(new Date())
    }

    // 设置定时器，每小时更新一次汇率
    const intervalId = setInterval(updateRate, 60 * 60 * 1000) // 1小时 = 60分钟 * 60秒 * 1000毫秒
    
    // 清理函数
    return () => clearInterval(intervalId)
  }, [])

  // 格式化更新时间
  const formatUpdateTime = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  // 格式化汇率数字，使用当前语言的数字格式化规则
  const formattedRate = formatNumber(exchangeRate)

  return (
    <div className="exchange-rate-banner">
      <div className="exchange-rate-content">
        <div className="exchange-rate-title">{t('exchangeRate.title')}</div>
        <div className="exchange-rate-value">
          {t('exchangeRate.rate', { rate: formattedRate })}
        </div>
        <div className="exchange-rate-update-time">
          {t('exchangeRate.lastUpdated', { time: formatUpdateTime(lastUpdated) })}
        </div>
      </div>
    </div>
  )
}

export default ExchangeRateBanner