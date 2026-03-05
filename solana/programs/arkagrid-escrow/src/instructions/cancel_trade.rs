use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ArkaGridError;
use crate::events::EscrowRefunded;
use crate::constants::*;

#[derive(Accounts)]
pub struct CancelTrade<'info> {
    #[account(
        mut,
        seeds = [TRADE_SEED, trade_account.trade_id.as_bytes()],
        bump = trade_account.bump,
        constraint = trade_account.escrow_status == EscrowStatus::Locked
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
        mut,
        constraint = buyer.key() == trade_account.buyer
            @ ArkaGridError::UnauthorizedBuyer,
    )]
    /// CHECK: Buyer receives full refund
    pub buyer: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CancelTrade>) -> Result<()> {
    let trade = &mut ctx.accounts.trade_account;
    let clock = Clock::get()?;

    // Must be past deadline to cancel
    require!(
        clock.unix_timestamp > trade.deadline,
        ArkaGridError::DeadlineNotReached
    );

    let refund_amount = ctx.accounts.escrow_vault.lamports();

    // Full refund to buyer
    **ctx.accounts.escrow_vault.try_borrow_mut_lamports()? -= refund_amount;
    **ctx.accounts.buyer.try_borrow_mut_lamports()? += refund_amount;

    trade.trade_status = TradeStatus::Cancelled;
    trade.escrow_status = EscrowStatus::Refunded;
    trade.settled_at = Some(clock.unix_timestamp);

    emit!(EscrowRefunded {
        trade_id: trade.trade_id.clone(),
        refund_amount,
        reason: String::from("Delivery deadline expired — buyer cancelled"),
        timestamp: clock.unix_timestamp,
    });

    msg!(
        "ArkaGrid: Trade cancelled. Refunded {} lamports to buyer",
        refund_amount
    );
    Ok(())
}
