/**
 * ArkaGrid Razorpay Service
 * Handles order creation, payment verification, and refunds.
 */
import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance = null;

function getRazorpay() {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn('⚠️ [Razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env');
    }
    
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_change_me',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_change_me',
    });
  }
  return razorpayInstance;
}

/**
 * Creates a Razorpay Order
 * @param {number} amountInRupees - Total amount including fees
 * @param {string} receiptId - Internal trade ID for tracking
 * @returns {object} Razorpay Order object
 */
export async function createOrder(amountInRupees, receiptId) {
  try {
    const rzp = getRazorpay();
    const options = {
      amount: Math.round(amountInRupees * 100), // convert to paise
      currency: 'INR',
      receipt: `arka_${receiptId.slice(0, 10)}`,
      payment_capture: 1 // Auto capture
    };

    const order = await rzp.orders.create(options);
    return order;
  } catch (error) {
    console.error('[Razorpay] Order creation failed:', error);
    throw new Error('Payment gateway error');
  }
}

/**
 * Validates the Razorpay signature sent by the frontend after payment
 */
export function verifySignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_change_me';
  
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(orderId + '|' + paymentId)
    .digest('hex');
    
  return generatedSignature === signature;
}

/**
 * Validates webhook signature
 */
export function verifyWebhookSignature(rawBody, signature) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'arkagrid_webhook_secret_123';
  
  const generatedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');
    
  return generatedSignature === signature;
}

/**
 * Process a refund through Razorpay (used in escrowTimeout job)
 * @param {string} paymentId - The Razorpay payment ID
 * @param {number} amountInRupees - Amount to refund (optional, refunds full by default)
 */
export async function issueRefund(paymentId, amountInRupees = null) {
  try {
    const rzp = getRazorpay();
    const options = amountInRupees ? { amount: Math.round(amountInRupees * 100) } : {};
    
    // For test mode, if the payment isn't captured yet, refund will fail.
    // In production, we'd capture on delivery, but for P2P we capture immediately
    // and hold funds in our system, then issue API refund if delivery fails.
    const refund = await rzp.payments.refund(paymentId, options);
    console.log(`✅ [Razorpay] Refund issued for payment ${paymentId}`);
    return refund;
  } catch (error) {
    console.error(`[Razorpay] Refund failed for payment ${paymentId}:`, error);
    throw error;
  }
}
