# Arka Grid - Supabase Setup Guide

Complete step-by-step guide to configure Supabase for local development and deployment.

## Prerequisites

- Supabase account (free tier at https://supabase.com)
- Your project already has the `profiles` and `agent_mode` tables created
- Node.js 18+ and npm installed

---

## Step 1: Create `.env.local` File

Create a new file at the root of your project:

```bash
# Copy from the template
cp .env.example .env.local
```

Now edit `.env.local` and add your Supabase credentials:

```
# Get these from: https://supabase.com/dashboard/project/[your-project-ref]/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Mapbox token for maps
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjazI...
```

### How to Find Your Credentials:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Settings** (bottom left) → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

⚠️ **Important**:
- The `NEXT_PUBLIC_*` prefix is needed for these to work in the browser
- Never commit `.env.local` to Git (it's in `.gitignore`)
- These keys are safe to expose (they have Row Level Security)

---

## Step 2: Deploy Database Schema

Your project needs these tables. Run the SQL below in Supabase SQL Editor.

### 2.1 Live Energy Data Table (for realtime energy readings)

Go to **SQL Editor** in your Supabase dashboard and run:

```sql
-- Create live_energy_data table for dashboard
CREATE TABLE IF NOT EXISTS live_energy_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  solar_output_kw float8 DEFAULT 0,
  battery_percent integer DEFAULT 0,
  home_load_kw float8 DEFAULT 0,
  grid_to_user_kw float8 DEFAULT 0,
  user_to_grid_kw float8 DEFAULT 0,
  grid_price_cents integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT battery_percent_range CHECK (battery_percent >= 0 AND battery_percent <= 100)
);

-- Enable RLS
ALTER TABLE live_energy_data ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own energy data" ON live_energy_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own energy data" ON live_energy_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_live_energy_data_user_id ON live_energy_data(user_id);
CREATE INDEX idx_live_energy_data_created_at ON live_energy_data(created_at DESC);
```

### 2.2 Agent Thinking Logs Table (for agent decision history)

```sql
-- Create agent_thinking_logs table
CREATE TABLE IF NOT EXISTS agent_thinking_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_type text NOT NULL DEFAULT 'evaluating',
  message text NOT NULL,
  context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_log_type CHECK (log_type IN ('evaluating', 'detected', 'decision', 'action'))
);

-- Enable RLS
ALTER TABLE agent_thinking_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own logs
CREATE POLICY "Users can view own agent logs" ON agent_thinking_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent logs" ON agent_thinking_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_agent_thinking_logs_user_id ON agent_thinking_logs(user_id);
CREATE INDEX idx_agent_thinking_logs_created_at ON agent_thinking_logs(created_at DESC);
```

### 2.3 Trades Table (for tracking energy trades)

```sql
-- Create trades table for energy trading history
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  counterparty_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  energy_kwh float8 NOT NULL,
  price_per_kwh_cents integer NOT NULL,
  total_cost_cents integer NOT NULL,
  trade_type text NOT NULL DEFAULT 'buy',
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_trade_type CHECK (trade_type IN ('buy', 'sell')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- Enable RLS
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Users can view their own trades
CREATE POLICY "Users can view own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = counterparty_user_id);

CREATE POLICY "Users can insert trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_created_at ON trades(created_at DESC);
```

---

## Step 3: Enable Realtime for Tables

Realtime subscriptions allow the frontend to get live updates. Enable it for these tables:

1. Go to **Supabase Dashboard** → **Replication**
2. Find each table and toggle ON:
   - ✅ `live_energy_data`
   - ✅ `agent_thinking_logs`
   - ✅ `trades` (optional, for future use)

Or run this SQL:

```sql
-- Enable Realtime for live_energy_data
ALTER publication supabase_realtime ADD TABLE live_energy_data;

-- Enable Realtime for agent_thinking_logs
ALTER publication supabase_realtime ADD TABLE agent_thinking_logs;

-- Enable Realtime for trades
ALTER publication supabase_realtime ADD TABLE trades;
```

---

## Step 4: Configure OAuth Providers (Optional but Recommended)

OAuth allows users to sign up with Google or GitHub. To enable:

### 4.1 Google OAuth

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Click **Google**
3. Toggle **Enabled**
4. Follow the steps to create Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing
   - Enable **Google+ API**
   - Create OAuth 2.0 credentials (Web application)
   - Authorized redirect URIs: Add `https://your-project.supabase.co/auth/v1/callback`
5. Copy **Client ID** and **Client Secret** into Supabase form
6. Save

### 4.2 GitHub OAuth

1. In **Supabase Dashboard** → **Authentication** → **Providers**
2. Click **GitHub**
3. Toggle **Enabled**
4. Follow steps:
   - Go to GitHub → Settings → Developer settings → OAuth Apps
   - Create new OAuth App
   - **Authorization callback URL**: Set to `https://your-project.supabase.co/auth/v1/callback`
5. Copy **Client ID** and **Client Secret** into Supabase
6. Save

---

## Step 5: Verify Authentication Setup

Make sure auth is working by testing the login page:

```bash
npm run dev
```

1. Open http://localhost:3000/auth/login
2. Try signing up with email
3. Check that:
   - Profile is created in `profiles` table
   - `agent_mode` record is created with `mode: 'manual'`
   - You're redirected to `/dashboard`

---

## Step 6: Test Realtime Subscriptions

You can test realtime by sending live data from a different tab:

```javascript
// Open browser DevTools Console → Application → Local Storage → Copy your session ID
// Then in another browser tab, run this in console:

const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

// Insert test data
const { data, error } = await supabase
  .from('live_energy_data')
  .insert({
    solar_output_kw: 5.5,
    battery_percent: 85,
    home_load_kw: 2.3,
    grid_to_user_kw: 0,
    user_to_grid_kw: 0.5,
    grid_price_cents: 520
  });

console.log('Inserted:', data, 'Error:', error);

// In the logged-in tab, the dashboard should update in real-time!
```

---

## Step 7: Configure Environment Variables for Production

When deploying to Vercel or production:

1. Go to your hosting platform (e.g., Vercel)
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_MAPBOX_TOKEN` (if using maps)
3. Deploy

---

## Troubleshooting

### "Missing .env.local" error
- Make sure `.env.local` exists at project root
- File should have `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### "Authentication failed" on login
- Check that `profiles` table exists and has RLS enabled
- Verify `.env.local` has correct credentials
- Look at browser console for error messages

### "Realtime not updating"
- Verify table is enabled in **Replication** settings
- Check browser console for subscription errors
- Make sure RLS policies allow reading the data

### "OAuth providers not showing"
- Enable providers in **Authentication** → **Providers**
- Verify redirect URIs are correct (must include `/auth/v1/callback`)
- Check that Client ID/Secret are correct

---

## Next Steps

Once Supabase is set up:

1. ✅ **Authentication is ready** - Users can sign up and log in
2. Next: Update dashboard hooks to use `live_energy_data` table
3. Next: Add charger management for hosts
4. Next: Deploy to production

Your app is now connected to Supabase! 🚀
