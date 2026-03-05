/**
 * ArkaGrid Razorpay Routes
 * Endpoints for order creation, signature verification, and webhooks.
 */
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { createOrder, verifySignature, verifyWebhookSignature } from '../services/razorpay.js';
import pool from '../db/connection.js';

const router = express.Router();

/**
 * Creates a Razorpay Order before locking Solana escrow
 */
router.post('/create-order', authenticateToken, requireRole('consumer'), async (req, res) => {
  try {
    const { amount, tradeId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const order = await createOrder(amount, tradeId || 'new_trade');
    
    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Verifies payment signature and records payment ID to DB
 */
router.post('/verify', authenticateToken, requireRole('consumer'), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tradeId } = req.body;
    
    // Crypto Verification
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Save Razorpay Payment ID to trade
    if (tradeId) {
      await pool.query(`
        UPDATE trades 
        SET razorpay_order_id = $1, razorpay_payment_id = $2
        WHERE id = $3 AND consumer_id = $4
      `, [razorpay_order_id, razorpay_payment_id, tradeId, req.user.id]);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('[Razorpay] Verification Error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
});

/**
 * Webhook (requires raw body parsing — configured in index.js)
 */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    
    // We configured express.raw, so req.body is a buffer here
    const isValid = verifyWebhookSignature(req.body, signature);
    
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
    }

    const payload = JSON.parse(req.body.toString());
    const event = payload.event;
    const payment = payload.payload.payment.entity;

    console.log(`[Razorpay Webhook] Received ${event} for ${payment.id}`);

    // Handle payment capture, fail, or refund
    if (event === 'payment.captured') {
      // Could mark a generic status here if needed
    } else if (event === 'refund.processed') {
      // Find the trade and mark as refunded
      await pool.query(`
        UPDATE trades SET escrow_status = 'refunded'
        WHERE razorpay_payment_id = $1
      `, [payment.id]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Razorpay Webhook] Error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

export default router;
