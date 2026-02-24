# How to Run Arka Grid Locally

Quick start guide to run your Arka Grid application on your local machine.

---

## Prerequisites

Make sure you have installed:
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for version control)

Verify installation:
```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 9.0.0 or higher
```

---

## Step 1: Navigate to Project Directory

```bash
cd d:/ArkaGrid
# or on Mac/Linux:
# cd ~/ArkaGrid
```

Verify you're in the right folder:
```bash
ls
# You should see: app, components, lib, hooks, public, package.json, etc.
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages from `package.json`:
- Next.js 15
- React 19
- Tailwind CSS
- Supabase
- Mapbox
- React Query
- And more...

**Time**: ~2-3 minutes (first time)

---

## Step 3: Configure Environment Variables

Create `.env.local` file in the project root:

```bash
# On Windows (PowerShell):
New-Item -Path .env.local -ItemType File

# On Mac/Linux:
touch .env.local
```

Open `.env.local` and add your Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mapbox Configuration (optional, for maps)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjazI...
```

**How to get credentials:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your **Arka** project
3. Click **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 4: Start Development Server

```bash
npm run dev
```

You should see output like:
```
> next dev --turbopack

  ▲ Next.js 15.0.3
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

✓ Ready in 3.2s
```

---

## Step 5: Open in Browser

Go to: **http://localhost:3000**

You should see the **Arka Grid** home page with:
- Header with "Arka" branding
- Feature cards (Discovery Engine, Smart Wallet, Dashboard)
- Navigation links

---

## Available Routes to Test

Once running, visit these pages:

### Public Routes (No login needed)
- **Home**: http://localhost:3000
- **Map**: http://localhost:3000/map
- **Login**: http://localhost:3000/auth/login
- **Signup**: http://localhost:3000/auth/signup
- **Forgot Password**: http://localhost:3000/auth/forgot-password

### Protected Routes (Requires login)
- **Dashboard**: http://localhost:3000/dashboard
- **Control Room**: http://localhost:3000/control-room
- **Profile**: http://localhost:3000/profile
- **Wallet**: http://localhost:3000/wallet
- **Host Dashboard**: http://localhost:3000/host
- **Admin Dashboard**: http://localhost:3000/admin

---

## Test the Application

### 1. Sign Up
1. Click **"Sign up"** on home page or go to `/auth/signup`
2. Enter email and password
3. Select role: **Consumer**, **Prosumer**, or **Host**
4. Accept terms & click **Sign Up**
5. You should be redirected to `/dashboard`

### 2. Log In
1. Go to `/auth/login`
2. Enter your email & password
3. Click **Sign In**
4. Should redirect to `/dashboard`

### 3. View Dashboard
1. On dashboard, you'll see:
   - Real-time metrics (Savings, Battery, Revenue, Grid Status)
   - Animated energy flow diagram
   - Agent thinking terminal
   - Power charts
   - Solar surplus map

### 4. Test Profile
1. Click profile icon or go to `/profile`
2. View account info
3. Change password
4. Click **Logout**

---

## Troubleshooting

### "Cannot find module" Error
```bash
# Solution: Reinstall dependencies
rm -rf node_modules
npm install
npm run dev
```

### ".env.local not found" Error
```bash
# Make sure .env.local exists in project root
# With your Supabase credentials
```

### Port 3000 Already in Use
```bash
# Run on different port:
npm run dev -- -p 3001

# Then visit: http://localhost:3001
```

### Supabase Connection Issues
- Verify `.env.local` has correct credentials
- Check internet connection
- Verify Supabase project is active
- Check browser console for error messages: `F12` → Console tab

### Database Tables Not Found
- Run migrations in Supabase SQL Editor
- Paste SQL from `SUPABASE_SETUP.md`
- Run tables creation scripts

---

## Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Generate mock data (50 chargers in Jaipur)
npm run mock:seed
```

---

## Accessing From Other Devices

To access from your phone or other computers on same network:

```bash
# Get your local IP:
# On Windows (PowerShell):
ipconfig

# On Mac/Linux:
ifconfig

# Then visit: http://YOUR_IP:3000
# Example: http://192.168.1.100:3000
```

---

## Hot Reload & Live Updates

**Hot Reload** is already enabled:
- Edit any `.tsx` or `.css` file
- Changes appear instantly in browser (no restart needed)
- Perfect for development!

---

## Stop the Server

Press `Ctrl + C` in terminal to stop the development server.

---

## Next Steps

1. ✅ Run locally (`npm run dev`)
2. ✅ Sign up & test authentication
3. ✅ Explore dashboard features
4. ✅ Test Google OAuth (if configured)
5. ✅ Generate mock data (`npm run mock:seed`)
6. ✅ Deploy to production when ready

---

## Need Help?

- **Setup issues?** Check `SUPABASE_SETUP.md`
- **Deployment?** Check `DEPLOYMENT_GUIDE.md`
- **Google OAuth?** Check `GOOGLE_OAUTH_SETUP.md`
- **Browser errors?** Open DevTools: `F12` → Console tab

Your app is ready! 🚀
