// 生成历史汇率数据脚本
// 运行此脚本来生成过去10年（到2025/9/7）的历史汇率数据

const exchangeRateScheduler = require('./services/ExchangeRateScheduler');

async function main() {
  console.log('启动历史汇率数据生成器...');
  console.log('注意：此操作可能需要一些时间，具体取决于系统性能和数据量。');
  
  try {
    // 调用生成历史汇率数据的方法
    const result = await exchangeRateScheduler.generateHistoricalRates();
    
    if (result.success) {
      console.log('\n✅ 历史汇率数据生成完成！');
      console.log(`- 生成了 ${result.count} 条记录`);
      console.log(`- 时间范围：从 ${result.startDate} 到 ${result.endDate}`);
      console.log('\n提示：您可以通过服务器的API端点查看生成的数据。');
    } else {
      console.error('\n❌ 生成历史汇率数据失败：', result.message);
    }
  } catch (error) {
    console.error('\n❌ 执行过程中发生异常：', error);
  }
}

// 运行主函数
main();