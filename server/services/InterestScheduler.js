const schedule = require('node-schedule');
const InterestService = require('./InterestService');

/**
 * 利息调度器
 * 负责安排和管理每日利息计算任务
 */
class InterestScheduler {
  constructor() {
    this.interestService = new InterestService();
    this.job = null;
  }

  /**
   * 启动利息调度器
   * 设置每天 UTC+0 12:00 执行一次利息计算
   */
  async start() {
    try {
      // 确保利息交易类型已配置
      await this.interestService.ensureInterestTransactionTypes();
      
      console.log('启动利息调度器...');
      
      // 每天 UTC+0 12:00 执行任务
      // 格式: '秒 分 时 日 月 星期'
      // 0 0 12 * * * 表示每天12:00:00执行
      this.job = schedule.scheduleJob('0 0 12 * * *', async () => {
        console.log(`[${new Date().toISOString()}] 执行每日利息计算任务`);
        
        try {
          const result = await this.interestService.processDailyInterest();
          if (result.success) {
            console.log(`[${new Date().toISOString()}] 利息计算任务执行成功:`, result);
          } else {
            console.error(`[${new Date().toISOString()}] 利息计算任务执行失败:`, result.message);
          }
        } catch (error) {
          console.error(`[${new Date().toISOString()}] 利息计算任务发生异常:`, error);
        }
      });
      
      console.log('利息调度器已启动，将在每天 UTC+0 12:00 执行利息计算');
      console.log('下次执行时间:', this.job.nextInvocation());
      
      return { success: true };
    } catch (error) {
      console.error('启动利息调度器失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 停止利息调度器
   */
  stop() {
    if (this.job) {
      this.job.cancel();
      this.job = null;
      console.log('利息调度器已停止');
    } else {
      console.log('利息调度器未运行');
    }
  }

  /**
   * 立即执行一次利息计算（用于测试或手动触发）
   * @returns {Promise<Object>} 执行结果
   */
  async executeNow() {
    console.log('手动触发利息计算...');
    return await this.interestService.processDailyInterest();
  }

  /**
   * 获取下一次执行时间
   * @returns {Date|null} 下一次执行时间
   */
  getNextExecutionTime() {
    if (this.job) {
      return this.job.nextInvocation();
    }
    return null;
  }
}

// 创建单例实例
const interestScheduler = new InterestScheduler();

module.exports = interestScheduler;