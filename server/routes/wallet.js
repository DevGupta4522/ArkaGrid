import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { getBalance, addFunds, getTransactions } from '../controllers/walletController.js';

const router = express.Router();

const validateAddFunds = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
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

router.get('/balance', authenticateToken, getBalance);
router.post('/add-funds', authenticateToken, requireRole('consumer'), validateAddFunds, addFunds);
router.get('/transactions', authenticateToken, getTransactions);

export default router;
