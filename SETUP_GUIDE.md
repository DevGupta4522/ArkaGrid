# 🚀 ArkaGrid - Complete Setup Guide

## ✅ What Has Been Built

### Backend (Express.js + PostgreSQL)
✅ Complete RESTful API with 20+ endpoints
✅ JWT authentication with refresh token rotation  
✅ Database schema with 7 tables (users, listings, trades, meter readings, ratings, refresh tokens, wallets)
✅ Smart escrow system with payment locking
✅ Automatic refund job for expired trades
✅ Full error handling with structured responses
✅ Role-based access control (prosumer, consumer, admin)

### Frontend (React + React Router v6)
✅ 8 complete pages with Tailwind CSS styling
✅ Authentication flow (login/register with validation)
✅ Role-based navigation
✅ Marketplace for browsing energy listings
✅ Trade management with real-time status tracking
✅ Wallet with test fund management
✅ Admin dispute resolution dashboard
✅ Toast notifications & loading states
✅ Protected routes

### Database
✅ PostgreSQL schema with indexes
✅ Seed data (5 test users + 3 sample listings)
✅ UUID primary keys for blockchain Phase 2 readiness

### Shared
✅ Constants file with all enums (roles, statuses, platform config)

---

## 🔧 Installation & Setup (Step by Step)

### Step 1: Prerequisites Check

Ensure you have installed:
```bash
node --version          # Should be v16+
npm --version          # Should be v8+
postgres --version     # Should be v12+
```

Not installed? Download from:
- Node.js: https://nodejs.org/
- PostgreSQL: https://www.postgresql.org/download/

### Step 2: Create Database

Open PostgreSQL console and create the database:

**Windows (using psql):**
```bash
psql -U postgres
```

Then in psql:
```sql
CREATE DATABASE arkagrid;
\q
```

**Mac/Linux:**
```bash
createdb arkagrid
```

### Step 3: Clone Environment Files

In the project root (`d:\ArkaGrid`):

```bash
# Copy the template
copy .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/arkagrid
JWT_SECRET=9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b
JWT_REFRESH_SECRET=1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
PLATFORM_FEE_PERCENT=2.5
DELIVERY_TIMEOUT_MINUTES=60
VITE_API_BASE_URL=http://localhost:5000/api
```

To generate secure secrets:
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex')); console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Install Dependencies

```bash
# Install all dependencies (root, server, client)
npm run install:all
```

This will install:
1. Root dependencies (concurrently)
2. Server dependencies (express, pg, bcrypt, etc.)
3. Client dependencies (react, react-router, axios, etc.)

**Installation may take 5-10 minutes. Be patient!**

### Step 5: Setup Database Schema & Seed

```bash
npm run server:db:setup
```

This will:
1. ✅ Create all tables (users, listings, trades, meter_readings, ratings, refresh_tokens)
2. ✅ Insert 5 test users (2 prosumers, 2 consumers, 1 admin)
3. ✅ Insert 3 sample energy listings
4. ✅ Print test account credentials

**Output:**
```
✨ Database setup complete!

Test accounts created:
Prosumer 1: prosumer1@test.com / Test@123
Prosumer 2: prosumer2@test.com / Test@123
Consumer 1: consumer1@test.com / Test@123
Consumer 2: consumer2@test.com / Test@123
Admin:      admin@test.com / Admin@123
```

### Step 6: Start Development Servers

```bash
npm run dev
```

This starts both servers concurrently:
- **Backend**: http://localhost:5000 (Express with hot reload)
- **Frontend**: http://localhost:3000 (Vite with hot reload)

**First start may take 1-2 minutes. Browser will auto-open to http://localhost:3000**

---

## 🧪 Quick Test Walkthrough (5 minutes)

### Test 1: Consumer Buys Energy

**Step 1:** Open http://localhost:3000
- Click "Login"
- Email: `consumer1@test.com`
- Password: `Test@123`

**Step 2:** You're in Consumer Dashboard
- See "Nearby Listings: 3"
- Click "Marketplace" in navbar

**Step 3:** Browse Listings
- See 3 listings from prosumer1
- Click "Buy Energy" on any listing

