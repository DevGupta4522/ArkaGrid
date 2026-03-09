"use client";

import { useState } from "react";
import { AgentStatusToggle, GridShieldBadge, SavingsPredictorCard } from "@/components/agents";
import { EnergyFlowDiagram } from "@/components/control-room";
import { useGridHealth } from "@/hooks/use-grid-health";
import { computeSavings } from "@/lib/agents/savings-predictor";
import type { AgentMode } from "@/types";

export default function ControlRoomPage() {
  const [agentMode, setAgentMode] = useState<AgentMode>("manual");
  const { data: gridHealth } = useGridHealth(5000);

  const savings = computeSavings(520, 120); // ₹5.20/kWh, 120 kWh period

  return (
    <div className="min-h-screen bg-grid-bg">
      <header className="border-b border-grid-border bg-grid-surface/50 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-amber-grid">Arka · Control Room</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Agent status</h2>
          <AgentStatusToggle
            mode={agentMode}
            onModeChange={setAgentMode}
            disabled={gridHealth?.status === "critical"}
          />
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Live energy flow</h2>
          <EnergyFlowDiagram
            gridToUser={2.4}
            userToGrid={agentMode === "autopilot" ? 0.5 : 0}
            solarToUser={1.2}
          />
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Grid Shield</h2>
            {gridHealth ? (
              <GridShieldBadge snapshot={gridHealth} />
            ) : (
              <div className="rounded-xl border border-grid-border bg-grid-surface p-6 animate-pulse">
                Loading…
              </div>
            )}
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Savings predictor</h2>
            <SavingsPredictorCard comparison={savings} />
          </section>
        </div>
      </main>
    </div>
  );
}
