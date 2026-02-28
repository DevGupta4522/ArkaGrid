# P2P Neighbourhood Energy Trading Platform

**ArkaGrid** - Buy and sell renewable energy directly with your neighbors

## 🌟 What is ArkaGrid?

A peer-to-peer energy trading platform where:
- **Prosumers** (solar panel owners) sell surplus electricity to **Consumers** at rates lower than grid rates
- **Consumers** save money buying from neighbors instead of their utility company
- Built-in **escrow system** ensures trustless transactions - payment is locked until energy delivery is confirmed

### Key Features:
✅ **Smart Escrow**: Consumer payment locked until delivery confirmed  
✅ **Automatic Refunds**: Failed deliveries auto-refund within 60 minutes  
✅ **Rating System**: Build trust through community ratings  
✅ **Real-time Tracking**: Monitor energy delivery in real-time  
✅ **Admin Dashboard**: Resolve disputes and manage platform  

---

## 📋 Project Structure

```
ArkaGrid/
├── server/                 # Node.js + Express backend
│   ├── routes/            # API endpoints
│   ├── controllers/        # Business logic
│   ├── middleware/        # Auth, error handling
│   ├── db/               # PostgreSQL schema & setup
│   ├── jobs/             # Background jobs (escrow timeout)
│   └── index.js          # Main server
├── client/                # React + Router v6 frontend
│   ├── src/
│   │   ├── pages/        # Route pages
│   │   ├── components/   # Reusable components
│   │   ├── api/          # API client
│   │   ├── context/      # Auth & Toast contexts
│   │   ├── hooks/        # Custom hooks
│   │   └── App.jsx       # Main app
│   └── tailwind.config.js
├── shared/               # Shared constants
├── .env.example          # Environment template
└── package.json          # Root package (has scripts)
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ 
- **PostgreSQL** 12+ (local or Docker)
- **npm** or **yarn**

### 1. Clone & Install Dependencies

```bash
npm run install:all
```

This installs:
- Root dependencies (concurrently)
- Server dependencies 
- Client dependencies

### 2. Setup Database

```bash
# Create database
createdb arkagrid

# Setup schema & seed test data
npm run server:db:setup
```

**Test Accounts Created:**
```
Consumer: consumer1@test.com / Test@123 (₹5000 wallet)
Prosumer: prosumer1@test.com / Test@123 (₹500 wallet)
Admin:    admin@test.com / Admin@123
```

### 3. Configure Environment

Copy `.env.example` to `.env` in root:

```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/arkagrid
JWT_SECRET=generate-a-strong-secret
PORT=5000
CLIENT_URL=http://localhost:3000
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Start Development Servers

```bash
npm run dev
```

This starts:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000

---

## 📚 API Documentation

### Authentication
All endpoints require JWT token in `Authorization: Bearer {token}` header

#### `POST /api/auth/register`
Register new user
```json
{
  "name": "John Doe",
  "email": "john@email.com",
  "phone": "9876543210",
  "password": "Test@123",
  "role": "consumer" or "prosumer"
}
```

#### `POST /api/auth/login`
```json
{
  "email": "john@email.com",
  "password": "Test@123"
}
```

### Energy Listings (Prosumer)

#### `POST /api/listings`
Create energy listing to sell
```json
{
  "units_available": 10.5,
  "price_per_unit": 6.50,
  "available_from": "2024-02-26T10:00:00Z",
  "available_until": "2024-02-27T10:00:00Z",
  "latitude": 28.7041,
  "longitude": 77.1025
}
```

#### `GET /api/listings`
Get all active listings (supports filtering)
```
?lat=28.7041&lng=77.1025&radius_km=0.5
```

#### `GET /api/listings/:id`
Get listing details

#### `PATCH /api/listings/:id`
Update price or availability

#### `DELETE /api/listings/:id`
Cancel listing (soft delete)

### Trades (Buying Energy)

#### `POST /api/trades`
Place order - locks payment in escrow
```json
{
  "listing_id": "uuid",
  "units_requested": 3.5
}
```

#### `GET /api/trades/my`
Get all user's trades (as seller or buyer)

#### `POST /api/trades/:id/confirm-delivery`
Prosumer marks energy as delivered

#### `POST /api/trades/:id/confirm-receipt`
Consumer confirms receipt - triggers settlement

#### `POST /api/trades/:id/dispute`
Consumer raises dispute if delivery incomplete

#### `POST /api/admin/trades/:id/resolve`
Admin settles disputed trade
```json
{
  "resolution": "release" | "refund" | "partial",
  "units_delivered": 2.5  // for partial
}
```

### Wallet (Consumer)

#### `GET /api/wallet/balance`
Get wallet balance

