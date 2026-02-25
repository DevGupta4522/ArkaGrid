"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Charger } from "@/types";
import { CONNECTOR_LABELS, SPEED_LABELS } from "@/lib/data/chargers";
import { cn } from "@/lib/utils";

const JAIPUR_CENTER: [number, number] = [26.9124, 75.7873];

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
  const [mounted, setMounted] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize map on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const initializeMap = async () => {
      // Skip if already initialized
      if (mapInstanceRef.current) return;

      try {
        const L = (await import("leaflet")).default;

        // Wait for container to be ready
        if (!containerRef.current || containerRef.current.offsetHeight === 0) {
          setTimeout(initializeMap, 100);
          return;
        }

        // Create map instance
        const map = L.map(containerRef.current).setView(JAIPUR_CENTER, 11);
        mapInstanceRef.current = map;

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);
      } catch (error) {
        console.error("Map initialization error:", error);
      }
    };

    initializeMap();

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mounted]);

  // Update markers when chargers change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const L = require("leaflet");

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    chargers.forEach((charger) => {
      const markerHtml = `
        <div class="w-4 h-4 rounded-full border-2 border-amber-grid bg-grid-surface cursor-pointer ${
          selectedChargerId === charger.id ? "ring-2 ring-amber-grid scale-125" : ""
        }"></div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: "custom-marker",
        iconSize: [16, 16],
        popupAnchor: [0, -8],
      });

      const popupContent = `
        <div class="p-2 min-w-[160px]">
          <p class="font-semibold text-foreground">${charger.name}</p>
          <p class="text-xs text-muted-foreground">${CONNECTOR_LABELS[charger.connector_type] ?? charger.connector_type} · ${SPEED_LABELS[charger.speed] ?? charger.speed}</p>
          <p class="text-amber-grid font-mono mt-1">₹${(charger.price_per_kwh_cents / 100).toFixed(1)}/kWh</p>
          <p class="text-xs">${charger.is_available ? "Available" : "Occupied"}</p>
        </div>
      `;

      const marker = L.marker([charger.latitude, charger.longitude], {
        icon: customIcon,
      })
        .bindPopup(popupContent)
        .on("click", () => onSelectCharger(charger.id))
        .addTo(mapInstanceRef.current);

      markersRef.current.push(marker);
    });
  }, [chargers, selectedChargerId, onSelectCharger]);

  if (!mounted) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden border border-grid-border", className)}>
        <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-grid-surface text-muted-foreground">
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-xl overflow-hidden border border-grid-border h-full", className)}>
      <div ref={containerRef} className="w-full h-full min-h-[400px]" />
    </div>
  );
}
