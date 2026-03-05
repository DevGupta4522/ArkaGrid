use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ArkaGridError;
use crate::events::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct SettleTrade<'info> {
    #[account(
        mut,
        seeds = [TRADE_SEED, trade_account.trade_id.as_bytes()],
        bump = trade_account.bump,
        constraint = trade_account.trade_status == TradeStatus::Pending
            @ ArkaGridError::InvalidTradeStatus,
    )]
    pub trade_account: Account<'info, TradeAccount>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, trade_account.trade_id.as_bytes()],
        bump = trade_account.escrow_bump,
    )]
    /// CHECK: Escrow PDA validated by seeds
    pub escrow_vault: SystemAccount<'info>,

    #[account(
        seeds = [PLATFORM_CONFIG_SEED],
        bump = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        constraint = meter_authority.key() == trade_account.meter_authority
            @ ArkaGridError::UnauthorizedMeterAuthority,
    )]
    pub meter_authority: Signer<'info>,

    #[account(
        mut,
        constraint = seller.key() == trade_account.seller
            @ ArkaGridError::UnauthorizedSeller,
    )]
    /// CHECK: Seller receives payment
    pub seller: AccountInfo<'info>,

    #[account(
        mut,
        constraint = buyer.key() == trade_account.buyer
            @ ArkaGridError::UnauthorizedBuyer,
    )]
    /// CHECK: Buyer may receive refund
    pub buyer: AccountInfo<'info>,

    #[account(
        mut,
        constraint = treasury.key() == platform_config.treasury,
    )]
    /// CHECK: ArkaGrid treasury receives fee
    pub treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SettleTrade>, kwh_delivered: u64) -> Result<()> {
    let trade = &mut ctx.accounts.trade_account;
    let clock = Clock::get()?;

    // ── Deadline check ──────────────────────────────
    require!(
        clock.unix_timestamp <= trade.deadline,
        ArkaGridError::DeadlineExpired
    );

    trade.kwh_delivered = kwh_delivered;
    trade.settled_at = Some(clock.unix_timestamp);

    let delivery_bps = if trade.kwh_requested > 0 {
        kwh_delivered
            .checked_mul(10000)
            .ok_or(ArkaGridError::ArithmeticOverflow)?
            .checked_div(trade.kwh_requested)
            .ok_or(ArkaGridError::ArithmeticOverflow)?
    } else {
        0
    };

    let escrow_balance = ctx.accounts.escrow_vault.lamports();

    if delivery_bps >= DELIVERY_TOLERANCE_BPS {
        // ── FULL DELIVERY: Release to seller ───────────
        let seller_amount = escrow_balance
            .checked_sub(trade.platform_fee_lamports)
            .ok_or(ArkaGridError::ArithmeticOverflow)?;

        // Transfer fee to treasury
        **ctx.accounts.escrow_vault.try_borrow_mut_lamports()? -= trade.platform_fee_lamports;
        **ctx.accounts.treasury.try_borrow_mut_lamports()? += trade.platform_fee_lamports;

        // Transfer net amount to seller
        **ctx.accounts.escrow_vault.try_borrow_mut_lamports()? -= seller_amount;
        **ctx.accounts.seller.try_borrow_mut_lamports()? += seller_amount;

        trade.trade_status = TradeStatus::Completed;
        trade.escrow_status = EscrowStatus::Released;

        emit!(EscrowReleased {
            trade_id: trade.trade_id.clone(),
            seller_amount,
            platform_fee: trade.platform_fee_lamports,
            kwh_delivered,
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "ArkaGrid: FULL SETTLEMENT. Seller: {} lamports. Fee: {} lamports",
            seller_amount,
            trade.platform_fee_lamports
        );
    } else if kwh_delivered > 0 {
        // ── PARTIAL DELIVERY: Pro-rated settlement ─────
        let seller_gross = escrow_balance
            .checked_mul(delivery_bps)
            .ok_or(ArkaGridError::ArithmeticOverflow)?
            .checked_div(10000)
            .ok_or(ArkaGridError::ArithmeticOverflow)?;

        let partial_fee = seller_gross
            .checked_mul(trade.platform_fee_lamports)
            .ok_or(ArkaGridError::ArithmeticOverflow)?
            .checked_div(trade.amount_lamports)
            .ok_or(ArkaGridError::ArithmeticOverflow)?;

        let seller_net = seller_gross
            .checked_sub(partial_fee)
            .ok_or(ArkaGridError::ArithmeticOverflow)?;

        let buyer_refund = escrow_balance
            .checked_sub(seller_gross)
            .ok_or(ArkaGridError::ArithmeticOverflow)?;

        // Transfer partial fee to treasury
        **ctx.accounts.escrow_vault.try_borrow_mut_lamports()? -= partial_fee;
        **ctx.accounts.treasury.try_borrow_mut_lamports()? += partial_fee;

        // Transfer net to seller
        **ctx.accounts.escrow_vault.try_borrow_mut_lamports()? -= seller_net;
        **ctx.accounts.seller.try_borrow_mut_lamports()? += seller_net;

        // Refund remainder to buyer
        **ctx.accounts.escrow_vault.try_borrow_mut_lamports()? -= buyer_refund;
        **ctx.accounts.buyer.try_borrow_mut_lamports()? += buyer_refund;

        trade.trade_status = TradeStatus::Completed;
        trade.escrow_status = EscrowStatus::Partial;

        emit!(EscrowPartialSettlement {
            trade_id: trade.trade_id.clone(),
            seller_amount: seller_net,
            buyer_refund,
            platform_fee: partial_fee,
            kwh_requested: trade.kwh_requested,
            kwh_delivered,
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "ArkaGrid: PARTIAL SETTLEMENT ({}bps). Seller: {}. Buyer refund: {}",
            delivery_bps,
            seller_net,
            buyer_refund
        );
    } else {
        // ── ZERO DELIVERY: Full refund to buyer ────────
        **ctx.accounts.escrow_vault.try_borrow_mut_lamports()? -= escrow_balance;
        **ctx.accounts.buyer.try_borrow_mut_lamports()? += escrow_balance;

        trade.trade_status = TradeStatus::Failed;
        trade.escrow_status = EscrowStatus::Refunded;

        emit!(EscrowRefunded {
            trade_id: trade.trade_id.clone(),
            refund_amount: escrow_balance,
            reason: String::from("Zero delivery confirmed by meter"),
            timestamp: clock.unix_timestamp,
        });

        msg!(
            "ArkaGrid: ZERO DELIVERY. Full refund: {} lamports",
            escrow_balance
        );
    }

    Ok(())
}
