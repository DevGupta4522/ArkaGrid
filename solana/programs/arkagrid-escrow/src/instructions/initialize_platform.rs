use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ArkaGridError;
use crate::constants::*;

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = authority,
        space = PlatformConfig::LEN,
        seeds = [PLATFORM_CONFIG_SEED],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Treasury wallet — receives platform fees
    pub treasury: AccountInfo<'info>,

    /// CHECK: Meter authority — ArkaGrid backend wallet
    pub meter_authority: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializePlatform>, fee_bps: u64) -> Result<()> {
    require!(
        fee_bps <= MAX_PLATFORM_FEE_BPS,
        ArkaGridError::FeeTooHigh
    );

    let config = &mut ctx.accounts.platform_config;
    config.authority = ctx.accounts.authority.key();
    config.treasury = ctx.accounts.treasury.key();
    config.meter_authority = ctx.accounts.meter_authority.key();
    config.fee_bps = fee_bps;
    config.is_paused = false;
    config.total_trades = 0;
    config.total_volume_lamports = 0;
    config.total_kwh_traded = 0;
    config.bump = ctx.bumps.platform_config;

    msg!(
        "ArkaGrid: Platform initialized. Fee: {}bps. Treasury: {}",
        fee_bps,
        config.treasury
    );

    Ok(())
}
