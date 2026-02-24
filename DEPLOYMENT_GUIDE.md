# Arka Grid - Deployment Guide

Complete instructions to get your application running locally and deploy to production.

---

## Phase 1: Local Development Setup

### 1.1 Install Dependencies

```bash
cd d:/ArkaGrid
npm install
```

All required dependencies are already in `package.json`:
- Supabase (auth + realtime database)
- React Query (data fetching & caching)
- Tailwind CSS (styling with custom colors)
- Framer Motion (animations)
- Recharts (charting)
- Mapbox GL (map visualization)

### 1.2 Configure Environment Variables

Create `.env.local` at project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mapbox Configuration (optional, for maps)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjazI...
```

**How to get your credentials:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Settings** → **API**
4. Copy Project URL and anon key

### 1.3 Deploy Database Schema

Follow the complete guide in `SUPABASE_SETUP.md`:

```bash
# Step-by-step:
1. Open Supabase Dashboard → SQL Editor
2. Create tables:
   - live_energy_data (energy readings)
   - agent_thinking_logs (agent decisions)
   - trades (energy trading)
3. Enable Realtime on each table
4. Verify RLS policies are in place
```

### 1.4 Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Phase 2: Test Authentication & Routes

### 2.1 Test Public Routes

```
✅ http://localhost:3000 - Home page (available)
✅ http://localhost:3000/auth/login - Login page (available)
✅ http://localhost:3000/auth/signup - Signup page (available)
✅ http://localhost:3000/map - Map page (available)
```

### 2.2 Test Authentication Flow

1. **Sign Up**:
   - Go to `/auth/signup`
   - Select role: Consumer, Prosumer, or Host
   - Enter email & password (min 6 chars)
   - Verify profile created in Supabase `profiles` table
   - Verify `agent_mode` record created with `mode: 'manual'`

2. **Log In**:
   - Go to `/auth/login`
   - Use email & password from signup
   - Should redirect to `/dashboard`

3. **Profile Access**:
   - Authenticated users can access `/profile`
   - Change password, view account info
   - Logout button available

4. **Protected Routes** (require auth):
   - ❌ `/dashboard` - Redirects to login if not authenticated
   - ❌ `/wallet` - Redirects to login
   - ❌ `/profile` - Redirects to login
   - ❌ `/host` - Redirects to login (also checks role)
   - ❌ `/admin` - Redirects to login (admin only)

### 2.3 Test OAuth (Optional)

If you configured OAuth providers in Supabase:

1. **Google OAuth**:
   - Click "Sign in with Google" on login page
   - Auto-creates profile with Google email & name

2. **GitHub OAuth**:
   - Click "Sign in with GitHub" on login page
   - Auto-creates profile with GitHub username

---

## Phase 3: Test Dashboard Features

### 3.1 Real-Time Energy Data

After logging in, visit `/dashboard`:

```
✅ Real-time stats display
✅ Animated energy flow SVG
✅ Agent thinking terminal (shows mock logs)
✅ Power charts (Solar, Battery, Trade history)
✅ Mapbox heatmap (solar surplus map)
```

**To see live data updates:**

1. Insert test data into `live_energy_data` table:

```sql
INSERT INTO live_energy_data (
  user_id,
  solar_output_kw,
  battery_percent,
  home_load_kw,
  grid_to_user_kw,
  user_to_grid_kw,
  grid_price_cents
) VALUES (
  'YOUR_USER_ID',
  4.5,      -- 4.5 kW solar
  85,       -- 85% battery
  2.1,      -- 2.1 kW home load
  0,        -- No grid supply
  2.4,      -- 2.4 kW to grid
  520       -- ₹5.20/kWh
);
```

2. Watch dashboard update in real-time (within 100ms)
3. Energy flow SVG animation speed changes with solar output
4. Stats cards animate on value changes

### 3.2 Agent Thinking Terminal

Terminal displays agent decision logs:

```
[14:32:45] evaluating: Evaluating grid price: ₹5.20/kWh
[14:32:48] detected: JVVNL peak detected: +12% surcharge active
[14:32:50] decision: Decision: Discharge to grid (₹127 revenue)
[14:32:52] action: Discharging 1.5 kW to Neighbor B
```

To test with real data:

```sql
INSERT INTO agent_thinking_logs (
  user_id,
  log_type,
  message,
  context
) VALUES (
  'YOUR_USER_ID',
  'evaluating',
  'Evaluating grid price: ₹5.20/kWh',
  '{"price": 5.20}'
);
```

### 3.3 Trade Statistics

Dashboard shows:
- **Savings Today**: ₹X (calculated from buy trades below JVVNL rate)
- **Revenue This Month**: ₹X (sum of sell trades)
- **Trades Today**: N completed trades
- **This Month**: N trades

Test by inserting trades:

```sql
INSERT INTO trades (
  user_id,
  energy_kwh,
  price_per_kwh_cents,
  total_cents,
  trade_type,
  status
) VALUES (
  'YOUR_USER_ID',
  2.5,        -- 2.5 kWh
  450,        -- ₹4.50/kWh
  1125,       -- Total ₹11.25
  'sell',     -- Selling
  'completed'
);
```

---

## Phase 4: Role-Based Access

### 4.1 Consumer Role (Default)

```
✅ Can access: /dashboard, /profile, /wallet
❌ Cannot access: /host, /admin
```

### 4.2 Host Role

```
✅ Can access: /dashboard, /profile, /host, /wallet
❌ Cannot access: /admin
```

- Visit `/host` to see host dashboard with charger stats
- Shows: Occupancy rate, revenue, sessions, charger count

### 4.3 Admin Role

```
✅ Can access: /dashboard, /profile, /admin, /wallet
```

Update user role in Supabase:

```sql
UPDATE profiles
SET role = 'host'
WHERE id = 'USER_ID';
```

---

## Phase 5: Build & Production Deployment

### 5.1 Build Locally

```bash
npm run build
npm start
```

Verify:
- ✅ No TypeScript errors
- ✅ No build warnings
- ✅ App starts on http://localhost:3000

### 5.2 Deploy to Vercel (Recommended)

Vercel is the easiest way to deploy Next.js apps:

#### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Arka Grid with full auth & dashboard"
git remote add origin https://github.com/YOUR_USERNAME/arka-grid.git
git branch -M main
git push -u origin main
```

