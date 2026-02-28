-- P2P Neighbourhood Energy Trading Platform
-- PostgreSQL Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(15) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('prosumer', 'consumer', 'admin')),
  kyc_verified BOOLEAN DEFAULT FALSE,
  rating_avg DECIMAL(3, 1) DEFAULT 5.0,
  rating_count INT DEFAULT 0,
  wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Energy Listings Table
CREATE TABLE IF NOT EXISTS energy_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prosumer_id UUID NOT NULL REFERENCES users(id),
  units_available DECIMAL(8, 2) NOT NULL CHECK (units_available > 0),
  price_per_unit DECIMAL(6, 2) NOT NULL CHECK (price_per_unit > 0 AND price_per_unit <= 15),
  units_remaining DECIMAL(8, 2) NOT NULL,
  available_from TIMESTAMP NOT NULL,
  available_until TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'cancelled')),
  delivery_radius_km DECIMAL(4, 1) DEFAULT 0.5,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_prosumer ON energy_listings(prosumer_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON energy_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_location ON energy_listings(latitude, longitude);

-- Trades Table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES energy_listings(id),
  prosumer_id UUID NOT NULL REFERENCES users(id),
  consumer_id UUID NOT NULL REFERENCES users(id),
  units_requested DECIMAL(8, 2) NOT NULL CHECK (units_requested > 0),
  units_delivered DECIMAL(8, 2) DEFAULT 0.00,
  price_per_unit DECIMAL(6, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  escrow_status VARCHAR(20) NOT NULL DEFAULT 'locked' CHECK (escrow_status IN ('locked', 'released', 'refunded', 'partial')),
  trade_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (trade_status IN ('pending', 'delivering', 'completing', 'completed', 'failed', 'disputed')),
  escrow_locked_at TIMESTAMP DEFAULT NOW(),
  delivery_deadline TIMESTAMP NOT NULL,
  delivery_confirmed_at TIMESTAMP,
  payment_released_at TIMESTAMP,
  blockchain_tx_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_prosumer ON trades(prosumer_id);
CREATE INDEX IF NOT EXISTS idx_trades_consumer ON trades(consumer_id);
CREATE INDEX IF NOT EXISTS idx_trades_listing ON trades(listing_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(trade_status);
CREATE INDEX IF NOT EXISTS idx_trades_escrow ON trades(escrow_status);
CREATE INDEX IF NOT EXISTS idx_trades_deadline ON trades(delivery_deadline);

-- Meter Readings Table
CREATE TABLE IF NOT EXISTS meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  trade_id UUID REFERENCES trades(id),
  reading_type VARCHAR(20) NOT NULL CHECK (reading_type IN ('outgoing', 'incoming')),
  kwh_value DECIMAL(10, 3) NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW(),
  source VARCHAR(20) NOT NULL CHECK (source IN ('smart_meter', 'manual', 'simulated'))
);

CREATE INDEX IF NOT EXISTS idx_readings_user ON meter_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_readings_trade ON meter_readings(trade_id);
CREATE INDEX IF NOT EXISTS idx_readings_type ON meter_readings(reading_type);

-- Ratings Table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES trades(id),
  rater_id UUID NOT NULL REFERENCES users(id),
  rated_id UUID NOT NULL REFERENCES users(id),
  score INT NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ratings_trade ON ratings(trade_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_id ON ratings(rated_id);

-- Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
