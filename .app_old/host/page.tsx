import { HostDashboard } from "@/components/host";

const MOCK_OCCUPANCY = 62.5;
const MOCK_REVENUE = 18500;
const MOCK_SESSIONS = 24;
const MOCK_CHARGER_COUNT = 3;

export default function HostPage() {
  return (
    <div className="min-h-screen bg-grid-bg">
      <header className="border-b border-grid-border bg-grid-surface/50 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center px-4">
          <h1 className="text-xl font-bold text-amber-grid">Host Dashboard</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <HostDashboard
          occupancyRatePercent={MOCK_OCCUPANCY}
          revenueCents={MOCK_REVENUE}
          totalSessions={MOCK_SESSIONS}
          chargerCount={MOCK_CHARGER_COUNT}
        />
      </main>
    </div>
  );
}