**Step 4:** Place Order
- Enter units: `2`
- See total calculate: ₹13 + fee
- Click "Confirm & Lock Escrow"
- ✅ Payment locked!

**Step 5:** Go to "My Trades"
- See active trade in "Delivering" status
- Countdown timer shows: 60 minutes

### Test 2: Prosumer Delivers Energy

**Step 1:** Logout & login as prosumer
- Email: `prosumer1@test.com`
- Password: `Test@123`

**Step 2:** Go to "My Trades"
- See trade in "Delivering" status
- Click "Mark as Delivered"
- ✅ Meter reading recorded

**Step 3:** Trade now shows "Completing"
- Waiting for consumer confirmation

### Test 3: Consumer Confirms Receipt

**Step 1:** Logout & login as consumer again
- Email: `consumer1@test.com`

**Step 2:** Go to "My Trades"
- See "Completing" status
- Click "Confirm Receipt"
- ✅ Trade completed!
- Prosumer receives payment

**Step 4:** Check Wallet
- Balance deducted (cost + fee)
- Transaction appears in history

### Test 4: Add Funds to Wallet

**Step 1:** In Marketplace, try to buy more energy
- Your wallet might be low

**Step 2:** Go to "Wallet"
- Click "Add Funds"
- Enter: `3000`
- ✅ Balance increases immediately

### Test 5: Admin Resolves Dispute

