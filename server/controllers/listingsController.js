import { v4 as uuidv4 } from 'uuid';
import pool from '../db/connection.js';

export const createListing = async (req, res, next) => {
  try {
    const { units_available, price_per_unit, available_from, available_until, latitude, longitude } = req.body;
    const prosumerId = req.user.id;

    // Validation
    if (!units_available || !price_per_unit || !available_from || !available_until) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        code: 'MISSING_FIELDS'
      });
    }

    if (units_available <= 0 || price_per_unit <= 0 || price_per_unit > 15) {
      return res.status(400).json({
        success: false,
        message: 'Invalid units or price',
        code: 'INVALID_INPUT'
      });
    }

    const availableUntilTime = new Date(available_until);
    if (availableUntilTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'available_until must be in the future',
        code: 'INVALID_DATETIME'
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location (latitude, longitude) is required',
        code: 'MISSING_LOCATION'
      });
    }

    const result = await pool.query(
      `INSERT INTO energy_listings 
       (id, prosumer_id, units_available, price_per_unit, units_remaining, available_from, available_until, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, prosumer_id, units_available, price_per_unit, units_remaining, available_from, available_until, 
                 status, latitude, longitude, created_at`,
      [uuidv4(), prosumerId, units_available, price_per_unit, units_available, available_from, available_until, latitude, longitude]
    );

    const listing = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Energy listing created successfully',
      data: listing
    });
  } catch (error) {
    next(error);
  }
};

export const getListings = async (req, res, next) => {
  try {
    const { lat, lng, radius_km } = req.query;
    let query = `
      SELECT 
        el.id, el.prosumer_id, el.units_available, el.price_per_unit, el.units_remaining,
        el.available_from, el.available_until, el.status, el.delivery_radius_km,
        el.latitude, el.longitude, el.created_at,
        u.name as prosumer_name, u.rating_avg, u.rating_count
      FROM energy_listings el
      JOIN users u ON el.prosumer_id = u.id
      WHERE el.status = 'active' AND el.available_until > NOW()
    `;
    const params = [];

    if (lat && lng && radius_km) {
      // Haversine formula for distance filtering
      query += ` AND (
        3959 * acos(cos(radians($1)) * cos(radians(el.latitude)) * 
          cos(radians(el.longitude) - radians($2)) + 
          sin(radians($1)) * sin(radians(el.latitude))
        ) <= $3
      )`;
      params.push(lat, lng, radius_km);
    }

    query += ` ORDER BY el.price_per_unit ASC, el.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

export const getListingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        el.id, el.prosumer_id, el.units_available, el.price_per_unit, el.units_remaining,
        el.available_from, el.available_until, el.status, el.delivery_radius_km,
        el.latitude, el.longitude, el.created_at,
        u.name as prosumer_name, u.rating_avg, u.rating_count
      FROM energy_listings el
      JOIN users u ON el.prosumer_id = u.id
      WHERE el.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { price_per_unit, available_until } = req.body;
    const userId = req.user.id;

    // Check listing exists and user owns it
    const listing = await pool.query(
      'SELECT * FROM energy_listings WHERE id = $1',
      [id]
    );

    if (listing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
        code: 'NOT_FOUND'
      });
    }

    if (listing.rows[0].prosumer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot update another user\'s listing',
        code: 'FORBIDDEN'
      });
    }

    // Check if there are active trades
    const activeTrades = await pool.query(
      'SELECT COUNT(*) FROM trades WHERE listing_id = $1 AND trade_status IN (\'pending\', \'delivering\', \'completing\')',
      [id]
    );

    if (parseInt(activeTrades.rows[0].count) > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot update listing with active trades',
        code: 'ACTIVE_TRADES'
      });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (price_per_unit !== undefined) {
      if (price_per_unit <= 0 || price_per_unit > 15) {
        return res.status(400).json({
          success: false,
          message: 'Invalid price',
          code: 'INVALID_PRICE'
        });
      }
      updates.push(`price_per_unit = $${paramIndex++}`);
      values.push(price_per_unit);
    }

    if (available_until !== undefined) {
      if (new Date(available_until) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'available_until must be in the future',
          code: 'INVALID_DATETIME'
        });
      }
      updates.push(`available_until = $${paramIndex++}`);
      values.push(available_until);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
        code: 'NO_UPDATES'
      });
    }

    values.push(id);
    const query = `UPDATE energy_listings SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: 'Listing updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check listing exists and user owns it
    const listing = await pool.query(
      'SELECT * FROM energy_listings WHERE id = $1',
      [id]
    );

    if (listing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
        code: 'NOT_FOUND'
      });
    }

    if (listing.rows[0].prosumer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete another user\'s listing',
        code: 'FORBIDDEN'
      });
    }

    // Check if there are active trades
    const activeTrades = await pool.query(
      'SELECT COUNT(*) FROM trades WHERE listing_id = $1 AND trade_status IN (\'pending\', \'delivering\', \'completing\')',
      [id]
    );

    if (parseInt(activeTrades.rows[0].count) > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot cancel listing with active trades',
        code: 'ACTIVE_TRADES'
      });
    }

    // Soft delete
    await pool.query(
      'UPDATE energy_listings SET status = $1 WHERE id = $2',
      ['cancelled', id]
    );

    res.json({
      success: true,
      message: 'Listing cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getMyListings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, units_available, price_per_unit, units_remaining, available_from, 
              available_until, status, latitude, longitude, created_at
       FROM energy_listings 
       WHERE prosumer_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};
