# ⚡ ArkaGrid — P2P Neighbourhood Energy Trading Platform

ArkaGrid lets rooftop solar panel owners (Prosumers) sell surplus electricity directly to neighbours (Consumers) at a price lower than the government DISCOM grid rate — with **escrow-based payment protection**.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL (via `pg` library) |
| Auth | JWT access tokens + httpOnly refresh token cookies |

## 📁 Project Structure

```
/client              → React frontend (Vite)
  /src/api           → API client (axios with interceptors)
  /src/components    → Reusable UI components
  /src/context       → Auth + Toast context providers
  /src/hooks         → Custom hooks (useAuth, useToast)
  /src/pages         → Route pages
/server              → Express backend
  /controllers       → Route handlers
  /routes            → Express route definitions
  /middleware        → Auth + error handler middleware
  /db                → Schema, seed, connection
  /jobs              → Background jobs (escrow timeout)
/shared              → Shared constants (roles, statuses)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm

### 1. Clone & Install
```bash
git clone <repo-url>
cd ArkaGrid
npm run install:all
```

### 2. Set Up Environment
```bash
cp .env.example .env.local
# Edit .env.local with your PostgreSQL credentials
```

### 3. Set Up Database
```bash
# Create the database first
createdb arkagrid

# Run schema + seed data
cd server && npm run db:setup
```

### 4. Run Development Server
```bash
# From root directory — runs both client & server
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

### 5. Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Prosumer | prosumer1@test.com | Test@123 |
| Prosumer | prosumer2@test.com | Test@123 |
| Consumer | consumer1@test.com | Test@123 |
| Consumer | consumer2@test.com | Test@123 |
| Admin | admin@test.com | Admin@123 |

## 📡 API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Listings
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/listings` | List active listings |
| GET | `/api/listings/my` | Prosumer's own listings |
| GET | `/api/listings/:id` | Single listing |
| POST | `/api/listings` | Create listing (prosumer) |
| PATCH | `/api/listings/:id` | Update listing (prosumer) |
| DELETE | `/api/listings/:id` | Cancel listing (prosumer) |

### Trades
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/trades` | Create trade (consumer) |
| GET | `/api/trades/my` | User's trades |
| GET | `/api/trades/:id` | Trade detail |
| POST | `/api/trades/:id/confirm-delivery` | Mark delivered (prosumer) |
| POST | `/api/trades/:id/confirm-receipt` | Confirm receipt (consumer) |
| POST | `/api/trades/:id/dispute` | Raise dispute (consumer) |

### Wallet
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/wallet/balance` | Get balance |
| POST | `/api/wallet/add-funds` | Add test funds |
| GET | `/api/wallet/transactions` | Transaction history |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/disputes` | Disputed trades |
| POST | `/api/admin/trades/:id/resolve` | Resolve dispute |

## 🔒 Escrow Flow

1. Consumer places order → payment **locked in escrow**
2. 60-minute countdown starts
3. Prosumer marks energy as delivered
4. Consumer confirms receipt
5. Escrow releases payment to prosumer (minus 2.5% platform fee)
6. If undelivered within deadline → **auto-refund to consumer**

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run client + server concurrently |
| `npm run server:dev` | Run server only |
| `npm run client:dev` | Run client only |
| `npm run install:all` | Install all dependencies |
| `cd server && npm run db:setup` | Set up database schema + seed |
| `cd server && npm run db:reset` | Drop all tables |
