"use client";

import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Charger } from "@/types";
import { CONNECTOR_LABELS, SPEED_LABELS } from "@/lib/data/chargers";
import { cn } from "@/lib/utils";

const JAIPUR_CENTER: [number, number] = [75.7873, 26.9124];
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

interface DiscoveryMapProps {
  chargers: Charger[];
  selectedChargerId: string | null;
  onSelectCharger: (id: string | null) => void;
  className?: string;
}

export function DiscoveryMap({
  chargers,
  selectedChargerId,
  onSelectCharger,
  className,
}: DiscoveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) {
      setLoaded(true);
      return;
    }
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: JAIPUR_CENTER,
      zoom: 11,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.on("load", () => setLoaded(true));
    mapRef.current = map;
    return () => {
      markersRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    chargers.forEach((c) => {
      const el = document.createElement("div");
      el.className = "w-4 h-4 rounded-full border-2 border-amber-grid bg-grid-surface cursor-pointer";
      if (selectedChargerId === c.id) {
        el.classList.add("ring-2", "ring-amber-grid", "scale-125");
      }
      const popup = new mapboxgl.Popup({ offset: 16 }).setHTML(
        `<div class="p-2 min-w-[160px]">
          <p class="font-semibold text-foreground">${c.name}</p>
          <p class="text-xs text-muted-foreground">${CONNECTOR_LABELS[c.connector_type] ?? c.connector_type} · ${SPEED_LABELS[c.speed] ?? c.speed}</p>
          <p class="text-amber-grid font-mono mt-1">₹${(c.price_per_kwh_cents / 100).toFixed(1)}/kWh</p>
          <p class="text-xs">${c.is_available ? "Available" : "Occupied"}</p>
        </div>`
      );
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([c.longitude, c.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);
      el.addEventListener("click", () => onSelectCharger(c.id));
      markersRef.current.push(marker);
    });
  }, [chargers, loaded, selectedChargerId, onSelectCharger]);

  return (
    <div className={cn("relative rounded-xl overflow-hidden border border-grid-border", className)}>
      {!MAPBOX_TOKEN && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-grid-surface/90 text-muted-foreground text-sm">
          Set NEXT_PUBLIC_MAPBOX_TOKEN for the map.
        </div>
      )}
      <div ref={containerRef} className="w-full h-full min-h-[400px]" />
    </div>
  );
}
