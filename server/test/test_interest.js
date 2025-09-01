const interestScheduler = require('../services/InterestScheduler');
const { dbAsync } = require('../config/database');

/**
 * 测试利息发放功能
 */
async function testInterestCalculation() {
  try {
    console.log('连接到SQLite数据库');
    
    // 确保数据库已初始化
    const checkDb = await dbAsync.get('SELECT name FROM sqlite_master WHERE type="table" AND name="wallets"');
    if (!checkDb) {
      console.error('错误: 数据库表未初始化');
      process.exit(1);
    }
    
    // 检查是否有钱包数据
    const wallets = await dbAsync.all('SELECT * FROM wallets LIMIT 5');
    console.log(`找到 ${wallets.length} 个钱包`);
    if (wallets.length > 0) {
      console.log('示例钱包数据:', wallets[0]);
    }
    
    // 手动触发利息计算
    console.log('开始手动触发利息计算...');
    const result = await interestScheduler.executeNow();
    
    console.log('利息计算结果:', result);
    
    if (result.success) {
      console.log(`成功处理 ${result.processedCount} 个钱包，总利息 ${result.totalInterest.toFixed(2)}`);
    } else {
      console.error('利息计算失败:', result.message);
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  } finally {
    // 关闭数据库连接
    process.exit(0);
  }
}

testInterestCalculation();