const express = require('express');
const router = express.Router();
const interestScheduler = require('../services/InterestScheduler');

/**
 * 利息相关API路由
 */

/**
 * 手动触发利息计算（仅限管理员使用）
 */
router.post('/process', async (req, res) => {
  try {
    // 在实际应用中，这里应该有管理员身份验证
    
    console.log('手动触发利息计算请求');
    const result = await interestScheduler.executeNow();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: '利息计算已成功执行',
        data: {
          processedCount: result.processedCount,
          totalInterest: result.totalInterest
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || '利息计算执行失败'
      });
    }
  } catch (error) {
    console.error('手动触发利息计算时出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    });
  }
});

/**
 * 获取利息调度器状态
 */
router.get('/status', async (req, res) => {
  try {
    const nextExecutionTime = interestScheduler.getNextExecutionTime();
    
    res.status(200).json({
      success: true,
      data: {
        isRunning: !!nextExecutionTime,
        nextExecutionTime: nextExecutionTime ? nextExecutionTime.toISOString() : null,
        timezone: 'UTC'
      }
    });
  } catch (error) {
    console.error('获取利息调度器状态时出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器内部错误'
    });
  }
});

module.exports = router;