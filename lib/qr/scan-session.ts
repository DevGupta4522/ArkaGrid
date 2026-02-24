/**
 * QR Integration – Logic for scanning a Charger ID to start a session.
 * In production: use a QR scanner (e.g. react-qr-reader or native) to get chargerId.
 */

import type { Charger } from "@/types";

export interface ScanSessionResult {
  charger: Charger | null;
  error: string | null;
}

export function startSessionFromChargerId(
  chargerId: string,
  chargers: Charger[]
): ScanSessionResult {
  const charger = chargers.find((c) => c.id === chargerId) ?? null;
  if (!charger) {
    return { charger: null, error: "Charger not found." };
  }
  if (!charger.is_available) {
    return { charger: null, error: "Charger is currently occupied." };
  }
  return { charger, error: null };
}

/** Parse QR payload: expect "arka://charger/{id}" or plain UUID */
export function parseChargerIdFromQr(payload: string): string | null {
  const trimmed = payload.trim();
  const prefix = "arka://charger/";
  if (trimmed.startsWith(prefix)) {
    return trimmed.slice(prefix.length) || null;
  }
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(trimmed) ? trimmed : null;
}
