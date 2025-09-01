// 测试通过用户名转账功能
const { dbAsync } = require('../config/database');
const WalletRepository = require('../repositories/WalletRepository');
const TransactionRepository = require('../repositories/TransactionRepository');

// 直接导入转账相关的模块和函数
const { validateTransfer } = require('../routes/transfers');
const executeTransfer = require('../routes/transfers').executeTransfer;

const walletRepo = new WalletRepository();
const transactionRepo = new TransactionRepository();

// 测试账号信息
const testUsers = {
  sender: {
    username: 'test_sender',
    initialBalance: 1000.00
  },
  receiver: {
    username: 'test_receiver',
    initialBalance: 500.00
  }
};

// 转账金额
const transferAmount = 200.00;

async function setupTestData() {
  console.log('正在设置测试数据...');
  
  try {
    // 开始事务
    await dbAsync.beginTransaction();
    
    // 清理测试数据
    await dbAsync.run('DELETE FROM wallets WHERE username IN (?, ?)', [
      testUsers.sender.username,
      testUsers.receiver.username
    ]);
    
    await dbAsync.run(`DELETE FROM transactions WHERE from_wallet_id IN (
      SELECT id FROM wallets WHERE username IN (?, ?)
    ) OR to_wallet_id IN (
      SELECT id FROM wallets WHERE username IN (?, ?)
    )`, [
      testUsers.sender.username,
      testUsers.receiver.username,
      testUsers.sender.username,
      testUsers.receiver.username
    ]);
    
    // 创建测试钱包
    await walletRepo.create({
      username: testUsers.sender.username,
      balance: testUsers.sender.initialBalance
    });
    
    await walletRepo.create({
      username: testUsers.receiver.username,
      balance: testUsers.receiver.initialBalance
    });
    
    // 提交事务
    await dbAsync.commit();
    
    console.log('测试数据设置完成');
    
  } catch (error) {
    await dbAsync.rollback();
    console.error('设置测试数据时出错:', error);
    throw error;
  }
}

async function testTransferByUsername() {
  console.log('\n测试通过用户名转账功能...');
  
  try {
    // 创建mock请求和响应对象
    const mockReq = {
      body: {
        fromUsername: testUsers.sender.username,
        toUsername: testUsers.receiver.username,
        amount: transferAmount,
        description: '测试通过用户名转账'
      }
    };
    
    let mockRes = {
      statusCode: 200,
      responseBody: null,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.responseBody = data;
        return this;
      }
    };
    
    // 直接调用转账执行函数
    await executeTransfer(mockReq, mockRes);
    
    // 验证转账成功
    console.log('转账响应状态码:', mockRes.statusCode);
    console.log('转账响应体:', JSON.stringify(mockRes.responseBody, null, 2));
    
    if (mockRes.statusCode === 201 && mockRes.responseBody && mockRes.responseBody.success) {
      console.log('✅ 转账请求成功');
      
      // 验证余额更新
      const senderWallet = await walletRepo.findByUsername(testUsers.sender.username);
      const receiverWallet = await walletRepo.findByUsername(testUsers.receiver.username);
      
      const expectedSenderBalance = testUsers.sender.initialBalance - transferAmount;
      const expectedReceiverBalance = testUsers.receiver.initialBalance + transferAmount;
      
      console.log(`发送方余额: ${senderWallet.balance}, 预期: ${expectedSenderBalance}`);
      console.log(`接收方余额: ${receiverWallet.balance}, 预期: ${expectedReceiverBalance}`);
      
      if (parseFloat(senderWallet.balance) === expectedSenderBalance && 
          parseFloat(receiverWallet.balance) === expectedReceiverBalance) {
        console.log('✅ 余额更新正确');
        return true;
      } else {
        console.error('❌ 余额更新错误');
        return false;
      }
    } else {
      console.error('❌ 转账请求失败');
      return false;
    }
    
  } catch (error) {
    console.error('转账测试时出错:', error);
    return false;
  }
}

async function cleanupTestData() {
  console.log('\n正在清理测试数据...');
  
  try {
    // 清理测试数据
    await dbAsync.run(`DELETE FROM transactions WHERE from_wallet_id IN (
      SELECT id FROM wallets WHERE username IN (?, ?)
    ) OR to_wallet_id IN (
      SELECT id FROM wallets WHERE username IN (?, ?)
    )`, [
      testUsers.sender.username,
      testUsers.receiver.username,
      testUsers.sender.username,
      testUsers.receiver.username
    ]);
    
    await dbAsync.run('DELETE FROM wallets WHERE username IN (?, ?)', [
      testUsers.sender.username,
      testUsers.receiver.username
    ]);
    
    console.log('测试数据清理完成');
    
  } catch (error) {
    console.error('清理测试数据时出错:', error);
  }
}

// 为了让executeTransfer函数可以被导入，需要在transfers.js中导出它
function prepareModules() {
  console.log('正在准备测试模块...');
  
  // 由于Node.js的模块缓存机制，我们需要确保executeTransfer函数可以被访问
  // 这里我们不做任何修改，因为我们直接调用executeTransfer函数
  console.log('模块准备完成');
}

// 运行测试
async function runTest() {
  try {
    // 准备测试模块
    prepareModules();
    
    // 设置测试数据
    await setupTestData();
    
    // 运行测试
    const testResult = await testTransferByUsername();
    
    // 清理测试数据
    await cleanupTestData();
    
    console.log('\n测试完成:', testResult ? '成功' : '失败');
    process.exit(testResult ? 0 : 1);
    
  } catch (error) {
    console.error('测试运行时出错:', error);
    
    try {
      // 尝试清理测试数据
      await cleanupTestData();
    } catch (cleanupError) {
      console.error('清理测试数据时出错:', cleanupError);
    }
    
    process.exit(1);
  }
}

// 运行测试
runTest();