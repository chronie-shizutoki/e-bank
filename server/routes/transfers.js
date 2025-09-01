const express = require('express');
const router = express.Router();
const { dbAsync } = require('../config/database');
const WalletRepository = require('../repositories/WalletRepository');
const TransactionRepository = require('../repositories/TransactionRepository');

const walletRepo = new WalletRepository();
const transactionRepo = new TransactionRepository();

// 转账输入验证中间件
const validateTransfer = (req, res, next) => {
  const { fromWalletId, toWalletId, amount } = req.body;
  
  if (!fromWalletId || typeof fromWalletId !== 'string') {
    return res.status(400).json({
      success: false,
      error: '发送方钱包ID是必需的'
    });
  }
  
  if (!toWalletId || typeof toWalletId !== 'string') {
    return res.status(400).json({
      success: false,
      error: '接收方钱包ID是必需的'
    });
  }
  
  if (fromWalletId === toWalletId) {
    return res.status(400).json({
      success: false,
      error: '不能向自己转账'
    });
  }
  
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: '转账金额必须是大于0的数字'
    });
  }
  
  // 检查金额精度（最多2位小数）
  if (Math.round(amount * 100) !== amount * 100) {
    return res.status(400).json({
      success: false,
      error: '转账金额最多支持2位小数'
    });
  }
  
  next();
};

// 执行转账
router.post('/', validateTransfer, async (req, res) => {
  await executeTransfer(req, res);
});

// 根据用户名转账（便捷接口）
router.post('/by-username', async (req, res) => {
  try {
    const { fromUsername, toUsername, amount, description = '' } = req.body;
    
    // 输入验证
    if (!fromUsername || typeof fromUsername !== 'string') {
      return res.status(400).json({
        success: false,
        error: '发送方用户名是必需的'
      });
    }
    
    if (!toUsername || typeof toUsername !== 'string') {
      return res.status(400).json({
        success: false,
        error: '接收方用户名是必需的'
      });
    }
    
    if (fromUsername === toUsername) {
      return res.status(400).json({
        success: false,
        error: '不能向自己转账'
      });
    }
    
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: '转账金额必须是大于0的数字'
      });
    }
    
    // 查找钱包
    const fromWallet = await walletRepo.findByUsername(fromUsername);
    if (!fromWallet) {
      return res.status(404).json({
        success: false,
        error: '发送方用户不存在'
      });
    }
    
    const toWallet = await walletRepo.findByUsername(toUsername);
    if (!toWallet) {
      return res.status(404).json({
        success: false,
        error: '接收方用户不存在'
      });
    }
    
    // 执行转账逻辑（复用主转账逻辑）
    const transferData = {
      fromWalletId: fromWallet.id,
      toWalletId: toWallet.id,
      amount,
      description
    };
    
    // 创建新的请求对象来复用验证和转账逻辑
    const mockReq = { body: transferData };
    const mockRes = res;
    
    // 验证转账数据
    validateTransfer(mockReq, mockRes, async () => {
      // 执行转账逻辑
      await executeTransfer(mockReq, mockRes);
    });
    
  } catch (error) {
    console.error('用户名转账错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '转账失败'
    });
  }
});

// 提取转账执行逻辑为独立函数
async function executeTransfer(req, res) {
  try {
    const { fromWalletId, toWalletId, amount, description = '' } = req.body;
    
    // 开始数据库事务
    await dbAsync.beginTransaction();
    
    try {
      // 验证发送方钱包存在
      const fromWallet = await walletRepo.findById(fromWalletId);
      if (!fromWallet) {
        await dbAsync.rollback();
        return res.status(404).json({
          success: false,
          error: '发送方钱包不存在'
        });
      }
      
      // 验证接收方钱包存在
      const toWallet = await walletRepo.findById(toWalletId);
      if (!toWallet) {
        await dbAsync.rollback();
        return res.status(404).json({
          success: false,
          error: '接收方钱包不存在'
        });
      }
      
      // 检查余额是否足够
      if (parseFloat(fromWallet.balance) < amount) {
        await dbAsync.rollback();
        return res.status(400).json({
          success: false,
          error: '余额不足',
          currentBalance: parseFloat(fromWallet.balance),
          requestedAmount: amount
        });
      }
      
      // 更新发送方余额
      const newFromBalance = parseFloat(fromWallet.balance) - amount;
      await walletRepo.updateBalance(fromWalletId, newFromBalance);
      
      // 更新接收方余额
      const newToBalance = parseFloat(toWallet.balance) + amount;
      await walletRepo.updateBalance(toWalletId, newToBalance);
      
      // 创建交易记录
      const transaction = await transactionRepo.create({
        fromWalletId,
        toWalletId,
        amount,
        transactionType: 'transfer',
        description: description || `从 ${fromWallet.username} 转账到 ${toWallet.username}`
      });
      
      // 提交事务
      await dbAsync.commit();
      
      // 获取更新后的钱包信息
      const updatedFromWallet = await walletRepo.findById(fromWalletId);
      const updatedToWallet = await walletRepo.findById(toWalletId);
      
      res.status(201).json({
        success: true,
        transaction: {
          id: transaction.id,
          fromWalletId: transaction.from_wallet_id,
          toWalletId: transaction.to_wallet_id,
          amount: parseFloat(transaction.amount),
          transactionType: transaction.transaction_type,
          description: transaction.description,
          createdAt: transaction.created_at
        },
        fromWallet: {
          id: updatedFromWallet.id,
          username: updatedFromWallet.username,
          balance: parseFloat(updatedFromWallet.balance)
        },
        toWallet: {
          id: updatedToWallet.id,
          username: updatedToWallet.username,
          balance: parseFloat(updatedToWallet.balance)
        }
      });
      
    } catch (error) {
      // 回滚事务
      await dbAsync.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('转账错误:', error);
    
    // 处理特定错误类型
    if (error.message.includes('余额不足')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('钱包不存在')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || '转账失败'
    });
  }
}

module.exports = router;