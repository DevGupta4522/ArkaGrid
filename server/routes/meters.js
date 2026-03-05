/**
 * ArkaGrid Meter API Routes
 * Endpoints for retrieving meter readings and prosumer stats.
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../db/connection.js';

const router = express.Router();

// ── GET /api/meters/readings/:tradeId ───────────────
// Returns all meter readings for a specific trade
router.get('/readings/:tradeId', authenticateToken, async (req, res) => {
  try {
    const { tradeId } = req.params;

    // Verify user is involved in this trade
    const { rows: tradeCheck } = await pool.query(`
      SELECT id FROM trades
      WHERE id = $1 AND (prosumer_id = $2 OR consumer_id = $2)
    `, [tradeId, req.user.id]);

    if (tradeCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this trade'
      });
    }

    const { rows } = await pool.query(`
      SELECT id, user_id, reading_type, kwh_value, recorded_at, source,
             voltage, current_amps, power_factor
      FROM meter_readings
      WHERE trade_id = $1
      ORDER BY recorded_at DESC
      LIMIT 100
    `, [tradeId]);

    res.json({
      success: true,
      data: rows.map(r => ({
        ...r,
        kwh_value: parseFloat(r.kwh_value),
        voltage: r.voltage ? parseFloat(r.voltage) : null,
        current_amps: r.current_amps ? parseFloat(r.current_amps) : null,
        power_factor: r.power_factor ? parseFloat(r.power_factor) : null,
      }))
    });
  } catch (err) {
    console.error('[ArkaGrid Meters] Error fetching readings:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch meter readings' });
  }
});

// ── GET /api/meters/generation/:userId ──────────────
// Returns generation readings for last 24 hours, grouped by hour
router.get('/generation/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Prosumer can only see own data
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own generation data'
      });
    }

    const { rows } = await pool.query(`
      SELECT 
        DATE_TRUNC('hour', recorded_at) as hour,
        ROUND(AVG(kwh_value::numeric), 3) as avg_kwh,
        ROUND(MAX(kwh_value::numeric), 3) as max_kwh,
        ROUND(MIN(kwh_value::numeric), 3) as min_kwh,
        COUNT(*) as count
      FROM meter_readings
      WHERE user_id = $1 
        AND reading_type = 'generation'
        AND recorded_at > NOW() - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', recorded_at)
      ORDER BY hour ASC
    `, [userId]);

    res.json({
      success: true,
      data: rows.map(r => ({
        hour: r.hour,
        avg_kwh: parseFloat(r.avg_kwh),
        max_kwh: parseFloat(r.max_kwh),
        min_kwh: parseFloat(r.min_kwh),
        count: parseInt(r.count),
      }))
    });
  } catch (err) {
    console.error('[ArkaGrid Meters] Error fetching generation:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch generation data' });
  }
});

// ── GET /api/meters/stats/:userId ───────────────────
// Returns prosumer energy stats
router.get('/stats/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own stats'
      });
    }

    // Today's generation
    const { rows: todayGen } = await pool.query(`
      SELECT COALESCE(SUM(kwh_value::numeric), 0) as total
      FROM meter_readings
      WHERE user_id = $1 AND reading_type = 'generation'
        AND recorded_at >= DATE_TRUNC('day', NOW())
    `, [userId]);

    // Today's sold (outgoing readings for completed trades)
    const { rows: todaySold } = await pool.query(`
      SELECT COALESCE(SUM(mr.kwh_value::numeric), 0) as total
      FROM meter_readings mr
      JOIN trades t ON mr.trade_id = t.id
      WHERE mr.user_id = $1 AND mr.reading_type = 'outgoing'
        AND mr.recorded_at >= DATE_TRUNC('day', NOW())
        AND t.trade_status IN ('completed', 'completing')
    `, [userId]);

    // This month generation
    const { rows: monthGen } = await pool.query(`
      SELECT COALESCE(SUM(kwh_value::numeric), 0) as total
      FROM meter_readings
      WHERE user_id = $1 AND reading_type = 'generation'
        AND recorded_at >= DATE_TRUNC('month', NOW())
    `, [userId]);

    // All-time Solana-verified
    const { rows: allTimeVerified } = await pool.query(`
      SELECT COALESCE(SUM(units_delivered::numeric), 0) as total
      FROM trades
      WHERE prosumer_id = $1 AND blockchain_status = 'settled'
    `, [userId]);

    const todayGenerated = parseFloat(todayGen[0].total);
    const todaySoldKwh = parseFloat(todaySold[0].total);

    res.json({
      success: true,
      data: {
        today_generated_kwh: parseFloat(todayGenerated.toFixed(3)),
        today_sold_kwh: parseFloat(todaySoldKwh.toFixed(3)),
        today_surplus_kwh: parseFloat(Math.max(0, todayGenerated - todaySoldKwh).toFixed(3)),
        this_month_generated_kwh: parseFloat(parseFloat(monthGen[0].total).toFixed(3)),
        all_time_kwh_verified_on_solana: parseFloat(parseFloat(allTimeVerified[0].total).toFixed(3)),
      }
    });
  } catch (err) {
    console.error('[ArkaGrid Meters] Error fetching stats:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch meter stats' });
  }
});

export default router;
