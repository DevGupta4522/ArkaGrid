-- ArkaGrid Phase 2: Razorpay Payments Migration
-- Adds Razorpay order and payment IDs to trades

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100);

-- Update escrow_status check constraint to include 'refund_failed'
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_escrow_status_check;
ALTER TABLE trades ADD CONSTRAINT trades_escrow_status_check CHECK (escrow_status IN ('pending', 'locked', 'released', 'refunded', 'disputed', 'partial', 'refund_failed'));
