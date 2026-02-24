"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, IndianRupee, Zap } from "lucide-react";

interface HostDashboardProps {
  occupancyRatePercent: number;
  revenueCents: number;
  totalSessions: number;
  chargerCount: number;
}

export function HostDashboard({
  occupancyRatePercent,
  revenueCents,
  totalSessions,
  chargerCount,
}: HostDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Occupancy rate
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-amber-grid" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-mono font-bold">{occupancyRatePercent.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Across {chargerCount} charger(s)</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Revenue
          </CardTitle>
          <IndianRupee className="h-4 w-4 text-amber-grid" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-mono font-bold text-amber-grid">
            {formatCurrency(revenueCents)}
          </p>
          <p className="text-xs text-muted-foreground">Total earned</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Sessions
          </CardTitle>
          <Zap className="h-4 w-4 text-amber-grid" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-mono font-bold">{totalSessions}</p>
          <p className="text-xs text-muted-foreground">Completed charges</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Chargers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-mono font-bold">{chargerCount}</p>
          <p className="text-xs text-muted-foreground">Listed</p>
        </CardContent>
      </Card>
    </div>
  );
}
