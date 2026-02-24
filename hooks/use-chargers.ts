"use client";

import { useQuery } from "@tanstack/react-query";
import type { Charger, MapFilters } from "@/types";
import { filterChargers } from "@/lib/data/chargers";

const MOCK_CHARGERS_KEY = "arka-mock-chargers";

async function fetchChargers(): Promise<Charger[]> {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(MOCK_CHARGERS_KEY);
  if (raw) return JSON.parse(raw);
  try {
    const res = await fetch("/mock-chargers.json");
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(MOCK_CHARGERS_KEY, JSON.stringify(data));
      return data;
    }
  } catch {
    // ignore
  }
  return [];
}

export function useChargers(filters: MapFilters) {
  const { data: chargers = [], ...rest } = useQuery({
    queryKey: ["chargers"],
    queryFn: fetchChargers,
  });
  const filtered = filterChargers(chargers, filters);
  return { chargers: filtered, allChargers: chargers, ...rest };
}

export function setMockChargers(chargers: Charger[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOCK_CHARGERS_KEY, JSON.stringify(chargers));
}
