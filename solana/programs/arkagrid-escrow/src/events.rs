use anchor_lang::prelude::*;

#[event]
pub struct TradeInitialized {
    pub trade_id: String,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount_lamports: u64,
    pub kwh_amount: u64,
    pub deadline: i64,
    pub timestamp: i64,
}

#[event]
pub struct EscrowReleased {
    pub trade_id: String,
    pub seller_amount: u64,
    pub platform_fee: u64,
    pub kwh_delivered: u64,
    pub timestamp: i64,
}

#[event]
pub struct EscrowRefunded {
    pub trade_id: String,
    pub refund_amount: u64,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct EscrowPartialSettlement {
    pub trade_id: String,
    pub seller_amount: u64,
    pub buyer_refund: u64,
    pub platform_fee: u64,
    pub kwh_requested: u64,
    pub kwh_delivered: u64,
    pub timestamp: i64,
}

#[event]
pub struct DisputeRaised {
    pub trade_id: String,
    pub raised_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct DisputeResolved {
    pub trade_id: String,
    pub resolution: String,
    pub resolved_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CarbonCreditIssued {
    pub trade_id: String,
    pub prosumer: Pubkey,
    pub kwh_amount: u64,
    pub grid_region: String,
    pub timestamp: i64,
}
