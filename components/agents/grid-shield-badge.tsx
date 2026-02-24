"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { GridHealthSnapshot } from "@/types";
import { Shield, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GridShieldBadgeProps {
  snapshot: GridHealthSnapshot;
  className?: string;
}

export function GridShieldBadge({ snapshot, className }: GridShieldBadgeProps) {
  const Icon =
    snapshot.status === "healthy"
      ? Shield
      : snapshot.status === "stressed"
        ? AlertTriangle
        : AlertCircle;
  const color =
    snapshot.status === "healthy"
      ? "text-emerald-500"
      : snapshot.status === "stressed"
        ? "text-amber-500"
        : "text-rose-500";

  return (
    <Card className={cn("border-grid-border", className)}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Icon className={cn("h-8 w-8", color)} />
          <div>
            <p className="text-sm font-medium">Grid Shield</p>
            <p className="text-2xl font-mono font-bold">{snapshot.score}</p>
            <p className="text-xs text-muted-foreground">{snapshot.message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Transformer load: {snapshot.transformer_load_percent}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
