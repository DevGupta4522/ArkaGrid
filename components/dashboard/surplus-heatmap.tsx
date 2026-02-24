"use client";

import { useState } from "react";

interface TradePartner {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  surplusKw: number;
  pricePerKwh: number;
}

// Mock trade partners in Jaipur
const mockTradePartners: TradePartner[] = [
  { id: "1", name: "Rajendra Nagar Hub", latitude: 26.912434, longitude: 75.787270, surplusKw: 2.3, pricePerKwh: 4.8 },
  { id: "2", name: "Bani Park Partner", latitude: 26.923482, longitude: 75.783902, surplusKw: 1.8, pricePerKwh: 4.5 },
  { id: "3", name: "Mansarovar Solar", latitude: 26.898453, longitude: 75.769234, surplusKw: 3.1, pricePerKwh: 5.0 },
  { id: "4", name: "Adarsh Nagar Grid", latitude: 26.935678, longitude: 75.806234, surplusKw: 2.0, pricePerKwh: 4.7 },
  { id: "5", name: "Sanganer Community", latitude: 26.865432, longitude: 75.823456, surplusKw: 1.5, pricePerKwh: 4.6 },
];

interface SurplusHeatmapProps {
  onSelectPartner?: (partner: TradePartner) => void;
  mapboxToken?: string;
}

/**
 * Trade partners and solar surplus visualization
 * Shows available partners for energy trading in Jaipur
 * (Mapbox integration available with valid token)
 */
export function SurplusHeatmap({ onSelectPartner, mapboxToken = "" }: SurplusHeatmapProps) {
  const [selectedPartner, setSelectedPartner] = useState<TradePartner | null>(null);

  return (
    <div className="rounded-xl border border-emerald-electric/30 bg-grid-surface/50 backdrop-blur-sm overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-electric" />
          Active Trade Partners (Jaipur)
        </h3>

        {/* Trade Partners List */}
        <div className="space-y-2">
          {mockTradePartners.map((partner) => (
            <button
              key={partner.id}
              onClick={() => {
                setSelectedPartner(partner);
                onSelectPartner?.(partner);
              }}
              className={`w-full p-4 rounded-lg border transition-all text-left ${
                selectedPartner?.id === partner.id
                  ? "border-emerald-electric bg-emerald-electric/10 shadow-lg shadow-emerald-electric/20"
                  : "border-emerald-electric/20 bg-emerald-electric/5 hover:bg-emerald-electric/10 hover:border-emerald-electric/40"
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{partner.name}</p>
                  <div className="grid grid-cols-2 gap-3 mt-2 text-xs text-muted-foreground">
                    <p>
                      <span className="text-emerald-electric font-medium">Surplus:</span> {partner.surplusKw} kW
                    </p>
                    <p>
                      <span className="text-amber-grid font-medium">Price:</span> ₹{partner.pricePerKwh}/kWh
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-right">
                    <p className="text-2xl font-mono font-bold text-emerald-electric">
                      {partner.surplusKw}
                    </p>
                    <p className="text-xs text-muted-foreground">kW</p>
                  </div>
                  <button
                    className="px-3 py-1.5 rounded text-xs bg-emerald-electric text-grid-bg font-semibold hover:bg-emerald-dark transition-colors whitespace-nowrap"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPartner?.(partner);
                    }}
                  >
                    Trade Now
                  </button>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Map notice */}
        {mapboxToken && (
          <div className="mt-4 p-3 rounded border border-amber-grid/30 bg-amber-grid/5 text-xs text-muted-foreground">
            Advanced heat map visualization available with Mapbox integration.
          </div>
        )}

        {/* Selected partner details */}
        {selectedPartner && (
          <div className="mt-6 pt-6 border-t border-grid-border/50">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Trade Details</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded border border-emerald-electric/20 bg-emerald-electric/5 p-3">
                <p className="text-xs text-muted-foreground mb-1">Available</p>
                <p className="font-mono font-bold text-emerald-electric text-lg">{selectedPartner.surplusKw}</p>
                <p className="text-xs text-muted-foreground">kW</p>
              </div>
              <div className="rounded border border-amber-grid/20 bg-amber-grid/5 p-3">
                <p className="text-xs text-muted-foreground mb-1">Price</p>
                <p className="font-mono font-bold text-amber-grid text-lg">₹{selectedPartner.pricePerKwh}</p>
                <p className="text-xs text-muted-foreground">/kWh</p>
              </div>
              <div>
                <button className="w-full h-full rounded bg-emerald-electric text-grid-bg font-semibold text-sm hover:bg-emerald-dark transition-colors flex items-center justify-center">
                  Trade with {selectedPartner.name.split(" ")[0]}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
