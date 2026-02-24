/**
 * Grid Shield Monitoring – Real-time local grid health score (simulated).
 * Pauses Autopilot trades when community transformer is stressed.
 */

import type { GridHealthSnapshot } from "@/types";

const STATUS_MAP = {
  healthy: { status: "healthy" as const, message: "Grid stable. Trading allowed." },
  stressed: { status: "stressed" as const, message: "Transformer load high. Autopilot may pause." },
  critical: { status: "critical" as const, message: "Grid stressed. Trading paused." },
};

export function getGridHealthScore(): GridHealthSnapshot {
  // Simulated: in production this would come from IoT/SCADA or aggregator API.
  const loadPercent = simulateTransformerLoad();
  const score = Math.max(0, 100 - loadPercent);
  let status: GridHealthSnapshot["status"] = "healthy";
  let message = STATUS_MAP.healthy.message;

  if (loadPercent >= 90) {
    status = "critical";
    message = STATUS_MAP.critical.message;
  } else if (loadPercent >= 70) {
    status = "stressed";
    message = STATUS_MAP.stressed.message;
  }

  return {
    score: Math.round(score),
    status,
    message,
    transformer_load_percent: Math.round(loadPercent),
    updated_at: new Date().toISOString(),
  };
}

function simulateTransformerLoad(): number {
  const hour = new Date().getHours();
  const base = 40 + Math.sin((hour / 24) * Math.PI * 2) * 25;
  const noise = (Math.random() - 0.5) * 15;
  return Math.min(98, Math.max(5, base + noise));
}

export function shouldPauseTrading(snapshot: GridHealthSnapshot): boolean {
  return snapshot.status === "critical" || snapshot.score < 30;
}
