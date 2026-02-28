import pool from '../db/connection.js';
import { PLATFORM_CONFIG } from '../../shared/constants.js';

export const getBalance = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT wallet_balance FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        wallet_balance: result.rows[0].wallet_balance
      }
    });
  } catch (error) {
    next(error);
  }
};

export const addFunds = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
        code: 'INVALID_AMOUNT'
      });
    }

    if (amount > PLATFORM_CONFIG.MAX_ADD_FUNDS) {
      return res.status(400).json({
        success: false,
        message: `Maximum ₹${PLATFORM_CONFIG.MAX_ADD_FUNDS} can be added per transaction`,
        code: 'AMOUNT_EXCEEDS_LIMIT'
      });
    }

    const client = await pool.connect();
    let wallet_balance;
    try {
      await client.query('BEGIN');
      await client.query('SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE', [userId]);
      const result = await client.query(
        'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance',
        [amount, userId]
      );
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'NOT_FOUND'
        });
      }
      wallet_balance = result.rows[0].wallet_balance;
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    res.json({
      success: true,
      message: `₹${amount} added to wallet successfully`,
      data: {
        wallet_balance: wallet_balance,
        amount_added: amount
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user info
    const userResult = await pool.query(
      'SELECT role, wallet_balance FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    // Get trades as buyer
    const buyerTradesResult = await pool.query(
      `SELECT 
        t.id, t.total_amount, t.platform_fee, t.units_requested, t.units_delivered,
        t.trade_status, t.escrow_status, t.created_at,
        u.name as seller_name,
        (t.total_amount - t.platform_fee) as amount_paid
       FROM trades t
       JOIN users u ON t.prosumer_id = u.id
       WHERE t.consumer_id = $1
       ORDER BY t.created_at DESC
       LIMIT 10`,
      [userId]
    );

    // Get trades as seller
    const sellerTradesResult = await pool.query(
      `SELECT 
        t.id, t.total_amount, t.platform_fee, t.units_requested, t.units_delivered,
        t.trade_status, t.escrow_status, t.created_at,
        u.name as buyer_name,
        (t.total_amount - t.platform_fee) as amount_earned
       FROM trades t
       JOIN users u ON t.consumer_id = u.id
       WHERE t.prosumer_id = $1
       ORDER BY t.created_at DESC
       LIMIT 10`,
      [userId]
    );

    // Calculate totals
    const buyerTrades = buyerTradesResult.rows;
    const sellerTrades = sellerTradesResult.rows;

    const totalAmountSpent = buyerTrades
      .filter(t => ['completed', 'partial'].includes(t.trade_status))
      .reduce((sum, t) => sum + parseFloat(t.amount_paid || 0), 0);

    const totalAmountEarned = sellerTrades
      .filter(t => ['completed', 'partial'].includes(t.trade_status))
      .reduce((sum, t) => sum + parseFloat(t.amount_earned || 0), 0);

    const totalUnitsTraded = (buyerTrades.reduce((sum, t) => sum + parseFloat(t.units_delivered || 0), 0) +
      sellerTrades.reduce((sum, t) => sum + parseFloat(t.units_delivered || 0), 0)) / 2;

    res.json({
      success: true,
      data: {
        current_balance: user.wallet_balance,
        transactions_as_buyer: buyerTrades,
        transactions_as_seller: user.role === 'prosumer' ? sellerTrades : [],
        summary: {
          total_amount_spent: totalAmountSpent,
          total_amount_earned: totalAmountEarned,
          total_units_traded_kwh: totalUnitsTraded,
          completed_trades: [...buyerTrades, ...sellerTrades].filter(t => t.trade_status === 'completed').length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
