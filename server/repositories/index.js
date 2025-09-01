/**
 * Repository模块导出
 * 提供统一的数据访问层接口
 */

const WalletRepository = require('./WalletRepository');
const TransactionRepository = require('./TransactionRepository');

// 创建Repository实例
const walletRepository = new WalletRepository();
const transactionRepository = new TransactionRepository();

/**
 * 数据库服务类
 * 提供统一的数据库操作接口
 */
class DatabaseService {
  constructor() {
    this.wallets = walletRepository;
    this.transactions = transactionRepository;
  }

  /**
   * 执行完整的转账操作（包含事务）
   * @param {string} fromWalletId - 发送方钱包ID
   * @param {string} toWalletId - 接收方钱包ID
   * @param {number} amount - 转账金额
   * @param {string} description - 交易描述
   * @returns {Promise<Object>} 转账结果
   */
  async executeTransfer(fromWalletId, toWalletId, amount, description = '') {
    try {
      // 执行钱包余额更新（包含事务）
      const transferResult = await this.wallets.transfer(fromWalletId, toWalletId, amount);
      
      // 创建交易记录
      const transaction = await this.transactions.createTransfer(
        fromWalletId, 
        toWalletId, 
        amount, 
        description
      );
      
      return {
        success: true,
        transaction,
        fromWallet: transferResult.fromWallet,
        toWallet: transferResult.toWallet
      };
    } catch (error) {
      throw new Error(`转账操作失败: ${error.message}`);
    }
  }

  /**
   * 创建钱包并记录初始存款
   * @param {string} username - 用户名
   * @param {number} initialBalance - 初始余额
   * @returns {Promise<Object>} 创建结果
   */
  async createWalletWithInitialDeposit(username, initialBalance = 0) {
    try {
      // 创建钱包
      const wallet = await this.wallets.create({ username, balance: initialBalance });
      
      // 如果有初始余额，创建初始存款记录
      let transaction = null;
      if (initialBalance > 0) {
        transaction = await this.transactions.createInitialDeposit(
          wallet.id, 
          initialBalance, 
          '账户初始化存款'
        );
      }
      
      return {
        success: true,
        wallet,
        transaction
      };
    } catch (error) {
      throw new Error(`创建钱包失败: ${error.message}`);
    }
  }

  /**
   * 获取钱包详细信息（包含统计数据）
   * @param {string} walletId - 钱包ID
   * @returns {Promise<Object>} 钱包详细信息
   */
  async getWalletDetails(walletId) {
    try {
      const wallet = await this.wallets.findById(walletId);
      if (!wallet) {
        throw new Error('钱包不存在');
      }
      
      const stats = await this.transactions.getWalletStats(walletId);
      
      return {
        ...wallet,
        stats
      };
    } catch (error) {
      throw new Error(`获取钱包详情失败: ${error.message}`);
    }
  }

  /**
   * 获取钱包交易历史（分页）
   * @param {string} walletId - 钱包ID
   * @param {number} page - 页码（从1开始）
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Object>} 分页交易数据
   */
  async getWalletTransactionHistory(walletId, page = 1, pageSize = 20) {
    try {
      const offset = (page - 1) * pageSize;
      const transactions = await this.transactions.findByWalletId(walletId, {
        limit: pageSize,
        offset
      });
      
      const totalCount = await this.transactions.countByWalletId(walletId);
      const totalPages = Math.ceil(totalCount / pageSize);
      
      return {
        transactions,
        pagination: {
          currentPage: page,
          pageSize,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`获取交易历史失败: ${error.message}`);
    }
  }
}

// 创建数据库服务实例
const databaseService = new DatabaseService();

module.exports = {
  WalletRepository,
  TransactionRepository,
  DatabaseService,
  walletRepository,
  transactionRepository,
  databaseService
};