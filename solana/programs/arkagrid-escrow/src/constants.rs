pub const TRADE_SEED: &[u8] = b"arkagrid_trade";
pub const ESCROW_SEED: &[u8] = b"arkagrid_escrow";
pub const PLATFORM_CONFIG_SEED: &[u8] = b"arkagrid_config";
pub const CARBON_SEED: &[u8] = b"arkagrid_carbon";

// Trade settings
pub const DELIVERY_WINDOW_SECONDS: i64 = 3600; // 60 minutes
pub const DELIVERY_TOLERANCE_BPS: u64 = 9800; // 98% in basis points
pub const MAX_PLATFORM_FEE_BPS: u64 = 500; // Max 5% fee cap
pub const MIN_TRADE_AMOUNT_LAMPORTS: u64 = 1_000_000; // Min 0.001 SOL

// String length limits for account sizing
pub const TRADE_ID_MAX_LEN: usize = 36; // UUID length
pub const GRID_REGION_MAX_LEN: usize = 32;
pub const DISCRIMINATOR_LEN: usize = 8;
