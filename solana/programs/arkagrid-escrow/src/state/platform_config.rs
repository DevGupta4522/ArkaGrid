use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
pub struct PlatformConfig {
    pub authority: Pubkey,          // ArkaGrid admin
    pub treasury: Pubkey,           // Fee recipient
    pub meter_authority: Pubkey,    // Backend wallet for meter ops
    pub fee_bps: u64,               // Platform fee in basis points (250 = 2.5%)
    pub is_paused: bool,            // Emergency pause switch
    pub total_trades: u64,          // Lifetime trade count
    pub total_volume_lamports: u64, // Lifetime volume in lamports
    pub total_kwh_traded: u64,      // Lifetime kWh × 1000
    pub bump: u8,
}

impl PlatformConfig {
    pub const LEN: usize = DISCRIMINATOR_LEN
        + 32 // authority
        + 32 // treasury
        + 32 // meter_authority
        + 8  // fee_bps
        + 1  // is_paused
        + 8  // total_trades
        + 8  // total_volume_lamports
        + 8  // total_kwh_traded
        + 1; // bump
}
