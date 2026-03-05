use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ArkaGridError;
use crate::events::DisputeResolved;
use crate::constants::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum DisputeResolution {
    ReleaseToSeller,
    RefundToBuyer,
    PartialSettlement { kwh_delivered: u64 },
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(
        mut,
        seeds = [TRADE_SEED, trade_account.trade_id.as_bytes()],
        bump = trade_account.bump,
        constraint = trade_account.trade_status == TradeStatus::Disputed
            @ ArkaGridError::NotInDisputeStatus,
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
        constraint = admin.key() == platform_config.authority
            @ ArkaGridError::UnauthorizedAdmin,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    pub admin: Signer<'info>,

    #[account(
        mut,
        constraint = seller.key() == trade_account.seller,
    )]
    /// CHECK: May receive payment
    pub seller: AccountInfo<'info>,

    #[account(
        mut,
        constraint = buyer.key() == trade_account.buyer,
    )]
    /// CHECK: May receive refund
    pub buyer: AccountInfo<'info>,

    #[account(
        mut,
        constraint = treasury.key() == platform_config.treasury,
    )]
    /// CHECK: Receives platform fee
    pub treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ResolveDispute>, resolution: DisputeResolution) -> Result<()> {
    let trade = &mut ctx.accounts.trade_account;
    let clock = Clock::get()?;
    let escrow_balance = ctx.accounts.escrow_vault.lamports();
    let resolution_str: String;

    match resolution {
        DisputeResolution::ReleaseToSeller => {
            let seller_amount = escrow_balance
                .checked_sub(trade.platform_fee_lamports)
                .ok_or(ArkaGridError::ArithmeticOverflow)?;

            **ctx.accounts.escrow_vault.try_borrow_mut_lamports()? -= trade.platform_fee_lamports;
            **ctx.accounts.treasury.try_borrow_mut_lamports()? += trade.platform_fee_lamports;
            **ctx.accounts.escrow_vault.try_borrow_mut_lamports()? -= seller_amount;
            **ctx.accounts.seller.try_borrow_mut_lamports()? += seller_amount;

            trade.escrow_status = EscrowStatus::Released;
            trade.kwh_delivered = trade.kwh_requested;
            resolution_str = String::from("release_to_seller");
        }

        DisputeResolution::RefundToBuyer => {
            **ctx.accounts.escrow_vault.try_borrow_mut_lamports()? -= escrow_balance;
            **ctx.accounts.buyer.try_borrow_mut_lamports()? += escrow_balance;

            trade.escrow_status = EscrowStatus::Refunded;
            trade.kwh_delivered = 0;
            resolution_str = String::from("refund_to_buyer");
        }

        DisputeResolution::PartialSettlement { kwh_delivered } => {
            trade.kwh_delivered = kwh_delivered;
            let delivery_bps = kwh_delivered
                .checked_mul(10000)
                .ok_or(ArkaGridError::ArithmeticOverflow)?
                .checked_div(trade.kwh_requested)
                .ok_or(ArkaGridError::ArithmeticOverflow)?;

            let seller_gross = escrow_balance
                .checked_mul(delivery_bps)
                .ok_or(ArkaGridError::ArithmeticOverflow)?
                .checked_div(10000)
                .ok_or(ArkaGridError::ArithmeticOverflow)?;

            let fee = seller_gross
                .checked_mul(trade.platform_fee_lamports)
                .ok_or(ArkaGridError::ArithmeticOverflow)?
                .checked_div(trade.amount_lamports)
                .ok_or(ArkaGridError::ArithmeticOverflow)?;

            let seller_net = seller_gross
                .checked_sub(fee)
                .ok_or(ArkaGridError::ArithmeticOverflow)?;
            let buyer_refund = escrow_balance
                .checked_sub(seller_gross)
                .ok_or(ArkaGridError::ArithmeticOverflow)?;

            **ctx.accounts.escrow_vault.try_borrow_mut_lamports()? -= fee;
            **ctx.accounts.treasury.try_borrow_mut_lamports()? += fee;
            **ctx.accounts.escrow_vault.try_borrow_mut_lamports()? -= seller_net;
            **ctx.accounts.seller.try_borrow_mut_lamports()? += seller_net;
            **ctx.accounts.escrow_vault.try_borrow_mut_lamports()? -= buyer_refund;
            **ctx.accounts.buyer.try_borrow_mut_lamports()? += buyer_refund;

            trade.escrow_status = EscrowStatus::Partial;
            resolution_str = format!("partial_{}bps", delivery_bps);
        }
    }

    trade.trade_status = TradeStatus::Completed;
    trade.settled_at = Some(clock.unix_timestamp);

    emit!(DisputeResolved {
        trade_id: trade.trade_id.clone(),
        resolution: resolution_str,
        resolved_by: ctx.accounts.admin.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
