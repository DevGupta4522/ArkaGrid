"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface TradeStats {
  currentSavings: number; // ₹ saved today
  totalRevenue: number; // ₹ earned this month
  tradesTodayCount: number;
  tradesThisMonthCount: number;
}

interface TradeRecord {
  id: string;
  user_id: string;
  energy_kwh: number;
  price_per_kwh_cents: number;
  total_cents: number;
  direction: "buy" | "sell";
  status: "pending" | "active" | "completed" | "cancelled";
  created_at: string;
}

// Simulated fallback stats for demo
function generateMockTradeStats(): TradeStats {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Mock: 3-7 trades today
  const tradesToday = 3 + Math.floor(Math.random() * 5);
  // Mock: 45-80 trades this month
  const tradesMonth = 45 + Math.floor(Math.random() * 35);

  // Mock: Saved ₹200-600 today
  const savings = 200 + Math.floor(Math.random() * 400);
  // Mock: Revenue ₹3000-8000 this month
  const revenue = 3000 + Math.floor(Math.random() * 5000);

  return {
    currentSavings: savings,
    totalRevenue: revenue,
    tradesTodayCount: tradesToday,
    tradesThisMonthCount: tradesMonth,
  };
}

/**
 * Fetches and subscribes to user's trade statistics
 * Tracks daily savings and monthly revenue
 */
export function useTradeStats(userId?: string) {
  const [stats, setStats] = useState<TradeStats>(generateMockTradeStats());
  const [error, setError] = useState<Error | null>(null);

  // Real-time subscription to trades
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    let subscription: any = null;

    const setupSubscription = async () => {
      try {
        subscription = supabase
          .channel(`trades:${userId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "trades",
              filter: `buyer_id=eq.${userId},seller_id=eq.${userId}`,
            },
            async () => {
              // Recalculate stats when new trade added
              await refetch();
            }
          )
          .subscribe();
      } catch (err) {
        console.error("Subscription error:", err);
      }
    };

    setupSubscription();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [userId]);

  // React Query for fetching stats
  const { refetch, isLoading } = useQuery({
    queryKey: ["trade-stats", userId],
    queryFn: async () => {
      if (!userId) return stats;

      try {
        const supabase = createClient();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch today's trades
        const { data: todayTrades } = await supabase
          .from("trades")
          .select("*")
          .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
          .gte("created_at", today.toISOString())
          .eq("status", "completed");

        // Fetch this month's trades
        const { data: monthTrades } = await supabase
          .from("trades")
          .select("*")
          .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
          .gte("created_at", monthStart.toISOString())
          .eq("status", "completed");

        // Calculate savings (bought below JVVNL rate) and revenue (sold above cost)
        const trades = (todayTrades || []) as TradeRecord[];
        const monthAllTrades = (monthTrades || []) as TradeRecord[];

        // Assume JVVNL rate is ₹7/kWh
        const jvvnlRate = 700; // in cents
        let savingsToday = 0;
        let revenueMonth = 0;

        trades.forEach((trade) => {
          if (trade.direction === "buy" && trade.price_per_kwh_cents < jvvnlRate) {
            savingsToday += (jvvnlRate - trade.price_per_kwh_cents) * trade.energy_kwh;
          }
        });

        monthAllTrades.forEach((trade) => {
          if (trade.direction === "sell") {
            revenueMonth += trade.total_cents;
          }
        });

        setStats({
          currentSavings: Math.round(savingsToday / 100),
          totalRevenue: Math.round(revenueMonth / 100),
          tradesTodayCount: trades.length,
          tradesThisMonthCount: monthAllTrades.length,
        });

        return stats;
      } catch (err) {
        console.error("Error fetching trade stats:", err);
        // Fallback to mock data
        setStats(generateMockTradeStats());
        return stats;
      }
    },
    refetchInterval: 30000, // Refetch every 30s
    enabled: !!userId,
  });

  return {
    ...stats,
    isLoading,
    error,
  };
}
