"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface EnergyData {
  currentSolar: number; // kW
  currentBattery: number; // 0-100%
  homeLoadKw: number; // kW
  gridToUserKw: number; // Grid supplying to user (kW)
  userToGridKw: number; // User supplying to grid (kW)
  gridPrice: number; // ₹/kWh
}

interface LiveEnergyRecord {
  id: string;
  user_id: string;
  solar_output_kw: number;
  battery_percent: number;
  home_load_kw: number;
  grid_to_user_kw: number;
  user_to_grid_kw: number;
  grid_price_cents: number;
  created_at: string;
}

// Simulated fallback data for demo
function generateMockEnergyData(): EnergyData {
  const time = Date.now();
  const hour = new Date(time).getHours();

  // Solar follows typical solar pattern (peak at noon)
  const solarBase = Math.max(0, Math.sin((hour - 6) * Math.PI / 12) * 5);
  const solar = Math.max(0, solarBase + (Math.random() - 0.5) * 0.5);

  // Battery between 20-80%
  const battery = 40 + Math.sin(time / 3600000) * 20 + Math.random() * 10;

  // Home load between 0.5-3kW
  const homeLoad = 1.5 + Math.sin(time / 7200000) * 1 + Math.random() * 0.8;

  // Grid price varies 4-8 ₹/kWh
  const gridPrice = 5 + Math.sin(time / 3600000) * 2 + Math.random() * 0.5;

  // Net flow calculation
  const net = solar - homeLoad;
  const gridToUser = Math.max(0, -net); // Grid supplies if deficit
  const userToGrid = Math.max(0, net); // User supplies if surplus

  return {
    currentSolar: Math.max(0, solar),
    currentBattery: Math.max(0, Math.min(100, battery)),
    homeLoadKw: homeLoad,
    gridToUserKw: gridToUser,
    userToGridKw: userToGrid,
    gridPrice: gridPrice,
  };
}

/**
 * Subscribes to real-time energy data from Supabase
 * Falls back to React Query polling if channel unavailable
 * Returns live energy data with isLive flag
 */
export function useEnergyData(userId?: string) {
  const [energyData, setEnergyData] = useState<EnergyData>(generateMockEnergyData());
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Real-time subscription
  useEffect(() => {
    if (!userId) {
      setIsLive(false);
      return;
    }

    const supabase = createClient();
    let subscription: any = null;

    const setupSubscription = async () => {
      try {
        subscription = supabase
          .channel(`energy_data:${userId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "live_energy_data",
              filter: `user_id=eq.${userId}`,
            },
            (payload: any) => {
              const record = payload.new as LiveEnergyRecord;
              setEnergyData({
                currentSolar: record.solar_output_kw,
                currentBattery: record.battery_percent,
                homeLoadKw: record.home_load_kw,
                gridToUserKw: record.grid_to_user_kw,
                userToGridKw: record.user_to_grid_kw,
                gridPrice: record.grid_price_cents / 100,
              });
              setIsLive(true);
              setError(null);
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              setIsLive(true);
            } else if (status === "CHANNEL_ERROR") {
              setIsLive(false);
            }
          });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Subscription failed"));
        setIsLive(false);
      }
    };

    setupSubscription();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [userId]);

  // Polling fallback with React Query
  const { isLoading } = useQuery({
    queryKey: ["energy-data", userId],
    queryFn: async () => {
      // If we have live subscription, don't poll
      if (isLive) return energyData;

      try {
        const supabase = createClient();
        const { data, error: err } = await supabase
          .from("live_energy_data")
          .select("*")
          .eq("user_id", userId || "")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (err) throw err;
        if (!data) return energyData;

        const record = data as LiveEnergyRecord;
        setEnergyData({
          currentSolar: record.solar_output_kw,
          currentBattery: record.battery_percent,
          homeLoadKw: record.home_load_kw,
          gridToUserKw: record.grid_to_user_kw,
          userToGridKw: record.user_to_grid_kw,
          gridPrice: record.grid_price_cents / 100,
        });
        return energyData;
      } catch (err) {
        // Fallback to mock if query fails
        setEnergyData(generateMockEnergyData());
        return energyData;
      }
    },
    refetchInterval: isLive ? false : 3000, // Poll every 3s if not live
    enabled: !!userId,
  });

  return {
    ...energyData,
    isLive,
    isLoading: isLoading && !isLive,
    error,
  };
}
