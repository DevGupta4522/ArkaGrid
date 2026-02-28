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
  resolveDispute
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

// Consumer routes
router.post('/', authenticateToken, requireRole('consumer'), validateCreateTrade, createTrade);

// Parameterized routes
router.get('/:id', authenticateToken, getTradeById);

// Prosumer routes
router.post('/:id/confirm-delivery', authenticateToken, requireRole('prosumer'), confirmDelivery);

// Consumer routes
router.post('/:id/confirm-receipt', authenticateToken, requireRole('consumer'), confirmReceipt);
router.post('/:id/dispute', authenticateToken, requireRole('consumer'), raisDispute);

export default router;
