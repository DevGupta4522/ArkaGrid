import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getMyListings
} from '../controllers/listingsController.js';

const router = express.Router();

const validateCreateListing = [
  body('units_available').isFloat({ gt: 0 }).withMessage('Units must be greater than 0'),
  body('price_per_unit').isFloat({ gt: 0, lte: 15 }).withMessage('Price must be between 0 and 15'),
  body('available_from').isISO8601().withMessage('Invalid available_from datetime'),
  body('available_until').isISO8601().withMessage('Invalid available_until datetime'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
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

const validateUpdateListing = [
  body('price_per_unit').optional().isFloat({ gt: 0, lte: 15 }).withMessage('Price must be between 0 and 15'),
  body('available_until').optional().isISO8601().withMessage('Invalid available_until datetime'),
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

// Protected routes — specific paths MUST come before parameterized /:id
router.get('/my', authenticateToken, requireRole('prosumer'), getMyListings);

// Public routes
router.get('/', getListings);
router.get('/:id', getListingById);

// Protected routes (prosumer only)
router.post('/', authenticateToken, requireRole('prosumer'), validateCreateListing, createListing);
router.patch('/:id', authenticateToken, requireRole('prosumer'), validateUpdateListing, updateListing);
router.delete('/:id', authenticateToken, requireRole('prosumer'), deleteListing);

export default router;
