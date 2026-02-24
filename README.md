# Arka Grid

Hardware-agnostic **P2P energy trading** and **EV charging** platform with an AI Autopilot layer.

## Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/UI, Lucide Icons
- **Backend/DB:** Supabase (Postgres, Auth, Edge Functions, Real-time)
- **Maps:** Mapbox GL JS
- **State:** TanStack Query (React Query)

## Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your NEXT_PUBLIC_SUPABASE_* and NEXT_PUBLIC_MAPBOX_TOKEN
npm run dev
```

## Mock data (Jaipur)

Generate 50 solar-prosumers and chargers in Jaipur:

```bash
npm run mock:seed
```

This writes `public/mock-chargers.json` and `public/mock-prosumers.json`. The Discovery Map loads chargers from this file when localStorage is empty.

## Features

- **Discovery Engine:** Interactive map with filters (Connector Type, Speed, Availability)
- **Smart Wallet:** In-app balance, Earned vs Spent, transaction history (simulated)
- **Host Dashboard:** Occupancy rate and revenue for energy/charger hosts
- **QR:** Logic for scanning Charger ID to start a session (`lib/qr/scan-session.ts`)
- **Autopilot Agent:** Background logic to trade based on battery level and grid price
- **Grid Shield:** Simulated local grid health score; pauses trades when stressed
- **Savings Predictor:** Arka vs JVVNL price comparison and saved amount

## Project structure

```
/app                 # App Router pages (home, control-room, map, wallet, host)
/components          # UI: map, wallet, host, agents, control-room, ui
/lib                 # agents (autopilot, grid-shield, savings-predictor), supabase, data, qr
/hooks               # useChargers, useGridHealth
/types               # Shared TS types
/supabase/migrations # SQL schema (profiles, chargers, trades, agent_decisions, wallet_transactions)
/scripts             # seed-mock-data.ts
```

## Database

Apply the schema in `supabase/migrations/001_arka_grid_schema.sql` via the Supabase SQL Editor or CLI.

## Control Room

Dashboard with live energy flow diagram and **Agent Status** toggle (Manual vs Autopilot). Grid Shield and Savings Predictor cards are on the same page.

---

**Arka Grid** – Dark-mode, high-end tech aesthetic.
