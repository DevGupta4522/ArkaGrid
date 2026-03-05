use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::*;
use crate::errors::ArkaGridError;
use crate::events::TradeInitialized;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(trade_id: String, kwh_requested: u64, price_per_kwh: u64)]
pub struct InitializeTrade<'info> {
    #[account(
        init,
        payer = buyer,
        space = TradeAccount::LEN,
        seeds = [
            TRADE_SEED,
            trade_id.as_bytes()
        ],
        bump
    )]
    pub trade_account: Account<'info, TradeAccount>,

    #[account(
        mut,
        seeds = [
            ESCROW_SEED,
            trade_id.as_bytes()
        ],
        bump
    )]
    /// CHECK: PDA that holds the locked SOL — validated by seeds
    pub escrow_vault: SystemAccount<'info>,

    #[account(
        seeds = [PLATFORM_CONFIG_SEED],
        bump = platform_config.bump,
        constraint = !platform_config.is_paused
            @ ArkaGridError::PlatformPaused,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Seller's wallet — verified against listing in backend
    pub seller: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeTrade>,
    trade_id: String,
    kwh_requested: u64,
    price_per_kwh: u64,
    grid_region: String,
    amount_lamports: u64,
) -> Result<()> {
    let trade = &mut ctx.accounts.trade_account;
    let config = &ctx.accounts.platform_config;
    let clock = Clock::get()?;

    // ── Validation ─────────────────────────────────
    require!(
        amount_lamports >= MIN_TRADE_AMOUNT_LAMPORTS,
        ArkaGridError::TradeBelowMinimum
    );
    require!(
        ctx.accounts.buyer.key() != ctx.accounts.seller.key(),
        ArkaGridError::BuyerEqualsSellerError
    );
    require!(
        trade_id.len() <= TRADE_ID_MAX_LEN,
        ArkaGridError::TradeNotFound
    );
    require!(kwh_requested > 0, ArkaGridError::InvalidTradeStatus);

    // ── Calculate platform fee ──────────────────────
    let platform_fee = amount_lamports
        .checked_mul(config.fee_bps)
        .ok_or(ArkaGridError::ArithmeticOverflow)?
        .checked_div(10000)
        .ok_or(ArkaGridError::ArithmeticOverflow)?;

    // ── Transfer SOL from buyer to escrow vault PDA ─
    let transfer_instruction = system_program::Transfer {
        from: ctx.accounts.buyer.to_account_info(),
        to: ctx.accounts.escrow_vault.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        transfer_instruction,
    );
    system_program::transfer(cpi_ctx, amount_lamports)?;

    // ── Set trade account state ─────────────────────
    trade.trade_id = trade_id.clone();
    trade.buyer = ctx.accounts.buyer.key();
    trade.seller = ctx.accounts.seller.key();
    trade.meter_authority = config.meter_authority;
    trade.authority = config.authority;
    trade.amount_lamports = amount_lamports;
    trade.platform_fee_lamports = platform_fee;
    trade.kwh_requested = kwh_requested;
    trade.kwh_delivered = 0;
    trade.price_per_kwh = price_per_kwh;
    trade.created_at = clock.unix_timestamp;
    trade.deadline = clock
        .unix_timestamp
        .checked_add(DELIVERY_WINDOW_SECONDS)
        .ok_or(ArkaGridError::ArithmeticOverflow)?;
    trade.settled_at = None;
    trade.trade_status = TradeStatus::Pending;
    trade.escrow_status = EscrowStatus::Locked;
    trade.carbon_issued = false;
    trade.grid_region = grid_region;
    trade.bump = ctx.bumps.trade_account;
    trade.escrow_bump = ctx.bumps.escrow_vault;

    // ── Emit event for indexing ─────────────────────
    emit!(TradeInitialized {
        trade_id,
        buyer: trade.buyer,
        seller: trade.seller,
        amount_lamports,
        kwh_amount: kwh_requested,
        deadline: trade.deadline,
        timestamp: clock.unix_timestamp,
    });

    msg!(
        "ArkaGrid: Trade initialized. {} lamports locked. Deadline: {}",
        amount_lamports,
        trade.deadline
    );

    Ok(())
}
