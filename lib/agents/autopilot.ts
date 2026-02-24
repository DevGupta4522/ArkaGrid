/**
 * Autopilot Agent – Monitors battery levels and grid prices to trade automatically.
 * In production this would run as an Edge Function or background worker.
 */

import type { AgentDecision, AgentMode } from "@/types";

export interface AutopilotInput {
  userId: string;
  batteryLevelPercent: number;
  gridPriceCentsPerKwh: number;
  localOffersCentsPerKwh: number[];
  gridHealthScore: number;
}

export interface AutopilotOutput {
  action: "buy" | "sell" | "hold" | "pause";
  reason: string;
  suggestedPriceCents?: number;
}

const BATTERY_BUY_THRESHOLD = 30;
const BATTERY_SELL_THRESHOLD = 85;
const GRID_STRESS_PAUSE_THRESHOLD = 70;

export function computeAutopilotDecision(input: AutopilotInput): AutopilotOutput {
  const {
    batteryLevelPercent,
    gridPriceCentsPerKwh,
    localOffersCentsPerKwh,
    gridHealthScore,
  } = input;

  if (gridHealthScore < GRID_STRESS_PAUSE_THRESHOLD) {
    return {
      action: "pause",
      reason: "Grid Shield: local transformer stressed. Trading paused.",
    };
  }

  const bestLocalPrice =
    localOffersCentsPerKwh.length > 0
      ? Math.min(...localOffersCentsPerKwh)
      : gridPriceCentsPerKwh;

  if (batteryLevelPercent <= BATTERY_BUY_THRESHOLD) {
    const saveVsGrid = gridPriceCentsPerKwh - bestLocalPrice;
    if (saveVsGrid > 0) {
      return {
        action: "buy",
        reason: `Low battery (${batteryLevelPercent}%). Arka price ₹${(bestLocalPrice / 100).toFixed(1)}/kWh is below grid.`,
        suggestedPriceCents: Math.round(bestLocalPrice),
      };
    }
    return {
      action: "buy",
      reason: `Low battery (${batteryLevelPercent}%). Topping up at best available rate.`,
      suggestedPriceCents: Math.round(bestLocalPrice),
    };
  }

  if (batteryLevelPercent >= BATTERY_SELL_THRESHOLD) {
    return {
      action: "sell",
      reason: `High battery (${batteryLevelPercent}%). Sell surplus to the grid.`,
      suggestedPriceCents: Math.round(gridPriceCentsPerKwh * 0.95),
    };
  }

  return {
    action: "hold",
    reason: `Battery at ${batteryLevelPercent}%. No action needed.`,
  };
}

export function toAgentDecision(
  userId: string,
  mode: AgentMode,
  output: AutopilotOutput,
  gridHealthScore: number,
  priceSnapshotCents: number | null
): Omit<AgentDecision, "id" | "created_at"> {
  return {
    user_id: userId,
    mode,
    action: output.action,
    reason: output.reason,
    grid_health_score: gridHealthScore,
    price_snapshot_cents: priceSnapshotCents,
  };
}
