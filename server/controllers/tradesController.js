import { v4 as uuidv4 } from 'uuid';
import pool from '../db/connection.js';
import { PLATFORM_CONFIG } from '../../shared/constants.js';

const DELIVERY_TIMEOUT_MS = PLATFORM_CONFIG.DELIVERY_TIMEOUT_MINUTES * 60 * 1000;
const DELIVERY_THRESHOLD = PLATFORM_CONFIG.DELIVERY_CONFIRMATION_THRESHOLD;
const PLATFORM_FEE_PERCENT = PLATFORM_CONFIG.PLATFORM_FEE_PERCENT;

export const createTrade = async (req, res, next) => {
  try {
    const { listing_id, units_requested } = req.body;
    const consumerId = req.user.id;

    // Validation
    if (!listing_id || !units_requested || units_requested <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing_id or units_requested',
        code: 'INVALID_INPUT'
      });
    }

    // Get listing
    const listingResult = await pool.query(
      'SELECT * FROM energy_listings WHERE id = $1',
      [listing_id]
    );

    if (listingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
        code: 'NOT_FOUND'
      });
    }

    const listing = listingResult.rows[0];

    if (listing.status !== 'active' || listing.available_until <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Listing is not active',
        code: 'LISTING_NOT_ACTIVE'
      });
    }

    if (units_requested > listing.units_remaining) {
      return res.status(400).json({
        success: false,
        message: `Only ${listing.units_remaining} kWh remaining`,
        code: 'INSUFFICIENT_UNITS'
      });
    }

    // Check consumer has sufficient balance
    const consumerResult = await pool.query(
      'SELECT wallet_balance FROM users WHERE id = $1',
      [consumerId]
    );

    if (consumerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consumer not found',
        code: 'NOT_FOUND'
      });
    }

    const total_amount = units_requested * listing.price_per_unit;
    const platform_fee = total_amount * (PLATFORM_FEE_PERCENT / 100);
    const consumer_balance = consumerResult.rows[0].wallet_balance;

    if (consumer_balance < total_amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Need ₹${total_amount}, have ₹${consumer_balance}`,
        code: 'INSUFFICIENT_BALANCE'
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Deduct from consumer wallet
      await client.query(
        'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
        [total_amount, consumerId]
      );

      // Create trade
      const delivery_deadline = new Date(Date.now() + DELIVERY_TIMEOUT_MS);
      const tradeResult = await client.query(
        `INSERT INTO trades 
         (id, listing_id, prosumer_id, consumer_id, units_requested, price_per_unit, 
          total_amount, platform_fee, trade_status, escrow_status, delivery_deadline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, listing_id, prosumer_id, consumer_id, units_requested, units_delivered,
                   price_per_unit, total_amount, platform_fee, trade_status, escrow_status,
                   delivery_deadline, created_at`,
        [
          uuidv4(), listing_id, listing.prosumer_id, consumerId, units_requested,
          listing.price_per_unit, total_amount, platform_fee, 'delivering', 'locked',
          delivery_deadline
        ]
      );

      // Update listing units_remaining
      const newUnitsRemaining = listing.units_remaining - units_requested;
      const newStatus = newUnitsRemaining <= 0 ? 'sold' : 'active';

      await client.query(
        'UPDATE energy_listings SET units_remaining = $1, status = $2 WHERE id = $3',
        [newUnitsRemaining, newStatus, listing_id]
      );

      await client.query('COMMIT');

      const trade = tradeResult.rows[0];

      res.status(201).json({
        success: true,
        message: 'Trade created successfully - payment locked in escrow',
        data: {
          ...trade,
          message: `Your ₹${total_amount} is safely locked. It will be released to the seller only after energy delivery is confirmed.`
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

export const getTradeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT t.*, 
              p.name as prosumer_name, c.name as consumer_name,
              el.price_per_unit as listing_price
       FROM trades t
       JOIN users p ON t.prosumer_id = p.id
       JOIN users c ON t.consumer_id = c.id
       JOIN energy_listings el ON t.listing_id = el.id
       WHERE t.id = $1 AND (t.prosumer_id = $2 OR t.consumer_id = $2)`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Trade not found or not authorized',
        code: 'NOT_FOUND'
      });
    }

    const trade = result.rows[0];

    // Get meter readings
    const readings = await pool.query(
      `SELECT id, reading_type, kwh_value, recorded_at, source 
       FROM meter_readings WHERE trade_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...trade,
        meter_readings: readings.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTrades = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT t.id, t.prosumer_id, t.consumer_id, t.units_requested, t.units_delivered,
              t.total_amount, t.platform_fee, t.trade_status, t.escrow_status,
              t.delivery_deadline, t.created_at,
              CASE 
                WHEN t.prosumer_id = $1 THEN c.name 
                ELSE p.name 
              END as other_party_name,
              CASE 
                WHEN t.prosumer_id = $1 THEN 'seller' 
                ELSE 'buyer' 
              END as my_role
       FROM trades t
       JOIN users p ON t.prosumer_id = p.id
       JOIN users c ON t.consumer_id = c.id
       WHERE t.prosumer_id = $1 OR t.consumer_id = $1
       ORDER BY t.created_at DESC`,
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

export const confirmDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prosumerId = req.user.id;

    // Get trade
    const tradeResult = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND prosumer_id = $2',
      [id, prosumerId]
    );

    if (tradeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Trade not found or not authorized',
        code: 'NOT_FOUND'
      });
    }

    const trade = tradeResult.rows[0];

    if (trade.trade_status !== 'delivering') {
      return res.status(400).json({
        success: false,
        message: 'Trade cannot be marked as delivered in current state',
        code: 'INVALID_STATUS'
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Record simulated outgoing meter reading
      const readingId = uuidv4();
      await client.query(
        `INSERT INTO meter_readings (id, user_id, trade_id, reading_type, kwh_value, source)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [readingId, prosumerId, id, 'outgoing', trade.units_requested, 'simulated']
      );

      // Update trade
      const updateResult = await client.query(
        `UPDATE trades 
         SET trade_status = $1, delivery_confirmed_at = NOW()
         WHERE id = $2
         RETURNING *`,
        ['completing', id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Energy delivery marked. Waiting for consumer confirmation...',
        data: updateResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

export const confirmReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const consumerId = req.user.id;

    // Get trade
    const tradeResult = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND consumer_id = $2',
      [id, consumerId]
    );

    if (tradeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Trade not found or not authorized',
        code: 'NOT_FOUND'
      });
    }

    const trade = tradeResult.rows[0];

    if (trade.trade_status !== 'completing') {
      return res.status(400).json({
        success: false,
        message: 'Trade is not ready for receipt confirmation',
        code: 'INVALID_STATUS'
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Record simulated incoming meter reading
      const readingId = uuidv4();
      await client.query(
        `INSERT INTO meter_readings (id, user_id, trade_id, reading_type, kwh_value, source)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [readingId, consumerId, id, 'incoming', trade.units_requested, 'simulated']
      );

      // Get outgoing meter reading
      const outgoingReading = await client.query(
        'SELECT kwh_value FROM meter_readings WHERE trade_id = $1 AND reading_type = $2',
        [id, 'outgoing']
      );

      const delivered = outgoingReading.rows[0]?.kwh_value || 0;
      const requested = trade.units_requested;
      const deliveryPercentage = delivered / requested;

      let escrow_status, settlement_amount, refund_amount, new_trade_status = 'completed';

      if (deliveryPercentage >= DELIVERY_THRESHOLD) {
        // Full delivery
        escrow_status = 'released';
        settlement_amount = trade.total_amount - trade.platform_fee;
        refund_amount = 0;
      } else {
        // Partial delivery
        escrow_status = 'partial';
        settlement_amount = (delivered / requested) * (trade.total_amount - trade.platform_fee);
        refund_amount = trade.total_amount - ((delivered / requested) * trade.total_amount);
      }

      // Release funds to prosumer
      await client.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
        [settlement_amount, trade.prosumer_id]
      );

      // Refund to consumer if partial
      if (refund_amount > 0) {
        await client.query(
          'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
          [refund_amount, consumerId]
        );
      }

      // Update trade
      const updateResult = await client.query(
        `UPDATE trades 
         SET trade_status = $1, escrow_status = $2, units_delivered = $3, payment_released_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [new_trade_status, escrow_status, delivered, id]
      );

      await client.query('COMMIT');

      const resultTrade = updateResult.rows[0];

      res.json({
        success: true,
        message: escrow_status === 'released'
          ? 'Receipt confirmed - payment released to seller'
          : `Receipt confirmed - partial delivery. Seller credited ₹${settlement_amount}, refund ₹${refund_amount} to buyer`,
        data: {
          ...resultTrade,
          settlement: {
            escrow_status,
            amount_to_prosumer: settlement_amount,
            amount_refunded_to_consumer: refund_amount,
            delivered_kwh: delivered,
            requested_kwh: requested
          }
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

export const raisDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const consumerId = req.user.id;

    // Get trade
    const tradeResult = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND consumer_id = $2',
      [id, consumerId]
    );

    if (tradeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Trade not found or not authorized',
        code: 'NOT_FOUND'
      });
    }

    const trade = tradeResult.rows[0];

    if (!['completing', 'completed'].includes(trade.trade_status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only raise dispute for completing or completed trades',
        code: 'INVALID_STATUS'
      });
    }

    // Update trade status
    const updateResult = await pool.query(
      'UPDATE trades SET trade_status = $1 WHERE id = $2 RETURNING *',
      ['disputed', id]
    );

    // Note: In production, send notification to admin
    console.log(`📢 Dispute raised for trade ${id} by consumer ${consumerId}`);

    res.json({
      success: true,
      message: 'Dispute raised successfully. Admin will review and resolve shortly.',
      data: updateResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

export const resolveDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution, units_delivered } = req.body;

    // Verify trade exists
    const tradeResult = await pool.query(
      'SELECT * FROM trades WHERE id = $1',
      [id]
    );

    if (tradeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Trade not found',
        code: 'NOT_FOUND'
      });
    }

    const trade = tradeResult.rows[0];

    if (trade.trade_status !== 'disputed') {
      return res.status(400).json({
        success: false,
        message: 'Trade is not in disputed status',
        code: 'INVALID_STATUS'
      });
    }

    if (!['release', 'refund', 'partial'].includes(resolution)) {
      return res.status(400).json({
        success: false,
        message: 'Resolution must be release, refund, or partial',
        code: 'INVALID_RESOLUTION'
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let escrow_status, settlement_amount, refund_amount;
      const new_trade_status = 'completed';

      if (resolution === 'release') {
        escrow_status = 'released';
        settlement_amount = trade.total_amount - trade.platform_fee;
        refund_amount = 0;
      } else if (resolution === 'refund') {
        escrow_status = 'refunded';
        settlement_amount = 0;
        refund_amount = trade.total_amount;
      } else {
        // partial
        escrow_status = 'partial';
        settlement_amount = (units_delivered / trade.units_requested) * (trade.total_amount - trade.platform_fee);
        refund_amount = trade.total_amount - ((units_delivered / trade.units_requested) * trade.total_amount);
      }

      // Execute settlement
      if (settlement_amount > 0) {
        await client.query(
          'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
          [settlement_amount, trade.prosumer_id]
        );
      }

      if (refund_amount > 0) {
        await client.query(
          'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
          [refund_amount, trade.consumer_id]
        );
      }

      // Update trade
      const updateResult = await client.query(
        `UPDATE trades 
         SET trade_status = $1, escrow_status = $2, units_delivered = COALESCE($3, units_delivered), 
             payment_released_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [new_trade_status, escrow_status, units_delivered || null, id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Dispute resolved - ${resolution}`,
        data: updateResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

// ─── Rate Trade ───
export const rateTrade = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { score, comment } = req.body;
    const userId = req.user.id;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating score must be between 1 and 5',
        code: 'INVALID_SCORE'
      });
    }

    // Get the trade
    const tradeResult = await pool.query(
      'SELECT * FROM trades WHERE id = $1', [id]
    );

    if (tradeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Trade not found',
        code: 'TRADE_NOT_FOUND'
      });
    }

    const trade = tradeResult.rows[0];

    // Only completed trades can be rated
    if (trade.trade_status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed trades can be rated',
        code: 'TRADE_NOT_COMPLETED'
      });
    }

    // User must be part of the trade
    if (trade.prosumer_id !== userId && trade.consumer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this trade',
        code: 'NOT_AUTHORIZED'
      });
    }

    // Determine who is being rated
    const ratedId = trade.prosumer_id === userId ? trade.consumer_id : trade.prosumer_id;

    // Check if already rated
    const existingRating = await pool.query(
      'SELECT id FROM ratings WHERE trade_id = $1 AND rater_id = $2',
      [id, userId]
    );

    if (existingRating.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You have already rated this trade',
        code: 'ALREADY_RATED'
      });
    }

    // Insert rating
    await pool.query(
      'INSERT INTO ratings (trade_id, rater_id, rated_id, score, comment) VALUES ($1, $2, $3, $4, $5)',
      [id, userId, ratedId, score, comment || null]
    );

    // Update rated user's average rating
    const ratingStats = await pool.query(
      'SELECT AVG(score)::DECIMAL(3,1) as avg_rating, COUNT(*) as count FROM ratings WHERE rated_id = $1',
      [ratedId]
    );

    await pool.query(
      'UPDATE users SET rating_avg = $1, rating_count = $2 WHERE id = $3',
      [ratingStats.rows[0].avg_rating, ratingStats.rows[0].count, ratedId]
    );

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        score,
        rated_user_new_avg: parseFloat(ratingStats.rows[0].avg_rating)
      }
    });
  } catch (error) {
    next(error);
  }
};
