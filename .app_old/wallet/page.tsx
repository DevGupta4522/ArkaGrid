"use client";

import { WalletCard, TransactionList } from "@/components/wallet";
import { SavingsPredictorCard } from "@/components/agents";
import { computeSavings } from "@/lib/agents/savings-predictor";

const MOCK_BALANCE = 24500;
const MOCK_EARNED = 12000;
const MOCK_SPENT = 8500;
const MOCK_TXS = [
  {
    id: "1",
    user_id: "u1",
    amount_cents: -850,
    type: "debit" as const,
    reference_type: "trade" as const,
    reference_id: "t1",
    description: "Charging session · CCS2",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    user_id: "u1",
    amount_cents: 1200,
    type: "credit" as const,
    reference_type: "trade" as const,
    reference_id: "t2",
    description: "Sold 12 kWh",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function WalletPage() {
  const savings = computeSavings(520, 80);

  return (
    <div className="min-h-screen bg-grid-bg">
      <header className="border-b border-grid-border bg-grid-surface/50 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center px-4">
          <h1 className="text-xl font-bold text-amber-grid">Smart Wallet</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <WalletCard
          balanceCents={MOCK_BALANCE}
          earnedCents={MOCK_EARNED}
          spentCents={MOCK_SPENT}
        />
        <SavingsPredictorCard comparison={savings} />
        <TransactionList transactions={MOCK_TXS} />
      </main>
    </div>
  );
}
