# 🔗 ArkaGrid Solana — Blockchain Settlement Layer

> Production-grade P2P energy trading escrow on Solana

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Frontend   │────▶│  Node.js API  │────▶│  Solana Program   │
│  React/Vite  │     │  Express.js   │     │  Anchor (Rust)    │
│  + Phantom   │     │  + Solana SDK │     │  + PDAs + Escrow  │
└─────────────┘     └──────────────┘     └──────────────────┘
                          │                        │
                    ┌─────▼─────┐           ┌──────▼──────┐
                    │ PostgreSQL │           │  Solana     │
                    │ (Primary)  │           │  Devnet/    │
                    │ DB Escrow  │           │  Mainnet    │
                    └───────────┘           └─────────────┘
```

## 🔐 Security Design

| Feature | Implementation |
|---------|----------------|
| **Zero fund loss** | DB escrow is safety net — blockchain is audit trail |
| **PDA escrow** | Funds locked in program-derived addresses, not wallets |
| **Checked arithmetic** | Every `+`, `-`, `*`, `/` uses Rust `checked_*` operations |
| **Role-based access** | Meter authority, admin, buyer, seller — all verified on-chain |
| **Graceful degradation** | App works 100% even if Solana RPC is down |
| **Replay protection** | Trade IDs are UUIDs — cannot reuse |
| **Fee cap** | Platform fee capped at 5% maximum on-chain |
| **Emergency pause** | Global `is_paused` flag in PlatformConfig |

## 📁 File Structure

```
solana/
├── Anchor.toml              # Anchor framework config
├── Cargo.toml               # Rust workspace config
├── package.json             # TS dependencies for tests/scripts
├── tsconfig.json            # TypeScript config
├── .env.example             # Environment template
├── programs/
│   └── arkagrid-escrow/
│       ├── Cargo.toml       # Program dependencies
│       └── src/
│           ├── lib.rs           # Entry point (6 instructions)
│           ├── constants.rs     # Seeds, limits, sizing
│           ├── errors.rs        # 13 custom error codes
│           ├── events.rs        # 7 indexable events
│           ├── state/
│           │   ├── mod.rs
│           │   ├── trade_account.rs    # On-chain trade record
│           │   └── platform_config.rs  # Global platform state
│           └── instructions/
│               ├── mod.rs
│               ├── initialize_platform.rs  # One-time setup
│               ├── initialize_trade.rs     # Lock escrow
│               ├── settle_trade.rs         # Release/refund
│               ├── cancel_trade.rs         # Timeout refund
│               ├── raise_dispute.rs        # Freeze escrow
│               └── resolve_dispute.rs      # Admin resolution
├── tests/
│   └── arkagrid_escrow.ts   # 10 integration tests
├── scripts/
│   ├── airdrop.ts           # Fund wallets on devnet
│   ├── deploy.ts            # Initialize platform config
│   └── simulate_trade.ts    # Full lifecycle demo
└── keypairs/                # ⚠️ NEVER commit to git
    ├── authority.json
    ├── meter_authority.json
    ├── treasury.json
    └── backend.json
```

## 🚀 Quick Start

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) v1.18+
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) v0.30+
- Node.js 18+

### Setup

```bash
# 1. Install dependencies
cd solana
npm install

# 2. Generate keypairs + airdrop devnet SOL
npm run airdrop

# 3. Build the Solana program
anchor build

# 4. Get your program ID
anchor keys list
# Copy the ID and update:
# - programs/arkagrid-escrow/src/lib.rs → declare_id!("YOUR_ID")
# - Anchor.toml → [programs.devnet] arkagrid_escrow = "YOUR_ID"

# 5. Build again with updated ID
anchor build

# 6. Deploy to devnet
anchor deploy --provider.cluster devnet

# 7. Initialize platform config
npm run simulate

# 8. Run integration tests
anchor test
```

### Backend Integration

```bash
# Add to your server .env:
SOLANA_PROGRAM_ID=<program_id_from_step_4>
SOLANA_RPC_URL=https://api.devnet.solana.com
ARKAGRID_METER_AUTHORITY_KEYPAIR=./solana/keypairs/meter_authority.json
ARKAGRID_TREASURY_PUBKEY=<treasury_pubkey_from_airdrop>

# Run DB migration
psql $DATABASE_URL -f server/db/migration_solana.sql

# Start server — Solana service auto-initializes
npm run dev
```

## 📊 Trade Lifecycle (On-Chain)

```
Consumer clicks "Buy"
    │
    ▼
┌─── initialize_trade ───┐
│  • SOL transferred from  │
│    buyer to escrow PDA   │
│  • Trade account created │
│  • Event emitted         │
└──────────┬──────────────┘
           │
    Energy delivery
    (60 min window)
           │
    ┌──────▼──────┐
    │ settle_trade │ ← Called by meterAuthority
    ├─────────────┤
    │ ≥98% delivery│──▶ Full release to seller
    │ 1-97% delivery│──▶ Proportional split
    │ 0% delivery  │──▶ Full refund to buyer
    └──────────────┘
           │
    Past deadline?
    ┌──────▼──────┐
    │ cancel_trade │ ← Permissionless
    │ Full refund  │
    └──────────────┘
           │
    Dispute?
    ┌──── raise_dispute ────┐
    │ Escrow frozen          │
    └───────┬────────────────┘
            ▼
    ┌─── resolve_dispute ──┐ ← Admin only
    │ release / refund /    │
    │ partial settlement    │
    └──────────────────────┘
```

## 🧪 Test Coverage

| # | Scenario | Status |
|---|----------|--------|
| 1 | Full delivery → release to seller | ✅ |
| 2 | Timeout → cancel instruction | ✅ |
| 3 | 60% delivery → proportional split | ✅ |
| 4 | Zero delivery → full refund | ✅ |
| 5 | Dispute → release to seller | ✅ |
| 6 | Dispute → refund to buyer | ✅ |
| 7 | Duplicate trade ID → revert | ✅ |
| 8 | Unauthorized meter → revert | ✅ |
| 9 | Buyer cannot settle | ✅ |
| 10 | Fee math verification (2.5%) | ✅ |

## ⚡ Account Sizing & Costs

| Account | Size (bytes) | Rent (SOL) |
|---------|-------------|------------|
| TradeAccount | ~316 | ~0.003 |
| PlatformConfig | ~138 | ~0.002 |
| Escrow PDA | ~0 (SOL only) | Exempt |

## 🔑 Key Addresses

After deployment, these will be printed:

| Role | Environment Variable |
|------|---------------------|
| Program ID | `SOLANA_PROGRAM_ID` |
| Authority | `ARKAGRID_AUTHORITY_PUBKEY` |
| Meter Authority | `ARKAGRID_METER_AUTHORITY_PUBKEY` |
| Treasury | `ARKAGRID_TREASURY_PUBKEY` |
| Config PDA | Derived from seeds |

## 🛡️ Production Checklist

- [ ] Keypairs stored in secure vault (not filesystem)
- [ ] RPC endpoint upgraded from public to dedicated (Helius/QuickNode)
- [ ] Program ID updated to mainnet deployment
- [ ] `is_paused` toggle tested and accessible
- [ ] Fee set to production rate
- [ ] Security audit completed (Sec3/OtterSec)
- [ ] Monitoring: track transaction failures, escrow balances
- [ ] Rate limiting on backend Solana calls
- [ ] Error alerting for failed settlements
