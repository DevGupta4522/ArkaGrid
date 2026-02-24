"use client";

import { useState, useCallback } from "react";
import { DiscoveryMap, MapFiltersBar } from "@/components/map";
import { useChargers } from "@/hooks/use-chargers";
import type { MapFilters } from "@/types";

const defaultFilters: MapFilters = {
  connectorType: "all",
  speed: "all",
  availability: "all",
};

export default function MapPage() {
  const [filters, setFilters] = useState<MapFilters>(defaultFilters);
  const [selectedChargerId, setSelectedChargerId] = useState<string | null>(null);
  const { chargers } = useChargers(filters);

  return (
    <div className="min-h-screen bg-grid-bg flex flex-col">
      <header className="border-b border-grid-border bg-grid-surface/50 backdrop-blur shrink-0">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-amber-grid">Discovery Engine</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 flex-1 flex flex-col gap-4">
        <MapFiltersBar filters={filters} onFiltersChange={setFilters} />
        <div className="flex-1 min-h-[500px]">
          <DiscoveryMap
            chargers={chargers}
            selectedChargerId={selectedChargerId}
            onSelectCharger={useCallback((id) => setSelectedChargerId(id), [])}
            className="w-full h-full"
          />
        </div>
        {chargers.length === 0 && (
          <p className="text-center text-muted-foreground text-sm">
            No chargers to show. Run <code className="font-mono bg-grid-surface px-1 rounded">npm run mock:seed</code> to
            generate 50 Jaipur chargers, then refresh.
          </p>
        )}
      </main>
    </div>
  );
}