#### Step 2: Connect to Vercel

1. Go to [Vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_MAPBOX_TOKEN` (optional)
5. Click "Deploy"

#### Step 3: Configure Custom Domain (Optional)

In Vercel project settings:
- Add your custom domain
- Update DNS records as shown in Vercel
- Takes ~5 minutes to propagate

### 5.3 Update Supabase OAuth Redirect URIs

When deployed, update OAuth redirect URL in Supabase:

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. For each provider, add:
   - `https://your-domain.com/auth/v1/callback`
3. Save

---

## Phase 6: Testing Checklist

### Before Going Live

- [ ] Authentication works (signup/login/logout)
- [ ] OAuth providers work (if configured)
- [ ] Dashboard loads and displays data
- [ ] Real-time updates work (Supabase Realtime)
- [ ] Protected routes redirect unauthenticated users
- [ ] Role-based access control works
- [ ] Mobile responsive design works
- [ ] No console errors in browser
- [ ] Environment variables are set in production

### Performance Check

```bash
npm run build
# Check: Build time <60s
# Check: No warnings about missing dependencies
# Check: Bundle size reasonable (~500KB gzipped)
```

### Browser Testing

Test in:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## Phase 7: Monitoring & Maintenance

### Monitor Production Issues

```bash
# Check Vercel deployment logs:
1. Go to Vercel.com → Your Project → Deployments
2. Click latest deployment
3. Check "Logs" tab for errors
```

### Monitor Supabase

```
1. Supabase Dashboard → Monitoring
2. Check: Database health, realtime connections, API usage
3. Check: Auth events, failed logins
```

### Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Missing SUPABASE_URL" error | Add `.env.local` with correct credentials |
| OAuth not working | Check redirect URI in Supabase matches your domain |
| Real-time not updating | Verify Realtime is enabled on tables in Supabase |
| Slow dashboard loads | Check if live_energy_data table has indexes |
| Auth redirects to login loop | Clear browser cookies, check session in Supabase |

---

## Phase 8: Next Features (Roadmap)

Ready to add after launch:

1. **Enhanced Host Dashboard**
   - Charger management (add, edit, delete)
   - Charger utilization analytics
   - Revenue per-charger breakdown
   - Pricing configuration UI

2. **Advanced Trading**
   - P2P energy trading with neighbors
   - Smart contracts for trades
   - Price prediction AI

3. **Mobile App**
   - React Native version
   - Offline functionality
   - Push notifications

4. **Admin Portal**
   - User management
   - Dispute resolution
   - Analytics dashboard

---

## Quick Reference

**Important URLs:**
- Homepage: `/`
- Login: `/auth/login`
- Signup: `/auth/signup`
- Dashboard: `/dashboard`
- Profile: `/profile`
- Host: `/host`
- Admin: `/admin`
- Control Room: `/control-room`
- Map: `/map`

**Key Files:**
- Authentication: `lib/auth/auth-context.tsx`
- Dashboard: `app/dashboard/page.tsx`
- Host: `app/host/page.tsx`
- Middleware: `middleware.ts`
- Styling: `tailwind.config.ts`, `app/globals.css`

**Supabase Tables:**
- `auth.users` - User accounts
- `profiles` - User metadata (name, role, avatar)
- `agent_mode` - Agent automation setting
- `live_energy_data` - Real-time energy readings
- `agent_thinking_logs` - Agent decision history
- `trades` - Energy trade records

---

## Support

If you encounter issues:

1. Check browser console for errors: `F12` → Console tab
2. Check Supabase logs: Dashboard → Logs
3. Check Vercel logs: Project → Deployments → View logs
4. Review `SUPABASE_SETUP.md` for configuration help

You're all set! Your Arka Grid application is production-ready. 🚀
