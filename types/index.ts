// ─── Arka Grid – Shared types (DB & UI) ─────────────────────────────────────

export type ConnectorType = "type2" | "ccs2" | "chademo" | "bhārāt_ac";
export type ChargerSpeed = "ac_slow" | "ac_fast" | "dc_fast" | "dc_ultra";
export type SessionStatus = "pending" | "active" | "completed" | "cancelled";
export type TradeDirection = "buy" | "sell";
export type AgentMode = "manual" | "autopilot";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "consumer" | "prosumer" | "host" | "admin";
  wallet_balance_cents: number;
  created_at: string;
  updated_at: string;
}

export interface Charger {
  id: string;
  host_id: string;
  name: string;
  connector_type: ConnectorType;
  speed: ChargerSpeed;
  latitude: number;
  longitude: number;
  address: string | null;
  price_per_kwh_cents: number;
  is_available: boolean;
  max_power_kw: number;
  created_at: string;
  updated_at: string;
}

export interface ChargerWithHost extends Charger {
  host?: Pick<User, "id" | "full_name">;
}

export interface Trade {
  id: string;
  buyer_id: string;
  seller_id: string;
  charger_id: string | null;
  energy_kwh: number;
  price_per_kwh_cents: number;
  total_cents: number;
  direction: TradeDirection;
  status: SessionStatus;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface AgentDecision {
  id: string;
  user_id: string;
  mode: AgentMode;
  action: "buy" | "sell" | "hold" | "pause";
  reason: string | null;
  grid_health_score: number | null;
  price_snapshot_cents: number | null;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount_cents: number;
  type: "credit" | "debit";
  reference_type: "trade" | "topup" | "payout" | "refund";
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface GridHealthSnapshot {
  score: number; // 0–100
  status: "healthy" | "stressed" | "critical";
  message: string;
  transformer_load_percent: number;
  updated_at: string;
}

export interface SavingsComparison {
  arka_price_per_kwh: number;
  jvvnl_price_per_kwh: number;
  saved_per_kwh: number;
  saved_percent: number;
  period_kwh: number;
  total_saved_cents: number;
}

export interface MapFilters {
  connectorType: ConnectorType | "all";
  speed: ChargerSpeed | "all";
  availability: "all" | "available";
}
