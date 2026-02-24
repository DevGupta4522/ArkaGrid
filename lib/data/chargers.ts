import type { Charger, MapFilters } from "@/types";

export const CONNECTOR_LABELS: Record<string, string> = {
  type2: "Type 2",
  ccs2: "CCS2",
  chademo: "CHAdeMO",
  bhārāt_ac: "Bharat AC",
};

export const SPEED_LABELS: Record<string, string> = {
  ac_slow: "AC Slow",
  ac_fast: "AC Fast",
  dc_fast: "DC Fast",
  dc_ultra: "DC Ultra",
};

export function filterChargers(chargers: Charger[], filters: MapFilters): Charger[] {
  return chargers.filter((c) => {
    if (filters.connectorType !== "all" && c.connector_type !== filters.connectorType) return false;
    if (filters.speed !== "all" && c.speed !== filters.speed) return false;
    if (filters.availability === "available" && !c.is_available) return false;
    return true;
  });
}
