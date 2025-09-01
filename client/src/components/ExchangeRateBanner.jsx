import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormatting } from '../hooks/useFormatting'

function ExchangeRateBanner() {
  const { t } = useTranslation()
  const { formatNumber } = useFormatting()
  
  const [exchangeRate, setExchangeRate] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // 从服务器获取最新汇率
  const fetchExchangeRate = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/exchange-rates/latest')
      const data = await response.json()
      
      if (data.success && data.data) {
        setExchangeRate(data.data.rate)
        setLastUpdated(new Date(data.data.created_at))
      } else {
        throw new Error(data.message || '获取汇率失败')
      }
    } catch (err) {
      console.error('获取汇率时出错:', err)
      setError(err.message || '无法获取汇率数据')
      
      setExchangeRate(generateRandomRate())
      setLastUpdated(new Date())
    } finally {
      setIsLoading(false)
    }
  }

  // 初始化汇率并设置每小时更新
  useEffect(() => {
    // 初始获取汇率
    fetchExchangeRate()

    // 设置定时器，每小时更新一次汇率
    const intervalId = setInterval(fetchExchangeRate, 60 * 60 * 1000) // 1小时 = 60分钟 * 60秒 * 1000毫秒
    
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
  const formattedRate = exchangeRate ? formatNumber(exchangeRate) : '0'

  return (
    <div className={`exchange-rate-banner ${isLoading ? 'loading' : ''} ${error ? 'error' : ''}`}>
      <div className="exchange-rate-content">
        <div className="exchange-rate-title">{t('exchangeRate.title')}</div>
        
        {isLoading ? (
          <div className="exchange-rate-loading">
            正在加载汇率...
          </div>
        ) : error ? (
          <div className="exchange-rate-error">
            {error}
          </div>
        ) : (
          <>
            <div className="exchange-rate-value">
              {t('exchangeRate.rate', { rate: formattedRate })}
            </div>
            <div className="exchange-rate-update-time">
              {t('exchangeRate.lastUpdated', { time: formatUpdateTime(lastUpdated) })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ExchangeRateBanner