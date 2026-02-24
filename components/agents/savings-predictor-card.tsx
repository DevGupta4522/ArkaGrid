"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { SavingsComparison } from "@/types";
import { Sparkles } from "lucide-react";

interface SavingsPredictorCardProps {
  comparison: SavingsComparison;
}

export function SavingsPredictorCard({ comparison }: SavingsPredictorCardProps) {
  return (
    <Card className="border-amber-grid/30 bg-gradient-to-br from-grid-surface to-amber-grid/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-grid" />
          Savings vs JVVNL
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Arka: ₹{(comparison.arka_price_per_kwh / 100).toFixed(1)}/kWh · JVVNL: ₹
          {(comparison.jvvnl_price_per_kwh / 100).toFixed(1)}/kWh
        </p>
        <p className="text-xl font-mono font-bold text-emerald-500">
          Saved {formatCurrency(comparison.total_saved_cents)} ({comparison.saved_percent}%)
        </p>
        <p className="text-xs text-muted-foreground">
          For {comparison.period_kwh} kWh in this period
        </p>
      </CardContent>
    </Card>
  );
}
