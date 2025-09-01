const express = require('express');
const router = express.Router();
const exchangeRateService = require('../services/ExchangeRateService');

/**
 * @route   GET /api/exchange-rates/latest
 * @desc    获取最新的汇率记录
 * @access  Public
 */
router.get('/latest', async (req, res) => {
  try {
    const latestRate = await exchangeRateService.getLatestRate();
    
    if (latestRate) {
      res.status(200).json({
        success: true,
        data: latestRate
      });
    } else {
      res.status(404).json({
        success: false,
        message: '没有找到汇率记录'
      });
    }
  } catch (error) {
    console.error('获取最新汇率时出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * @route   GET /api/exchange-rates
 * @desc    获取汇率记录列表
 * @access  Public
 * @query   {number} limit - 限制返回的记录数量（可选，默认为100）
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const rates = await exchangeRateService.getAllRates(limit);
    
    res.status(200).json({
      success: true,
      data: rates,
      count: rates.length
    });
  } catch (error) {
    console.error('获取汇率列表时出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * @route   POST /api/exchange-rates/refresh
 * @desc    手动刷新汇率（生成新的随机汇率并保存）
 * @access  Admin/Public (根据实际需求调整权限)
 */
router.post('/refresh', async (req, res) => {
  try {
    const exchangeRateScheduler = require('../services/ExchangeRateScheduler');
    const result = await exchangeRateScheduler.executeNow();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: '汇率已成功刷新',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || '刷新汇率失败'
      });
    }
  } catch (error) {
    console.error('刷新汇率时出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * @route   DELETE /api/exchange-rates/cleanup
 * @desc    清理旧的汇率记录
 * @access  Admin
 * @body    {string} beforeDate - 删除此日期之前的记录 (ISO格式字符串)
 */
router.delete('/cleanup', async (req, res) => {
  try {
    // 注意：在实际应用中，应该添加管理员权限检查
    
    const { beforeDate } = req.body;
    
    if (!beforeDate) {
      return res.status(400).json({
        success: false,
        message: '必须提供清理日期'
      });
    }
    
    const date = new Date(beforeDate);
    
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: '无效的日期格式'
      });
    }
    
    const result = await exchangeRateService.deleteRatesBeforeDate(date);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: `成功删除了 ${result.deletedCount} 条汇率记录`
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || '清理汇率记录失败'
      });
    }
  } catch (error) {
    console.error('清理汇率记录时出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;