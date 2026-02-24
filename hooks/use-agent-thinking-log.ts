"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type AgentLogType = "evaluating" | "detected" | "decision" | "action";

export interface AgentLog {
  id: string;
  timestamp: Date;
  type: AgentLogType;
  message: string;
  context?: Record<string, any>;
}

// Simulated agent thinking logs for demo
function generateMockAgentLog(): AgentLog {
  const types: AgentLogType[] = ["evaluating", "detected", "decision", "action"];
  const logMessages: Record<AgentLogType, string[]> = {
    evaluating: [
      "Evaluating grid price: ₹5.20/kWh",
      "Analyzing battery status: 65%",
      "Checking solar capacity: 3.2 kW",
      "Computing cost savings...",
      "Evaluating trade opportunities",
    ],
    detected: [
      "JVVNL peak detected: +12% surcharge active",
      "Solar surplus detected: 2.1 kW available",
      "Grid capacity constraint detected",
      "Neighbor B: 1.5 kW demand at ₹4.80/kWh",
      "Battery at optimal discharge threshold",
    ],
    decision: [
      "Decision: Discharge to grid (₹127 revenue)",
      "Decision: Hold (waiting for better rates)",
      "Decision: Sell to Neighbor B (+₹96 gain)",
      "Decision: Charge from grid (save ₹45 vs solar)",
      "Decision: Balance load (maximize savings)",
    ],
    action: [
      "Discharging 1.5 kW to Neighbor B",
      "Charging battery from grid (1.2 kW)",
      "Selling surplus to grid operator",
      "Optimizing load distribution",
      "Trade initiated with Neighbor B",
    ],
  };

  const type = types[Math.floor(Math.random() * types.length)];
  const message = logMessages[type][Math.floor(Math.random() * logMessages[type].length)];

  return {
    id: Math.random().toString(36).substring(2),
    timestamp: new Date(),
    type,
    message,
  };
}

/**
 * Subscribes to agent thinking/decision logs from Supabase
 * Keeps last 12 entries for display in terminal
 * Falls back to simulated logs for demo
 */
export function useAgentThinkingLog(userId?: string) {
  const [logs, setLogs] = useState<AgentLog[]>([generateMockAgentLog()]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const maxLogs = 12; // Keep last 12 logs

  // Simulated log generation for demo
  useEffect(() => {
    if (!userId) return;

    // Simulate new log every 3-8 seconds
    const interval = setInterval(() => {
      setLogs((prev) => {
        const newLog = generateMockAgentLog();
        const updated = [...prev, newLog];
        // Keep only last maxLogs
        return updated.slice(-maxLogs);
      });
    }, 3000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, [userId]);

  // Real-time subscription (when DB is ready)
  useEffect(() => {
    if (!userId) {
      setIsStreaming(false);
      return;
    }

    const supabase = createClient();
    let subscription: any = null;

    const setupSubscription = async () => {
      try {
        subscription = supabase
          .channel(`agent_logs:${userId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "agent_thinking_logs",
              filter: `user_id=eq.${userId}`,
            },
            (payload: any) => {
              const record = payload.new as {
                id: string;
                log_type: AgentLogType;
                message: string;
                created_at: string;
                context?: Record<string, any>;
              };

              const newLog: AgentLog = {
                id: record.id,
                timestamp: new Date(record.created_at),
                type: record.log_type,
                message: record.message,
                context: record.context,
              };

              setLogs((prev) => {
                const updated = [...prev, newLog];
                return updated.slice(-maxLogs);
              });
              setIsStreaming(true);
              setError(null);
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              setIsStreaming(true);
            }
          });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Subscription failed"));
      }
    };

    setupSubscription();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [userId]);

  return {
    logs,
    isStreaming,
    error,
    addLog: (type: AgentLogType, message: string) => {
      const newLog: AgentLog = {
        id: Math.random().toString(36).substring(2),
        timestamp: new Date(),
        type,
        message,
      };
      setLogs((prev) => [...prev, newLog].slice(-maxLogs));
    },
  };
}
