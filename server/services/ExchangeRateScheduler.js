const schedule = require('node-schedule');
const exchangeRateService = require('./ExchangeRateService');

/**
 * 汇率调度器
 * 负责每小时生成和保存随机汇率
 */
class ExchangeRateScheduler {
  constructor() {
    this.job = null;
    // Exchange rate range: 1 USD = 2000-3000 local currency. Adjusted to a more reasonable range.
    this.minRate = 1500;
    this.maxRate = 2500;
  }

  /**
   * 生成随机汇率
   * @returns {number} 随机生成的汇率值
   */
  generateRandomRate() {
    return Math.floor(Math.random() * (this.maxRate - this.minRate + 1)) + this.minRate;
  }

  /**
   * 启动汇率调度器
   * 设置每小时执行一次汇率生成和保存
   */
  async start() {
    try {
      // 确保汇率表存在
      const tableCreated = await exchangeRateService.ensureTableExists();
      if (!tableCreated) {
        throw new Error('创建汇率表失败');
      }

      console.log('启动汇率调度器...');
      
      // 每小时执行一次任务
      // 格式: '秒 分 时 日 月 星期'
      // 0 0 * * * * 表示每小时0分0秒执行
      this.job = schedule.scheduleJob('0 0 * * * *', async () => {
        console.log(`[${new Date().toISOString()}] 执行汇率生成任务`);
        
        try {
          const randomRate = this.generateRandomRate();
          const result = await exchangeRateService.saveRate(randomRate);
          
          if (result.success) {
            console.log(`[${new Date().toISOString()}] 汇率生成并保存成功: 1美元 = ${randomRate} 本地货币`);
          } else {
            console.error(`[${new Date().toISOString()}] 保存汇率失败:`, result.message);
          }
        } catch (error) {
          console.error(`[${new Date().toISOString()}] 汇率生成任务发生异常:`, error);
        }
      });
      
      console.log('汇率调度器已启动，将每小时生成并保存随机汇率');
      console.log('下次执行时间:', this.job.nextInvocation());
      
      // 立即生成并保存一次汇率（初始化）
      await this.executeNow();
      
      return { success: true };
    } catch (error) {
      console.error('启动汇率调度器失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 停止汇率调度器
   */
  stop() {
    if (this.job) {
      this.job.cancel();
      this.job = null;
      console.log('汇率调度器已停止');
    } else {
      console.log('汇率调度器未运行');
    }
  }

  /**
   * 立即执行一次汇率生成和保存
   * @returns {Promise<Object>} 执行结果
   */
  async executeNow() {
    console.log('手动触发汇率生成...');
    
    try {
      const randomRate = this.generateRandomRate();
      const result = await exchangeRateService.saveRate(randomRate);
      
      if (result.success) {
        console.log(`手动生成汇率成功: 1美元 = ${randomRate} 本地货币`);
      }
      
      return result;
    } catch (error) {
      console.error('手动生成汇率时出错:', error);
      return { success: false, message: error.message };
    }
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
const exchangeRateScheduler = new ExchangeRateScheduler();

module.exports = exchangeRateScheduler;