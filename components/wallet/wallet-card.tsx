"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

interface WalletCardProps {
  balanceCents: number;
  earnedCents: number;
  spentCents: number;
}

export function WalletCard({ balanceCents, earnedCents, spentCents }: WalletCardProps) {
  return (
    <Card className="border-amber-grid/30 bg-grid-surface">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="h-4 w-4 text-amber-grid" />
          Smart Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-2xl font-mono font-bold text-amber-grid">
          {formatCurrency(balanceCents)}
        </p>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1 text-emerald-500">
            <TrendingUp className="h-4 w-4" />
            Earned {formatCurrency(earnedCents)}
          </span>
          <span className="flex items-center gap-1 text-rose-500">
            <TrendingDown className="h-4 w-4" />
            Spent {formatCurrency(spentCents)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
