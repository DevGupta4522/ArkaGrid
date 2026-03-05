use anchor_lang::prelude::*;
use crate::constants::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum TradeStatus {
    Pending,    // Escrow locked, awaiting delivery
    Delivering, // Meter data streaming
    Completed,  // Settled successfully
    Failed,     // Delivery failed or timed out
    Disputed,   // Consumer raised dispute
    Cancelled,  // Cancelled before delivery
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum EscrowStatus {
    Locked,   // Funds held in PDA
    Released, // Fully released to seller
    Refunded, // Fully refunded to buyer
    Partial,  // Split between seller and buyer
    Disputed, // Frozen pending resolution
}

#[account]
#[derive(Debug)]
pub struct TradeAccount {
    // Identity
    pub trade_id: String,        // ArkaGrid PostgreSQL UUID (36 chars)
    pub buyer: Pubkey,           // Consumer wallet (32 bytes)
    pub seller: Pubkey,          // Prosumer wallet (32 bytes)
    pub meter_authority: Pubkey, // ArkaGrid backend wallet (32 bytes)
    pub authority: Pubkey,       // ArkaGrid admin wallet (32 bytes)

    // Trade details
    pub amount_lamports: u64,        // Total SOL locked in lamports
    pub platform_fee_lamports: u64,  // 2.5% in lamports
    pub kwh_requested: u64,          // kWh × 1000 (e.g. 3500 = 3.5 kWh)
    pub kwh_delivered: u64,          // Set by meter on settlement
    pub price_per_kwh: u64,          // lamports per kWh unit

    // Timing
    pub created_at: i64,          // Unix timestamp
    pub deadline: i64,            // created_at + DELIVERY_WINDOW_SECONDS
    pub settled_at: Option<i64>,  // When settlement occurred

    // Status
    pub trade_status: TradeStatus,
    pub escrow_status: EscrowStatus,

    // Carbon credit
    pub carbon_issued: bool,  // Whether REC NFT was minted
    pub grid_region: String,  // e.g. "Karnataka" (32 chars max)

    // Bump seed for PDA
    pub bump: u8,
    pub escrow_bump: u8,
}

impl TradeAccount {
    pub const LEN: usize = DISCRIMINATOR_LEN
        + 4 + TRADE_ID_MAX_LEN // String (4 byte prefix + content)
        + 32                    // buyer pubkey
        + 32                    // seller pubkey
        + 32                    // meter_authority pubkey
        + 32                    // authority pubkey
        + 8                     // amount_lamports
        + 8                     // platform_fee_lamports
        + 8                     // kwh_requested
        + 8                     // kwh_delivered
        + 8                     // price_per_kwh
        + 8                     // created_at
        + 8                     // deadline
        + 1 + 8                 // Option<i64> settled_at
        + 2                     // TradeStatus enum
        + 2                     // EscrowStatus enum
        + 1                     // carbon_issued bool
        + 4 + GRID_REGION_MAX_LEN // grid_region String
        + 1                     // bump
        + 1;                    // escrow_bump

    pub fn is_expired(&self, current_time: i64) -> bool {
        current_time > self.deadline
    }

    pub fn delivery_percentage(&self) -> u64 {
        if self.kwh_requested == 0 {
            return 0;
        }
        self.kwh_delivered
            .checked_mul(10000)
            .unwrap_or(0)
            .checked_div(self.kwh_requested)
            .unwrap_or(0)
    }

    pub fn is_full_delivery(&self) -> bool {
        self.delivery_percentage() >= DELIVERY_TOLERANCE_BPS
    }
}
