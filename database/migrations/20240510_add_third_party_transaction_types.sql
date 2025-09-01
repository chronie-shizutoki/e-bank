-- 迁移脚本：添加第三方支付交易类型
-- 日期：2024-05-10

-- 注意：SQLite不支持直接修改表的CHECK约束
-- 我们需要重建表来添加新的交易类型

-- 步骤1：创建临时表，包含新的CHECK约束
CREATE TABLE IF NOT EXISTS transactions_temp (
  id TEXT PRIMARY KEY,
  from_wallet_id TEXT,
  to_wallet_id TEXT,
  amount REAL NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('transfer', 'initial_deposit', 'interest_credit', 'interest_debit', 'third_party_payment', 'third_party_receipt')),
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (from_wallet_id) REFERENCES wallets(id),
  FOREIGN KEY (to_wallet_id) REFERENCES wallets(id)
);

-- 步骤2：复制数据到临时表
INSERT INTO transactions_temp SELECT * FROM transactions;

-- 步骤3：重命名原表为备份表
ALTER TABLE transactions RENAME TO transactions_backup;

-- 步骤4：重命名临时表为正式表
ALTER TABLE transactions_temp RENAME TO transactions;

-- 步骤5：重建索引
CREATE INDEX IF NOT EXISTS idx_transactions_from_wallet ON transactions(from_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_wallet ON transactions(to_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

-- 步骤6：如果一切正常，可以选择删除备份表
-- DROP TABLE IF EXISTS transactions_backup;