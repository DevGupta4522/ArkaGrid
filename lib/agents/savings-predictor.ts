/**
 * Savings Predictor – Compares Arka price vs JVVNL govt price.
 * Shows user exactly how much they saved.
 */

import type { SavingsComparison } from "@/types";

// JVVNL (Jaipur Vidyut Vitran Nigam) – simulated typical tariff (₹/kWh) for comparison.
const JVVNL_TARIFF_CENTS_PER_KWH = 650; // ~₹6.50/kWh typical blended rate

export function computeSavings(
  arkaPricePerKwhCents: number,
  periodKwh: number
): SavingsComparison {
  const jvvnl = JVVNL_TARIFF_CENTS_PER_KWH;
  const savedPerKwh = Math.max(0, jvvnl - arkaPricePerKwhCents);
  const savedPercent =
    jvvnl > 0 ? (savedPerKwh / jvvnl) * 100 : 0;
  const totalSavedCents = Math.round(savedPerKwh * periodKwh);

  return {
    arka_price_per_kwh: arkaPricePerKwhCents,
    jvvnl_price_per_kwh: jvvnl,
    saved_per_kwh: savedPerKwh,
    saved_percent: Math.round(savedPercent * 10) / 10,
    period_kwh: periodKwh,
    total_saved_cents: totalSavedCents,
  };
}

export function formatSavingsSummary(comparison: SavingsComparison): string {
  const saved = (comparison.total_saved_cents / 100).toFixed(0);
  return `You saved ₹${saved} vs JVVNL (${comparison.saved_percent}% lower) for ${comparison.period_kwh} kWh.`;
}