#### `POST /api/wallet/add-funds`
Add test funds
```json
{ "amount": 1000 }
```

#### `GET /api/wallet/transactions`
Get transaction history

---

## 🎨 Frontend Pages

| Page | Role | Purpose |
|------|------|---------|
| `/login` | All | User authentication |
| `/register` | All | Create account |
| `/dashboard` | All | Role-based overview |
| `/marketplace` | Consumer | Browse listings to buy |
| `/my-listings` | Prosumer | Manage energy for sale |
| `/my-trades` | Both | View active/completed trades |
| `/wallet` | Consumer | Manage balance & history |
| `/admin/disputes` | Admin | Resolve contested trades |

---

## 🔒 Escrow System (Key Feature)

### How it Works:

1. **Consumer places order** → Payment deducted from wallet, locked in escrow
2. **60-minute countdown starts** → Delivery deadline set
3. **Prosumer confirms delivery** → Meter reading recorded (simulated)
4. **Consumer confirms receipt** → Energy delivery verified
5. **Settlement triggers**:
   - ✅ Full delivery (≥98%): Prosumer receives payment
   - ⚠️ Partial: Proportional payment to prosumer, refund to consumer
   - ❌ No delivery: Auto-refund after timeout

### Auto-Refund Job
Background job runs every 5 minutes, auto-refunds expired trades:
- Checks for delivery_deadline < NOW()
- Refunds consumer wallet_balance
- Restores listing units_remaining
- Logs transaction

---

## 🛠️ Development Scripts

```bash
# Both frontend & backend
npm run dev             # Start concurrently (recommended)

# Backend only
npm run server:dev      # Run with nodemon
npm run server:start    # Production start
npm run server:db:setup # Initialize database

# Frontend only
npm run client:dev      # Vite dev server
npm run client:build    # Build for production

# One-time setup
npm run install:all     # Install all dependencies
```

---

## 🗄️ Database Schema

Key tables:
- **users** - User accounts (prosumer, consumer, admin)
- **energy_listings** - Energy for sale
- **trades** - Buy/sell transactions with escrow
- **meter_readings** - Energy delivery records (simulated in Phase 1)
- **ratings** - User ratings from trades
- **refresh_tokens** - JWT refresh token management

---

## 🔑 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/arkagrid

# JWT
JWT_SECRET=32-char-random-secret-here
JWT_REFRESH_SECRET=32-char-random-secret-here

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Platform
PLATFORM_FEE_PERCENT=2.5
DELIVERY_TIMEOUT_MINUTES=60

# Frontend
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🧪 Testing Workflows

### Workflow 1: Buy Energy (Consumer)
1. Login as consumer (consumer1@test.com)
2. Go to Marketplace → See prosumer1's listings
3. Buy 2 kWh @ ₹6.50/kWh
4. Payment locked (₹13 + fee)
5. Wait for prosumer to deliver

### Workflow 2: Deliver Energy (Prosumer)
1. Login as prosumer (prosumer1@test.com)
2. Go to My Trades → See pending deliveries
3. Click "Mark as Delivered"
4. Meter reading recorded
5. Wait for consumer confirmation

### Workflow 3: Complete Trade (Consumer)
1. Go to My Trades → See "Completing" trade
2. Click "Confirm Receipt"
3. Settlement executed (full or partial)
4. Prosumer receives payment

### Workflow 4: Add Wallet Funds (Consumer)
1. Go to Wallet
2. Click "Add Funds"
3. Enter amount (max ₹10,000)
4. Balance increases instantly

### Workflow 5: Admin Dispute Resolution
1. Login as admin (admin@test.com)
2. Go to Admin Dashboard → Disputes
3. View disputed trades
4. Choose: Release / Refund / Partial
5. Settlement executes

---

## 📈 Phase 1 Limitations & Phase 2 Roadmap

### Phase 1 (Current)
- ✅ Wallet-based payments (no real payment gateway)
- ✅ Simulated meter readings (not from real IoT)
- ✅ Simple location filtering (no Google Maps)
- ✅ Manual admin dispute resolution

### Phase 2 (Planned)
- 🔮 Real payment gateway (Razorpay/UPI)
- 🔮 Real smart meter integration (MQTT/IoT)
- 🔮 Blockchain transaction recording (Polygon)
- 🔮 Google Maps integration
- 🔮 Automated dispute resolution with ML
- 🔮 Mobile app
- 🔮 Multi-language support

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Submit pull request with clear description

---

## 📞 Support

For issues or questions:
- Check [Issues](https://github.com/arkagrid/arkagrid/issues)
- Email: support@arkagrid.com

---

## 📄 License

MIT License - see LICENSE file

---

**Built with ❤️ for a sustainable energy future**
