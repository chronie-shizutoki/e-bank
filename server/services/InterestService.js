const { dbAsync } = require('../config/database');
const WalletRepository = require('../repositories/WalletRepository');
const TransactionRepository = require('../repositories/TransactionRepository');

/**
 * 利息服务
 * 负责处理每日利息计算和发放
 */
class InterestService {
  constructor() {
    this.walletRepo = new WalletRepository();
    this.transactionRepo = new TransactionRepository();
    // 默认日利率 (1% = 0.01)，一个合理的范围应该年化1%左右，即日利率0.003%~0.004%
    this.dailyInterestRate = 0.00003;
  }

  /**
   * 设置日利率
   * @param {number} rate - 日利率（例如：0.0001表示0.01%）
   */
  setDailyInterestRate(rate) {
    if (typeof rate !== 'number') {
      throw new Error('利率必须是数字');
    }
    this.dailyInterestRate = rate;
  }

  /**
   * 计算单个钱包的利息
   * @param {Object} wallet - 钱包对象
   * @returns {number} 计算的利息
   */
  calculateInterest(wallet) {
    const balance = parseFloat(wallet.balance);
    // 利息 = 余额 * 日利率
    return balance * this.dailyInterestRate;
  }

  /**
   * 处理所有钱包的每日利息
   * @returns {Promise<Object>} 处理结果
   */
  async processDailyInterest() {
    console.log('开始处理每日利息...');
    
    try {
      // 开始事务
      await dbAsync.beginTransaction();
      
      try {
        // 获取所有钱包
        const wallets = await this.walletRepo.findAll({ limit: null });
        
        if (!wallets || wallets.length === 0) {
          await dbAsync.commit();
          return {
            success: true,
            message: '没有钱包需要处理利息',
            processedCount: 0,
            totalInterest: 0
          };
        }

        let totalInterest = 0;
        let processedCount = 0;

        // 为每个钱包计算并应用利息
        for (const wallet of wallets) {
          const interest = this.calculateInterest(wallet);
          
          if (Math.abs(interest) > 0) { // 只处理有利息变动的钱包
            const newBalance = parseFloat(wallet.balance) + interest;
            
            // 更新钱包余额
            await this.walletRepo.updateBalance(wallet.id, newBalance);
            
            // 创建利息交易记录
            const description = interest > 0 
              ? `每日利息收入: ${interest.toFixed(2)}` 
              : `每日利息支出: ${Math.abs(interest).toFixed(2)}`;
            
            if (interest > 0) {
              await this.transactionRepo.createInterestCredit(
                wallet.id,
                interest,
                description
              );
            } else {
              await this.transactionRepo.createInterestDebit(
                wallet.id,
                Math.abs(interest),
                description
              );
            }
            
            totalInterest += interest;
            processedCount++;
          }
        }

        // 提交事务
        await dbAsync.commit();
        
        console.log(`每日利息处理完成: 共处理 ${processedCount} 个钱包，总利息 ${totalInterest.toFixed(2)}`);
        
        return {
          success: true,
          message: '每日利息处理成功',
          processedCount,
          totalInterest
        };
        
      } catch (error) {
        // 回滚事务
        await dbAsync.rollback();
        throw error;
      }
    } catch (error) {
      console.error('处理每日利息时出错:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * 检查并创建必要的交易类型
   * 确保transactions表支持interest_credit和interest_debit交易类型
   */
  async ensureInterestTransactionTypes() {
    // 在实际应用中，可能需要检查数据库约束或枚举类型
    // 这里简化处理，因为当前的TransactionRepository允许任何交易类型
    console.log('确保利息交易类型已配置');
  }
}

module.exports = InterestService;