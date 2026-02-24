"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { WalletTransaction } from "@/types";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface TransactionListProps {
  transactions: WalletTransaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Transaction history</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 max-h-[280px] overflow-y-auto">
          {transactions.length === 0 ? (
            <li className="text-sm text-muted-foreground">No transactions yet.</li>
          ) : (
            transactions.slice(0, 20).map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between py-2 border-b border-grid-border last:border-0"
              >
                <div className="flex items-center gap-2">
                  {tx.type === "credit" ? (
                    <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-rose-500" />
                  )}
                  <span className="text-sm">
                    {tx.description ?? tx.reference_type}
                  </span>
                </div>
                <span
                  className={
                    tx.type === "credit"
                      ? "text-emerald-500 font-mono"
                      : "text-rose-500 font-mono"
                  }
                >
                  {tx.type === "credit" ? "+" : "-"}
                  {formatCurrency(Math.abs(tx.amount_cents))}
                </span>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
