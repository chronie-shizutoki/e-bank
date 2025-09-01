-- SQLite数据库初始化脚本
-- 创建钱包应用所需的表结构和索引

-- 创建钱包表
CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  balance REAL NOT NULL DEFAULT 0.00,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 创建交易表
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  from_wallet_id TEXT,
  to_wallet_id TEXT,
  amount REAL NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('transfer', 'initial_deposit', 'interest_credit', 'interest_debit')),
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (from_wallet_id) REFERENCES wallets(id),
  FOREIGN KEY (to_wallet_id) REFERENCES wallets(id)
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_wallets_username ON wallets(username);

CREATE INDEX IF NOT EXISTS idx_transactions_from_wallet ON transactions(from_wallet_id);

CREATE INDEX IF NOT EXISTS idx_transactions_to_wallet ON transactions(to_wallet_id);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

-- 创建触发器自动更新updated_at字段
CREATE TRIGGER IF NOT EXISTS update_wallets_updated_at
  AFTER UPDATE ON wallets
  FOR EACH ROW
BEGIN
  UPDATE wallets SET updated_at = datetime('now') WHERE id = NEW.id;
END;