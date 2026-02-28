import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
    getStats,
    getDisputedTrades,
    resolveDispute,
} from '../controllers/adminController.js';
import { processEscrowTimeouts } from '../jobs/escrowTimeout.js';

const router = express.Router();

const validateResolveDispute = [
    body('resolution')
        .isIn(['release', 'refund', 'partial'])
        .withMessage('Invalid resolution'),
    body('units_delivered')
        .optional()
        .isFloat({ gte: 0 })
        .withMessage('Invalid units_delivered'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                code: 'VALIDATION_ERROR',
                errors: errors.array(),
            });
        }
        next();
    },
];

// All admin routes require authentication + admin role
router.use(authenticateToken, requireRole('admin'));

router.get('/stats', getStats);
router.get('/disputes', getDisputedTrades);
router.post('/trades/:id/resolve', validateResolveDispute, resolveDispute);

router.post('/test/trigger-timeout-job', async (req, res, next) => {
    try {
        await processEscrowTimeouts();
        res.json({ success: true, message: 'Escrow timeout job triggered manually.' });
    } catch (error) {
        next(error);
    }
});

export default router;
