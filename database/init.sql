-- Create database and user (run as postgres superuser)
CREATE DATABASE wallet_app;
CREATE USER wallet_user WITH PASSWORD 'wallet_password';
GRANT ALL PRIVILEGES ON DATABASE wallet_app TO wallet_user;

-- Connect to wallet_app database and create tables
\c wallet_app;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create wallets table
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_wallet_id UUID REFERENCES wallets(id),
  to_wallet_id UUID REFERENCES wallets(id),
  amount DECIMAL(15,2) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  -- 交易类型: 'transfer', 'initial_deposit', 'interest_credit', 'interest_debit', 'third_party_payment', 'third_party_receipt'
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_wallets_username ON wallets(username);
CREATE INDEX idx_transactions_from_wallet ON transactions(from_wallet_id);
CREATE INDEX idx_transactions_to_wallet ON transactions(to_wallet_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Grant permissions to wallet_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wallet_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO wallet_user;