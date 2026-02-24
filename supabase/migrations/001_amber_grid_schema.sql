-- Arka Grid – Initial schema (Supabase/Postgres)
-- Run in Supabase SQL Editor or via Supabase CLI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (extends Supabase auth.users via id)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'consumer' CHECK (role IN ('consumer', 'prosumer', 'host', 'admin')),
  wallet_balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (wallet_balance_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chargers (host-owned)
CREATE TABLE public.chargers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  connector_type TEXT NOT NULL CHECK (connector_type IN ('type2', 'ccs2', 'chademo', 'bhārāt_ac')),
  speed TEXT NOT NULL CHECK (speed IN ('ac_slow', 'ac_fast', 'dc_fast', 'dc_ultra')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  price_per_kwh_cents INTEGER NOT NULL CHECK (price_per_kwh_cents >= 0),
  is_available BOOLEAN NOT NULL DEFAULT true,
  max_power_kw NUMERIC(6,2) NOT NULL DEFAULT 7.4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chargers_host ON public.chargers(host_id);
CREATE INDEX idx_chargers_lat_lng ON public.chargers(latitude, longitude);
CREATE INDEX idx_chargers_available ON public.chargers(is_available) WHERE is_available = true;

-- Trades / charging sessions
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  charger_id UUID REFERENCES public.chargers(id) ON DELETE SET NULL,
  energy_kwh NUMERIC(10,2) NOT NULL CHECK (energy_kwh > 0),
  price_per_kwh_cents INTEGER NOT NULL,
  total_cents BIGINT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('buy', 'sell')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trades_buyer ON public.trades(buyer_id);
CREATE INDEX idx_trades_seller ON public.trades(seller_id);
CREATE INDEX idx_trades_charger ON public.trades(charger_id);
CREATE INDEX idx_trades_started ON public.trades(started_at DESC);

-- Agent decisions (Autopilot log)
CREATE TABLE public.agent_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('manual', 'autopilot')),
  action TEXT NOT NULL CHECK (action IN ('buy', 'sell', 'hold', 'pause')),
  reason TEXT,
  grid_health_score INTEGER CHECK (grid_health_score >= 0 AND grid_health_score <= 100),
  price_snapshot_cents INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_decisions_user ON public.agent_decisions(user_id);
CREATE INDEX idx_agent_decisions_created ON public.agent_decisions(created_at DESC);

-- Wallet transactions (ledger)
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_cents BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  reference_type TEXT NOT NULL CHECK (reference_type IN ('trade', 'topup', 'payout', 'refund')),
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_user ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_tx_created ON public.wallet_transactions(created_at DESC);

-- Agent mode per user (manual vs autopilot)
CREATE TABLE public.agent_mode (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'manual' CHECK (mode IN ('manual', 'autopilot')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS (Row Level Security) – enable and policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chargers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_mode ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own row
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Chargers: public read; host can CRUD own
CREATE POLICY "Chargers are readable by all" ON public.chargers FOR SELECT USING (true);
CREATE POLICY "Hosts can manage own chargers" ON public.chargers FOR ALL USING (auth.uid() = host_id);

-- Trades: participants can read; insert via app logic
CREATE POLICY "Users can read own trades" ON public.trades FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Users can insert trades" ON public.trades FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Agent decisions: user can read/insert own
CREATE POLICY "Users can read own agent decisions" ON public.agent_decisions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert agent decisions" ON public.agent_decisions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Wallet: user can read own
CREATE POLICY "Users can read own wallet transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- Agent mode: user can read/update own
CREATE POLICY "Users can read own agent mode" ON public.agent_mode FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own agent mode" ON public.agent_mode FOR ALL USING (auth.uid() = user_id);

-- Trigger to sync updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER chargers_updated_at BEFORE UPDATE ON public.chargers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
