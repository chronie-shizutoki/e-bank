const { dbAsync } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * 交易数据访问层
 * 提供交易相关的数据库操作方法
 */
class TransactionRepository {
  
  /**
   * 创建新交易记录
   * @param {Object} transactionData - 交易数据
   * @param {string|null} transactionData.fromWalletId - 发送方钱包ID
   * @param {string|null} transactionData.toWalletId - 接收方钱包ID
   * @param {number} transactionData.amount - 交易金额
   * @param {string} transactionData.transactionType - 交易类型
   * @param {string} transactionData.description - 交易描述
   * @returns {Promise<Object>} 创建的交易对象
   */
  async create(transactionData) {
    const {
      fromWalletId,
      toWalletId,
      amount,
      transactionType,
      description = ''
    } = transactionData;
    
    // 验证交易类型
    const validTypes = ['transfer', 'initial_deposit', 'interest_credit', 'interest_debit'];
    if (!validTypes.includes(transactionType)) {
      throw new Error('无效的交易类型');
    }
    
    // 验证金额
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('交易金额必须大于0');
    }
    
    const id = uuidv4();
    const now = new Date().toISOString();
    
    try {
      await dbAsync.run(
        `INSERT INTO transactions (id, from_wallet_id, to_wallet_id, amount, transaction_type, description, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, fromWalletId, toWalletId, amount, transactionType, description, now]
      );
      
      return await this.findById(id);
    } catch (error) {
      throw new Error(`创建交易记录失败: ${error.message}`);
    }
  }

  /**
   * 根据ID查找交易
   * @param {string} id - 交易ID
   * @returns {Promise<Object|null>} 交易对象或null
   */
  async findById(id) {
    try {
      const transaction = await dbAsync.get(
        `SELECT t.*, 
                fw.username as from_username,
                tw.username as to_username
         FROM transactions t
         LEFT JOIN wallets fw ON t.from_wallet_id = fw.id
         LEFT JOIN wallets tw ON t.to_wallet_id = tw.id
         WHERE t.id = ?`,
        [id]
      );
      return transaction || null;
    } catch (error) {
      throw new Error(`查找交易失败: ${error.message}`);
    }
  }

  /**
   * 根据钱包ID查找交易记录
   * @param {string} walletId - 钱包ID
   * @param {Object} options - 查询选项
   * @param {number} options.limit - 限制数量
   * @param {number} options.offset - 偏移量
   * @param {string} options.type - 交易类型过滤
   * @returns {Promise<Array>} 交易列表
   */
  async findByWalletId(walletId, options = {}) {
    const { limit = 20, offset = 0, type } = options;
    
    let sql = `
      SELECT t.*, 
             fw.username as from_username,
             tw.username as to_username
      FROM transactions t
      LEFT JOIN wallets fw ON t.from_wallet_id = fw.id
      LEFT JOIN wallets tw ON t.to_wallet_id = tw.id
      WHERE (t.from_wallet_id = ? OR t.to_wallet_id = ?)
    `;
    
    const params = [walletId, walletId];
    
    if (type) {
      sql += ' AND t.transaction_type = ?';
      params.push(type);
    }
    
    sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    try {
      const transactions = await dbAsync.all(sql, params);
      return transactions;
    } catch (error) {
      throw new Error(`获取交易记录失败: ${error.message}`);
    }
  }

  /**
   * 获取所有交易记录
   * @param {Object} options - 查询选项
   * @param {number} options.limit - 限制数量
   * @param {number} options.offset - 偏移量
   * @param {string} options.type - 交易类型过滤
   * @returns {Promise<Array>} 交易列表
   */
  async findAll(options = {}) {
    const { limit = 50, offset = 0, type } = options;
    
    let sql = `
      SELECT t.*, 
             fw.username as from_username,
             tw.username as to_username
      FROM transactions t
      LEFT JOIN wallets fw ON t.from_wallet_id = fw.id
      LEFT JOIN wallets tw ON t.to_wallet_id = tw.id
    `;
    
    const params = [];
    
    if (type) {
      sql += ' WHERE t.transaction_type = ?';
      params.push(type);
    }
    
    sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    try {
      const transactions = await dbAsync.all(sql, params);
      return transactions;
    } catch (error) {
      throw new Error(`获取交易记录失败: ${error.message}`);
    }
  }

  /**
   * 统计钱包的交易数量
   * @param {string} walletId - 钱包ID
   * @param {string} type - 交易类型过滤（可选）
   * @returns {Promise<number>} 交易数量
   */
  async countByWalletId(walletId, type = null) {
    let sql = 'SELECT COUNT(*) as count FROM transactions WHERE (from_wallet_id = ? OR to_wallet_id = ?)';
    const params = [walletId, walletId];
    
    if (type) {
      sql += ' AND transaction_type = ?';
      params.push(type);
    }
    
    try {
      const result = await dbAsync.get(sql, params);
      return result.count;
    } catch (error) {
      throw new Error(`统计交易数量失败: ${error.message}`);
    }
  }

  /**
   * 获取交易总数
   * @param {string} type - 交易类型过滤（可选）
   * @returns {Promise<number>} 交易总数
   */
  async count(type = null) {
    let sql = 'SELECT COUNT(*) as count FROM transactions';
    const params = [];
    
    if (type) {
      sql += ' WHERE transaction_type = ?';
      params.push(type);
    }
    
    try {
      const result = await dbAsync.get(sql, params);
      return result.count;
    } catch (error) {
      throw new Error(`获取交易总数失败: ${error.message}`);
    }
  }

  /**
   * 获取钱包的交易统计信息
   * @param {string} walletId - 钱包ID
   * @returns {Promise<Object>} 统计信息
   */
  async getWalletStats(walletId) {
    try {
      // 总交易数
      const totalCount = await this.countByWalletId(walletId);
      
      // 转账交易数
      const transferCount = await this.countByWalletId(walletId, 'transfer');
      
      // 初始存款交易数
      const depositCount = await this.countByWalletId(walletId, 'initial_deposit');
      
      // 发送的交易总额
      const sentResult = await dbAsync.get(
        'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE from_wallet_id = ?',
        [walletId]
      );
      
      // 接收的交易总额
      const receivedResult = await dbAsync.get(
        'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE to_wallet_id = ?',
        [walletId]
      );
      
      return {
        totalTransactions: totalCount,
        transferTransactions: transferCount,
        depositTransactions: depositCount,
        totalSent: sentResult.total,
        totalReceived: receivedResult.total
      };
    } catch (error) {
      throw new Error(`获取交易统计失败: ${error.message}`);
    }
  }

  /**
   * 获取指定时间范围内的交易
   * @param {string} walletId - 钱包ID
   * @param {string} startDate - 开始日期（ISO字符串）
   * @param {string} endDate - 结束日期（ISO字符串）
   * @returns {Promise<Array>} 交易列表
   */
  async findByDateRange(walletId, startDate, endDate) {
    try {
      const transactions = await dbAsync.all(
        `SELECT t.*, 
                fw.username as from_username,
                tw.username as to_username
         FROM transactions t
         LEFT JOIN wallets fw ON t.from_wallet_id = fw.id
         LEFT JOIN wallets tw ON t.to_wallet_id = tw.id
         WHERE (t.from_wallet_id = ? OR t.to_wallet_id = ?)
           AND t.created_at >= ? AND t.created_at <= ?
         ORDER BY t.created_at DESC`,
        [walletId, walletId, startDate, endDate]
      );
      return transactions;
    } catch (error) {
      throw new Error(`获取时间范围交易失败: ${error.message}`);
    }
  }

  /**
   * 删除交易记录（谨慎使用）
   * @param {string} id - 交易ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    try {
      const result = await dbAsync.run(
        'DELETE FROM transactions WHERE id = ?',
        [id]
      );
      return result.changes > 0;
    } catch (error) {
      throw new Error(`删除交易记录失败: ${error.message}`);
    }
  }

  /**
   * 创建转账交易记录
   * @param {string} fromWalletId - 发送方钱包ID
   * @param {string} toWalletId - 接收方钱包ID
   * @param {number} amount - 转账金额
   * @param {string} description - 交易描述
   * @returns {Promise<Object>} 创建的交易对象
   */
  async createTransfer(fromWalletId, toWalletId, amount, description = '') {
    return await this.create({
      fromWalletId,
      toWalletId,
      amount,
      transactionType: 'transfer',
      description
    });
  }

  /**
   * 创建初始存款交易记录
   * @param {string} toWalletId - 接收方钱包ID
   * @param {number} amount - 存款金额
   * @param {string} description - 交易描述
   * @returns {Promise<Object>} 创建的交易对象
   */
  async createInitialDeposit(toWalletId, amount, description = '初始存款') {
    return await this.create({
      fromWalletId: null,
      toWalletId,
      amount,
      transactionType: 'initial_deposit',
      description
    });
  }

  /**
   * 创建利息收入交易记录
   * @param {string} toWalletId - 接收方钱包ID
   * @param {number} amount - 利息金额
   * @param {string} description - 交易描述
   * @returns {Promise<Object>} 创建的交易对象
   */
  async createInterestCredit(toWalletId, amount, description = '利息收入') {
    return await this.create({
      fromWalletId: null,
      toWalletId,
      amount,
      transactionType: 'interest_credit',
      description
    });
  }

  /**
   * 创建利息支出交易记录
   * @param {string} toWalletId - 接收方钱包ID
   * @param {number} amount - 利息金额
   * @param {string} description - 交易描述
   * @returns {Promise<Object>} 创建的交易对象
   */
  async createInterestDebit(toWalletId, amount, description = '利息支出') {
    return await this.create({
      fromWalletId: null,
      toWalletId,
      amount,
      transactionType: 'interest_debit',
      description
    });
  }
}

module.exports = TransactionRepository;