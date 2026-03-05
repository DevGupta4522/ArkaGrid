-- ArkaGrid Phase 2: Meter Readings Table
-- Stores all IoT smart meter data for energy trades

CREATE TABLE IF NOT EXISTS meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  trade_id UUID REFERENCES trades(id),
  reading_type VARCHAR(20) NOT NULL CHECK (reading_type IN ('outgoing', 'incoming', 'generation')),
  kwh_value DECIMAL(10, 4) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(20) DEFAULT 'simulated' CHECK (source IN ('simulated', 'physical', 'manual')),
  voltage DECIMAL(6, 2),
  current_amps DECIMAL(6, 2),
  power_factor DECIMAL(4, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_meter_readings_user ON meter_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_trade ON meter_readings(trade_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_type ON meter_readings(reading_type);
CREATE INDEX IF NOT EXISTS idx_meter_readings_recorded ON meter_readings(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_meter_readings_user_type ON meter_readings(user_id, reading_type, recorded_at DESC);
