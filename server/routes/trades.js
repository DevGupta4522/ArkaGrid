import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  createTrade,
  getTradeById,
  getMyTrades,
  confirmDelivery,
  confirmReceipt,
  raisDispute,
  resolveDispute,
  rateTrade
} from '../controllers/tradesController.js';

const router = express.Router();

const validateCreateTrade = [
  body('listing_id').notEmpty().withMessage('listing_id is required'),
  body('units_requested').isFloat({ gt: 0 }).withMessage('units_requested must be greater than 0'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors: errors.array()
      });
    }
    next();
  }
];

const validateResolveDispute = [
  body('resolution').isIn(['release', 'refund', 'partial']).withMessage('Invalid resolution'),
  body('units_delivered').optional().isFloat({ gte: 0 }).withMessage('Invalid units_delivered'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors: errors.array()
      });
    }
    next();
  }
];

// Authenticated routes — specific paths MUST come before parameterized /:id
router.get('/my', authenticateToken, getMyTrades);

// Carbon Credits — prosumer's Solana-verified energy trades
router.get('/carbon-credits', authenticateToken, async (req, res) => {
  try {
    const { rows } = await (await import('../db/index.js')).pool.query(`
      SELECT id, units_delivered, units_requested, delivery_tx_hash,
             blockchain_status, created_at, price_per_unit, total_amount
      FROM trades
      WHERE prosumer_id = $1
        AND blockchain_status = 'settled'
      ORDER BY created_at DESC
    `, [req.user.id]);

    const totalKwh = rows.reduce((sum, r) => sum + parseFloat(r.units_delivered || r.units_requested || 0), 0);

    res.json({
      success: true,
      data: {
        total_kwh_verified: parseFloat(totalKwh.toFixed(3)),
        total_credits: rows.length,
        credits: rows.map(r => ({
          id: r.id,
          kwh: parseFloat(r.units_delivered || r.units_requested || 0),
          tx_hash: r.delivery_tx_hash,
          earned: parseFloat(r.total_amount || 0),
          date: r.created_at,
        }))
      }
    });
  } catch (err) {
    console.error('[ArkaGrid Carbon] Error fetching carbon credits:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch carbon credits' });
  }
});

// Consumer routes
router.post('/', authenticateToken, requireRole('consumer'), validateCreateTrade, createTrade);

// Parameterized routes
router.get('/:id', authenticateToken, getTradeById);

// Prosumer routes
router.post('/:id/confirm-delivery', authenticateToken, requireRole('prosumer'), confirmDelivery);

// Consumer routes
router.post('/:id/confirm-receipt', authenticateToken, requireRole('consumer'), confirmReceipt);
router.post('/:id/dispute', authenticateToken, requireRole('consumer'), raisDispute);

// Rating (both roles)
router.post('/:id/rate', authenticateToken, rateTrade);

export default router;
