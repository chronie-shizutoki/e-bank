const { v4: uuidv4 } = require('uuid');
const { dbAsync } = require('../config/database');

/**
 * 汇率服务
 * 负责处理汇率数据的存储和检索
 */
class ExchangeRateService {
  constructor() {
    // 汇率表名称
    this.tableName = 'exchange_rates';
  }

  /**
   * 保存汇率记录
   * @param {number} rate - 汇率值（1美元兑换的本地货币数量）
   * @param {Date|string} [createdAt] - 可选的创建时间，默认为当前时间
   * @returns {Promise<Object>} 保存结果
   */
  async saveRate(rate, createdAt = null) {
    try {
      // 验证汇率值
      if (typeof rate !== 'number' || rate < 0) {
        throw new Error('Invalid exchange rate value, must be a positive number');
      }

      // 生成UUID作为ID
      const id = uuidv4();
      // 如果没有提供创建时间，使用当前时间
      let createdTime = new Date().toISOString();
      if (createdAt) {
        createdTime = createdAt instanceof Date ? createdAt.toISOString() : createdAt;
      }

      // 插入数据库
      await dbAsync.run(
        `INSERT INTO ${this.tableName} (id, rate, created_at) VALUES (?, ?, ?)`,
        [id, rate, createdTime]
      );

      console.log(`Successfully saved exchange rate record: 1 USD = ${rate} local currency`);

      return {
        success: true,
        id,
        rate,
        createdAt: createdTime
      };
    } catch (error) {
      console.error('Error saving exchange rate record:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 获取最新的汇率记录
   * @returns {Promise<Object|null>} 最新的汇率记录或null
   */
  async getLatestRate() {
    try {
      const rate = await dbAsync.get(
        `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT 1`
      );
      return rate;
    } catch (error) {
      console.error('获取最新汇率记录时出错:', error);
      return null;
    }
  }

  /**
   * 获取所有汇率记录
   * @param {number} limit - 限制返回的记录数量，默认为100
   * @returns {Promise<Array>} 汇率记录数组
   */
  async getAllRates(limit = 100) {
    try {
      const rates = await dbAsync.all(
        `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT ?`,
        [limit]
      );
      return rates;
    } catch (error) {
      console.error('获取所有汇率记录时出错:', error);
      return [];
    }
  }

  /**
   * 删除指定日期之前的汇率记录
   * @param {Date} date - 删除此日期之前的记录
   * @returns {Promise<Object>} 删除结果
   */
  async deleteRatesBeforeDate(date) {
    try {
      if (!(date instanceof Date)) {
        throw new Error('无效的日期对象');
      }

      const result = await dbAsync.run(
        `DELETE FROM ${this.tableName} WHERE created_at < ?`,
        [date.toISOString()]
      );

      console.log(`成功删除了 ${result.changes} 条汇率记录`);

      return {
        success: true,
        deletedCount: result.changes
      };
    } catch (error) {
      console.error('删除汇率记录时出错:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 确保汇率表存在
   * @returns {Promise<boolean>} 表是否存在或创建成功
   */
  async ensureTableExists() {
    try {
      // 检查表是否存在
      const tableExists = await dbAsync.get(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='${this.tableName}'`
      );

      // 如果表不存在，创建表
      if (!tableExists) {
        await dbAsync.run(
          `CREATE TABLE IF NOT EXISTS ${this.tableName} (
            id TEXT PRIMARY KEY,
            rate REAL NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          )`
        );
        console.log(`创建汇率表 ${this.tableName} 成功`);
      }

      return true;
    } catch (error) {
      console.error('确保汇率表存在时出错:', error);
      return false;
    }
  }
}

// 创建单例实例
const exchangeRateService = new ExchangeRateService();

module.exports = exchangeRateService;