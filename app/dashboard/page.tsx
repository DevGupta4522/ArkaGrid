"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AgentStatusToggle, SavingsPredictorCard } from "@/components/agents";
import { ArrowUpRight, Zap, TrendingUp } from "lucide-react";

/* Dashboard Components */
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AnimatedEnergyFlow } from "@/components/dashboard/animated-energy-flow";
import { AgentThinkingTerminal } from "@/components/dashboard/agent-thinking-terminal";
import { RealtimeStatCard } from "@/components/dashboard/realtime-stat-card";
import { PowerChart } from "@/components/dashboard/power-chart";
import { SurplusHeatmap } from "@/components/dashboard/surplus-heatmap";
import { ClientOnly } from "@/components/client-only";

function PowerChartWrapper() {
  return <PowerChart />;
}

/* Hooks */
import { useEnergyData } from "@/hooks/use-energy-data";
import { useAgentThinkingLog } from "@/hooks/use-agent-thinking-log";
import { useTradeStats } from "@/hooks/use-trade-stats";
import { useGridHealth } from "@/hooks/use-grid-health";
import { computeSavings } from "@/lib/agents/savings-predictor";
import type { AgentMode } from "@/types";

// For demo: use mock user ID
const DEMO_USER_ID = "demo-user-123";

export default function DashboardPage() {
  const [agentMode, setAgentMode] = useState<AgentMode>("manual");

  /* Fetch data from hooks */
  const energyData = useEnergyData(DEMO_USER_ID);
  const { logs, isStreaming } = useAgentThinkingLog(DEMO_USER_ID);
  const tradeStats = useTradeStats(DEMO_USER_ID);
  const { data: gridHealth } = useGridHealth(3000);

  // Calculate savings comparison
  const savings = computeSavings(
    Math.round(energyData.gridPrice) / 100,
    energyData.currentSolar + energyData.homeLoadKw
  );

  return (
    <div className="min-h-screen bg-grid-bg">
      {/* Header */}
      <header className="border-b border-grid-border bg-grid-surface/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-emerald-electric" />
            <h1 className="text-xl font-bold text-emerald-electric">Arka · Dashboard</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                Home
              </Button>
            </Link>
            <Link href="/control-room">
              <Button variant="ghost" size="sm">
                Control Room
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Key Metrics Summary */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-electric" />
            Real-Time Metrics
          </h2>

          <ClientOnly>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Current Savings */}
              <RealtimeStatCard
                label="Savings Today"
                value={`₹${tradeStats.currentSavings}`}
                color="emerald"
                icon={<ArrowUpRight className="h-5 w-5" />}
                trend={15}
              />

              {/* Battery Level */}
              <RealtimeStatCard
                label="Battery Level"
                value={Math.round(energyData.currentBattery)}
                unit="%"
                color="amber"
                icon={<Zap className="h-5 w-5" />}
              />

              {/* Trade Revenue */}
              <RealtimeStatCard
                label="This Month's Revenue"
                value={`₹${tradeStats.totalRevenue}`}
                color="blue"
                icon={<TrendingUp className="h-5 w-5" />}
                trend={22}
              />

              {/* Grid Status */}
              <RealtimeStatCard
                label="Grid Status"
                value={gridHealth?.status.toUpperCase() || "—"}
                color={
                  gridHealth?.status === "healthy"
                    ? "emerald"
                    : gridHealth?.status === "stressed"
                      ? "amber"
                      : "rose"
                }
                icon={<Zap className="h-5 w-5" />}
              />
            </div>
          </ClientOnly>
        </section>

        {/* Main Dashboard Grid */}
        <DashboardLayout
          agentToggle={
            <AgentStatusToggle
              mode={agentMode}
              onModeChange={setAgentMode}
              disabled={gridHealth?.status === "critical"}
            />
          }
          statCards={
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-electric/30 bg-grid-surface/50 backdrop-blur-sm p-4">
                <p className="text-xs uppercase text-muted-foreground tracking-wider mb-2">Solar Output</p>
                <p className="text-2xl font-mono font-bold text-emerald-electric">
                  {energyData.currentSolar.toFixed(2)} kW
                </p>
                <p className="text-xs text-muted-foreground mt-1">Peak capacity</p>
              </div>
              <div className="rounded-xl border border-amber-grid/30 bg-grid-surface/50 backdrop-blur-sm p-4">
                <p className="text-xs uppercase text-muted-foreground tracking-wider mb-2">Grid Price</p>
                <p className="text-2xl font-mono font-bold text-amber-grid">
                  ₹{energyData.gridPrice.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Per kWh</p>
              </div>
            </div>
          }
          savingsPredictorCard={<SavingsPredictorCard comparison={savings} />}
          energyFlow={
            <AnimatedEnergyFlow
              solarKw={energyData.currentSolar}
              batteryPercent={energyData.currentBattery}
              homeLoadKw={energyData.homeLoadKw}
              gridToUserKw={energyData.gridToUserKw}
              userToGridKw={energyData.userToGridKw}
            />
          }
          agentTerminal={
            <AgentThinkingTerminal logs={logs} isStreaming={isStreaming} />
          }
          powerCharts={<PowerChartWrapper />}
          heatmap={<SurplusHeatmap />}
        />

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-grid-border text-center text-xs text-muted-foreground">
          <p>
            Dashboard updates in real-time using Supabase. Last sync:{" "}
            <span className="text-emerald-electric font-mono">
              {new Date().toLocaleTimeString()}
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
