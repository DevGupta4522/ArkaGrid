use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;
use instructions::resolve_dispute::DisputeResolution;

declare_id!("GQbVWuhBicqa4Uq6YUQi2deoqPto1DsLooFXP4eiNMaZ");

#[program]
pub mod arkagrid_escrow {
    use super::*;

    /// Initialize ArkaGrid platform configuration (run once at deployment)
    pub fn initialize_platform(ctx: Context<InitializePlatform>, fee_bps: u64) -> Result<()> {
        instructions::initialize_platform::handler(ctx, fee_bps)
    }

    /// Consumer locks SOL in escrow to initiate a trade
    pub fn initialize_trade(
        ctx: Context<InitializeTrade>,
        trade_id: String,
        kwh_requested: u64,
        price_per_kwh: u64,
        grid_region: String,
        amount_lamports: u64,
    ) -> Result<()> {
        instructions::initialize_trade::handler(
            ctx,
            trade_id,
            kwh_requested,
            price_per_kwh,
            grid_region,
            amount_lamports,
        )
    }

    /// ArkaGrid meter authority confirms delivery and triggers settlement
    pub fn settle_trade(ctx: Context<SettleTrade>, kwh_delivered: u64) -> Result<()> {
        instructions::settle_trade::handler(ctx, kwh_delivered)
    }

    /// Buyer reclaims funds after deadline expires (permissionless)
    pub fn cancel_trade(ctx: Context<CancelTrade>) -> Result<()> {
        instructions::cancel_trade::handler(ctx)
    }

    /// Consumer raises a dispute — freezes escrow pending admin review
    pub fn raise_dispute(ctx: Context<RaiseDispute>) -> Result<()> {
        instructions::raise_dispute::handler(ctx)
    }

    /// ArkaGrid admin resolves dispute
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        resolution: DisputeResolution,
    ) -> Result<()> {
        instructions::resolve_dispute::handler(ctx, resolution)
    }
}