**Step 1:** Cause a trade to fail (don't confirm within 60 min)
- Or manually dispute it

**Step 2:** Logout & login as admin
- Email: `admin@test.com`
- Password: `Admin@123`

**Step 3:** Go to "Admin Dashboard" → "Disputes"
- See disputed trades
- Choose resolution: Release/Refund/Partial
- ✅ Settlement executed

---

## 📊 Project Statistics

| Category | Count |
|----------|-------|
| API Endpoints | 20+ |
| Frontend Pages | 8 |
| Database Tables | 7 |
| React Components | 15+ |
| Test Accounts | 5 |
| Sample Listings | 3 |
| Lines of Code (Backend) | ~2000 |
| Lines of Code (Frontend) | ~2500 |

---

## 🔍 Key Files to Explore

### Backend Structure
```
server/
├── index.js                    # Main server entry
├── controllers/
│   ├── authController.js       # Login/Register logic
│   ├── listingsController.js   # Energy listing CRUD
│   ├── tradesController.js     # Trade & escrow logic
│   └── walletController.js     # Wallet operations
├── routes/
│   ├── auth.js                 # /api/auth/* routes
│   ├── listings.js             # /api/listings/* routes
│   ├── trades.js               # /api/trades/* routes
│   └── wallet.js               # /api/wallet/* routes
├── middleware/
│   ├── auth.js                 # JWT verification
│   └── errorHandler.js         # Global error handling
├── jobs/
│   └── escrowTimeout.js        # Auto-refund job (every 5 min)
└── db/
    ├── schema.sql              # Database tables
    ├── connection.js           # PostgreSQL pool
    └── setup.js                # Seed initial data
```

### Frontend Structure
```
client/
└── src/
    ├── App.jsx                 # Main router setup
    ├── pages/
    │   ├── Login.jsx           # Authentication
    │   ├── Register.jsx        # User signup
    │   ├── Dashboard.jsx       # Role-based overview
    │   ├── Marketplace.jsx     # Buy energy
    │   ├── MyListings.jsx      # Prosumer listings
    │   ├── MyTrades.jsx        # Active trades
    │   ├── TradeDetail.jsx     # Trade details
    │   ├── Wallet.jsx          # Consumer wallet
    │   └── AdminDisputes.jsx   # Admin resolution
    ├── components/
    │   ├── Navbar.jsx          # Navigation
    │   ├── ProtectedRoute.jsx  # Auth guard
    │   ├── StatusBadge.jsx     # Status colors
    │   ├── CountdownTimer.jsx  # Delivery timer
    │   ├── Toast.jsx           # Notifications
    │   ├── LoadingSpinner.jsx  # Loading states
    │   └── EmptyState.jsx      # Empty states
    ├── context/
    │   ├── AuthContext.jsx     # User state
    │   └── ToastContext.jsx    # Notifications state
    ├── hooks/
    │   └── useContext.js       # Custom hooks
    └── api/
        ├── config.js           # Axios setup + interceptors
        ├── auth.js             # Auth API calls
        ├── listings.js         # Listings API calls
        ├── trades.js           # Trades API calls
        └── wallet.js           # Wallet API calls
```

---

## 🐛 Troubleshooting

### Issue: "ECONNREFUSED::5432 - Database connection failed"

**Solution:** PostgreSQL not running
```bash
# Start PostgreSQL

# Windows: Command Prompt as Admin
pg_ctl -D "C:\Program Files\PostgreSQL\14\data" start

# Mac: Using Homebrew
brew services start postgresql

# Linux: Using systemctl
sudo systemctl start postgresql
```

### Issue: "Port 3000 already in use"

**Solution:** Kill existing process on port 3000
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Issue: "Dependencies installation fails"

**Solution:** Clear npm cache and retry
```bash
npm cache clean --force
npm run install:all
```

### Issue: "Database already exists" error during setup

**Solution:** Drop old database and restart
```bash
dropdb arkagrid
npm run server:db:setup
```

### Issue: Axios CORS errors in browser console

**Solution:** Make sure backend is running on port 5000
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Should return: {"success": true, "message": "Server is running"}
```

---

## 🎯 Next Steps (What to Build/Extend)

### Short-term (This Week)
1. ✅ Test all workflows thoroughly
2. ✅ Add rate limiting to API
3. ✅ Implement email notifications
4. ✅ Add profile pages (edit name, phone, etc.)
5. ✅ Implement rating system for trades

### Medium-term (This Month)
1. 🚀 Real payment gateway (Razorpay API)
2. 🚀 Real smart meter API integration
3. 🚀 Blockchain transaction logging (Polygon)
4. 🚀 Email verification
5. 🚀 Password reset flow

### Long-term (Next Quarter)
1. 🚀 Mobile app (React Native)
2. 🚀 Analytics dashboard
3. 🚀 Multi-language support
4. 🚀 Automated AI dispute resolution
5. 🚀 Community forum

---

## 📚 Learning Resources

### Understanding the Codebase
- **Backend Flow**: `server/index.js` → `routes/` → `controllers/` → `db/`
- **Frontend Flow**: `App.jsx` → `pages/` → `components/` → `api/`
- **State Management**: `context/AuthContext.jsx` + `context/ToastContext.jsx`

### Important Concepts
- **JWT Tokens**: Stored in localStorage (access) + cookies (refresh)
- **Escrow**: Locked funds in `trades.escrow_status` 
- **Roles**: Controlled via `users.role` + `requireRole()` middleware
- **Timers**: Background job checks `delivery_deadline` every 5 minutes

---

## 📞 Support & Questions

For issues:
1. Check logs in terminal (backend errors show in server console)
2. Check browser DevTools → Network (API errors)
3. Check browser DevTools → Console (frontend errors)
4. See Troubleshooting section above

Common error messages:
- `INVALID_CREDENTIALS` → Wrong email/password
- `INSUFFICIENT_BALANCE` → Not enough wallet money
- `INSUFFICIENT_UNITS` → Listing ran out of energy
- `ACTIVE_TRADES` → Can't update listing while trade is pending
- `TOKEN_EXPIRED` → Need to refresh (automatic in interceptor)

---

## ✨ Congratulations!

You now have a fully functional ArkaGrid Energy Trading platform!

**What you can do:**
- ✅ Create accounts (prosumer/consumer/admin)
- ✅ List energy for sale (prosumers)
- ✅ Browse nearby listings (consumers)
- ✅ Buy energy with escrow protection
- ✅ Confirm delivery & receipt
- ✅ Resolve disputes (admin)
- ✅ Track wallet & transactions

**Ready to deploy to production? See DEPLOYMENT_GUIDE.md**

---

Made with ❤️ for a sustainable energy future.
