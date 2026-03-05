-- ArkaGrid Solana Integration — Database Migration
-- Run this AFTER the existing schema.sql

-- Add blockchain columns to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS blockchain VARCHAR(20) DEFAULT 'solana';
ALTER TABLE trades ADD COLUMN IF NOT EXISTS delivery_tx_hash VARCHAR(100);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS blockchain_status VARCHAR(30) DEFAULT 'pending';
ALTER TABLE trades ADD COLUMN IF NOT EXISTS prosumer_wallet VARCHAR(50);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS consumer_wallet VARCHAR(50);

-- Add wallet columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_type VARCHAR(20) DEFAULT 'phantom';

-- Index for wallet lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_trades_blockchain_status ON trades(blockchain_status);
