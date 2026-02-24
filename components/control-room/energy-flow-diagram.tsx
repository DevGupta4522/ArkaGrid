"use client";

import { cn } from "@/lib/utils";

interface EnergyFlowDiagramProps {
  gridToUser: number;
  userToGrid: number;
  solarToUser: number;
  className?: string;
}

/** Live energy flow diagram – Control Room feel (simulated values) */
export function EnergyFlowDiagram({
  gridToUser = 2.4,
  userToGrid = 0,
  solarToUser = 1.2,
  className,
}: EnergyFlowDiagramProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-grid-border bg-grid-surface p-6 font-mono text-sm",
        className
      )}
    >
      <p className="text-muted-foreground mb-4 text-xs uppercase tracking-wider">
        Live energy flow (kW)
      </p>
      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
        <div className="flex flex-col items-center rounded-lg border border-grid-border bg-grid-bg p-4 min-w-[100px]">
          <span className="text-muted-foreground text-xs">Grid</span>
          <span className="text-lg font-bold text-foreground">—</span>
        </div>
        <div className="flex flex-col items-center text-amber-grid">
          <span className="text-xs">→ User</span>
          <span className="text-xl font-bold animate-pulse-slow">{gridToUser}</span>
        </div>
        <div className="flex flex-col items-center rounded-lg border-2 border-amber-grid/50 bg-amber-grid/5 p-4 min-w-[120px] shadow-lg shadow-amber-glow/20">
          <span className="text-amber-grid text-xs uppercase">Your Hub</span>
          <span className="text-2xl font-bold text-amber-grid">
            {(gridToUser + solarToUser - userToGrid).toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">kW net</span>
        </div>
        <div className="flex flex-col items-center text-emerald-500">
          <span className="text-xs">Solar →</span>
          <span className="text-xl font-bold">{solarToUser}</span>
        </div>
        <div className="flex flex-col items-center rounded-lg border border-grid-border bg-grid-bg p-4 min-w-[100px]">
          <span className="text-muted-foreground text-xs">Solar</span>
          <span className="text-lg font-bold text-emerald-500">—</span>
        </div>
      </div>
      {userToGrid > 0 && (
        <div className="mt-4 text-center">
          <span className="text-rose-500 text-xs">Selling to grid: {userToGrid} kW</span>
        </div>
      )}
    </div>
  );
}
