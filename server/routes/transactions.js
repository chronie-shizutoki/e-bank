const express = require('express');
const router = express.Router();
const TransactionRepository = require('../repositories/TransactionRepository');

const transactionRepo = new TransactionRepository();

// 获取单个交易详情
router.get('/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!transactionId || typeof transactionId !== 'string') {
      return res.status(400).json({
        success: false,
        error: '交易ID是必需的'
      });
    }
    
    const transaction = await transactionRepo.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: '交易不存在'
      });
    }
    
    res.json({
      success: true,
      transaction: {
        id: transaction.id,
        fromWalletId: transaction.from_wallet_id,
        toWalletId: transaction.to_wallet_id,
        amount: parseFloat(transaction.amount),
        transactionType: transaction.transaction_type,
        description: transaction.description,
        createdAt: transaction.created_at,
        fromUsername: transaction.from_username,
        toUsername: transaction.to_username
      }
    });
    
  } catch (error) {
    console.error('获取交易详情错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取交易详情失败'
    });
  }
});

// 获取所有交易记录（管理员功能）
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    
    // 验证分页参数
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: '页码必须是大于0的整数'
      });
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: '每页数量必须是1-100之间的整数'
      });
    }
    
    const offset = (pageNum - 1) * limitNum;
    const transactions = await transactionRepo.findAll({ limit: limitNum, offset, type });
    const totalCount = await transactionRepo.count(type);
    
    // 格式化交易记录
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      fromWalletId: transaction.from_wallet_id,
      toWalletId: transaction.to_wallet_id,
      amount: parseFloat(transaction.amount),
      transactionType: transaction.transaction_type,
      description: transaction.description,
      createdAt: transaction.created_at,
      fromUsername: transaction.from_username,
      toUsername: transaction.to_username
    }));
    
    const totalPages = Math.ceil(totalCount / limitNum);
    
    res.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalTransactions: totalCount,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      }
    });
    
  } catch (error) {
    console.error('获取交易记录错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取交易记录失败'
    });
  }
});

module.exports = router;