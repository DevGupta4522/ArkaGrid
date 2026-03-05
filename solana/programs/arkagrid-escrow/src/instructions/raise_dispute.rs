use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ArkaGridError;
use crate::events::DisputeRaised;
use crate::constants::*;

#[derive(Accounts)]
pub struct RaiseDispute<'info> {
    #[account(
        mut,
        seeds = [TRADE_SEED, trade_account.trade_id.as_bytes()],
        bump = trade_account.bump,
        constraint = trade_account.escrow_status == EscrowStatus::Locked
            @ ArkaGridError::AlreadyDisputed,
        constraint = trade_account.trade_status == TradeStatus::Pending
            @ ArkaGridError::InvalidTradeStatus,
    )]
    pub trade_account: Account<'info, TradeAccount>,

    #[account(
        constraint = buyer.key() == trade_account.buyer
            @ ArkaGridError::UnauthorizedBuyer,
    )]
    pub buyer: Signer<'info>,
}

pub fn handler(ctx: Context<RaiseDispute>) -> Result<()> {
    let trade = &mut ctx.accounts.trade_account;
    let clock = Clock::get()?;

    trade.trade_status = TradeStatus::Disputed;
    trade.escrow_status = EscrowStatus::Disputed;

    emit!(DisputeRaised {
        trade_id: trade.trade_id.clone(),
        raised_by: ctx.accounts.buyer.key(),
        timestamp: clock.unix_timestamp,
    });

    msg!(
        "ArkaGrid: Dispute raised for trade {}. Escrow frozen.",
        trade.trade_id
    );
    Ok(())
}
