import Link from "next/link";
import { MapPin, Wallet, LayoutDashboard, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-grid-bg">
      <header className="border-b border-grid-border bg-grid-surface/50 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-emerald-electric">Arka</h1>
          <nav className="flex gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/control-room">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Control Room
              </Button>
            </Link>
            <Link href="/map">
              <Button variant="ghost" size="sm">
                <MapPin className="mr-2 h-4 w-4" />
                Map
              </Button>
            </Link>
            <Link href="/wallet">
              <Button variant="ghost" size="sm">
                <Wallet className="mr-2 h-4 w-4" />
                Wallet
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <section className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-emerald-electric font-mono text-sm uppercase tracking-wider mb-2">
            P2P Energy & EV Charging
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Trade energy. Charge smart.
          </h2>
          <p className="text-muted-foreground text-lg">
            Hardware-agnostic platform with an AI Autopilot that buys and sells
            based on battery level and grid price. Discover chargers, pay with
            the in-app wallet, and see exactly how much you save vs JVVNL.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard">
            <div className="rounded-xl border border-grid-border bg-grid-surface p-6 hover:border-emerald-electric/50 transition-colors h-full ring-emerald-electric/20 ring-1">
              <Zap className="h-8 w-8 text-emerald-electric mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Pro Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Real-time analytics · Energy flows · Agent thinking · Heat maps
              </p>
            </div>
          </Link>
          <Link href="/map">
            <div className="rounded-xl border border-grid-border bg-grid-surface p-6 hover:border-amber-grid/50 transition-colors h-full">
              <MapPin className="h-8 w-8 text-amber-grid mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Discovery Engine</h3>
              <p className="text-sm text-muted-foreground">
                Interactive map · Type 2, CCS2 · AC/DC filters · Availability
              </p>
            </div>
          </Link>
          <Link href="/wallet">
            <div className="rounded-xl border border-grid-border bg-grid-surface p-6 hover:border-amber-grid/50 transition-colors h-full">
              <Wallet className="h-8 w-8 text-amber-grid mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Smart Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Simulated UPI/Razorpay · Earned vs Spent · Transaction history
              </p>
            </div>
          </Link>
          <Link href="/control-room">
            <div className="rounded-xl border border-grid-border bg-grid-surface p-6 hover:border-amber-grid/50 transition-colors h-full">
              <LayoutDashboard className="h-8 w-8 text-amber-grid mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Control Room</h3>
              <p className="text-sm text-muted-foreground">
                Live energy flow · Agent status (Manual / Autopilot) · Grid Shield
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
