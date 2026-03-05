use anchor_lang::prelude::*;

#[error_code]
pub enum ArkaGridError {
    // Trade lifecycle errors
    #[msg("ArkaGrid: Trade with this ID already exists")]
    TradeAlreadyExists,

    #[msg("ArkaGrid: Trade does not exist")]
    TradeNotFound,

    #[msg("ArkaGrid: Trade is not in Pending status")]
    InvalidTradeStatus,

    #[msg("ArkaGrid: Delivery deadline has not passed yet")]
    DeadlineNotReached,

    #[msg("ArkaGrid: Delivery window has expired — cannot confirm")]
    DeadlineExpired,

    // Authorization errors
    #[msg("ArkaGrid: Only the meter authority can call this")]
    UnauthorizedMeterAuthority,

    #[msg("ArkaGrid: Only the buyer can perform this action")]
    UnauthorizedBuyer,

    #[msg("ArkaGrid: Only the seller can perform this action")]
    UnauthorizedSeller,

    #[msg("ArkaGrid: Only the ArkaGrid admin can resolve disputes")]
    UnauthorizedAdmin,

    // Payment errors
    #[msg("ArkaGrid: Trade amount must be above minimum threshold")]
    TradeBelowMinimum,

    #[msg("ArkaGrid: Platform fee exceeds maximum allowed")]
    FeeTooHigh,

    #[msg("ArkaGrid: Arithmetic overflow in payment calculation")]
    ArithmeticOverflow,

    // Address errors
    #[msg("ArkaGrid: Buyer and seller cannot be the same wallet")]
    BuyerEqualsSellerError,

    #[msg("ArkaGrid: Invalid wallet address provided")]
    InvalidWalletAddress,

    // Dispute errors
    #[msg("ArkaGrid: Only disputed trades can be resolved")]
    NotInDisputeStatus,

    #[msg("ArkaGrid: Trade is already in dispute")]
    AlreadyDisputed,

    // Config errors
    #[msg("ArkaGrid: Platform is currently paused for maintenance")]
    PlatformPaused,
}
