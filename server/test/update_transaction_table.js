const { dbAsync } = require('../config/database');

/**
 * 更新交易表结构，添加利息相关的交易类型
 */
async function updateTransactionTable() {
  try {
    console.log('连接到SQLite数据库');
    
    // 检查表是否存在
    const tableExists = await dbAsync.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'"
    );
    
    if (!tableExists) {
      console.log('交易表不存在，无需更新');
      process.exit(0);
    }
    
    // SQLite不支持直接修改CHECK约束，需要重建表
    console.log('开始更新交易表结构...');
    
    // 1. 创建临时表
    console.log('创建临时表...');
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS transactions_temp (
        id TEXT PRIMARY KEY,
        from_wallet_id TEXT,
        to_wallet_id TEXT,
        amount REAL NOT NULL,
        transaction_type TEXT NOT NULL CHECK (transaction_type IN ('transfer', 'initial_deposit', 'interest_credit', 'interest_debit')),
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (from_wallet_id) REFERENCES wallets(id),
        FOREIGN KEY (to_wallet_id) REFERENCES wallets(id)
      )
    `);
    
    // 2. 复制数据到临时表
    console.log('复制数据到临时表...');
    await dbAsync.run(`
      INSERT INTO transactions_temp (id, from_wallet_id, to_wallet_id, amount, transaction_type, description, created_at)
      SELECT id, from_wallet_id, to_wallet_id, amount, transaction_type, description, created_at
      FROM transactions
    `);
    
    // 3. 删除原表
    console.log('删除原表...');
    await dbAsync.run('DROP TABLE transactions');
    
    // 4. 重命名临时表
    console.log('重命名临时表...');
    await dbAsync.run('ALTER TABLE transactions_temp RENAME TO transactions');
    
    // 5. 重新创建索引
    console.log('重新创建索引...');
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_transactions_from_wallet ON transactions(from_wallet_id)');
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_transactions_to_wallet ON transactions(to_wallet_id)');
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at)');
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type)');
    
    console.log('交易表结构更新成功！现在支持interest_credit和interest_debit交易类型。');
    
  } catch (error) {
    console.error('更新交易表结构时出错:', error);
  } finally {
    process.exit(0);
  }
}

updateTransactionTable();