"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { MapFilters } from "@/types";
import { CONNECTOR_LABELS, SPEED_LABELS } from "@/lib/data/chargers";

const CONNECTOR_OPTIONS = ["type2", "ccs2", "chademo", "bhārāt_ac"] as const;
const SPEED_OPTIONS = ["ac_slow", "ac_fast", "dc_fast", "dc_ultra"] as const;

interface MapFiltersProps {
  filters: MapFilters;
  onFiltersChange: (f: MapFilters) => void;
}

export function MapFiltersBar({ filters, onFiltersChange }: MapFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg bg-grid-surface border border-grid-border">
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs">Connector</Label>
        <Select
          value={filters.connectorType}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, connectorType: v as MapFilters["connectorType"] })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {CONNECTOR_OPTIONS.map((k) => (
              <SelectItem key={k} value={k}>
                {CONNECTOR_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs">Speed</Label>
        <Select
          value={filters.speed}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, speed: v as MapFilters["speed"] })
          }
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {SPEED_OPTIONS.map((k) => (
              <SelectItem key={k} value={k}>
                {SPEED_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs">Availability</Label>
        <Select
          value={filters.availability}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, availability: v as MapFilters["availability"] })
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="available">Available</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
