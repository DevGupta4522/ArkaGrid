import { v4 as uuidv4 } from 'uuid';
import pool from '../db/connection.js';
import { PLATFORM_CONFIG } from '../../shared/constants.js';

const DELIVERY_THRESHOLD = PLATFORM_CONFIG.DELIVERY_CONFIRMATION_THRESHOLD;

export const getStats = async (req, res, next) => {
    try {
        // Total users
        const usersResult = await pool.query(
            'SELECT COUNT(*) as total, role FROM users GROUP BY role'
        );

        // Total trades today
        const tradesTodayResult = await pool.query(
            `SELECT COUNT(*) as total FROM trades WHERE DATE(created_at) = CURRENT_DATE`
        );

        // Disputed trades
        const disputedResult = await pool.query(
            `SELECT COUNT(*) as total FROM trades WHERE trade_status = 'disputed'`
        );

        // Platform fees collected
        const feesResult = await pool.query(
            `SELECT COALESCE(SUM(platform_fee), 0) as total FROM trades WHERE trade_status = 'completed'`
        );

        // All trades summary
        const tradesResult = await pool.query(
            `SELECT trade_status, COUNT(*) as count FROM trades GROUP BY trade_status`
        );

        const usersByRole = {};
        let totalUsers = 0;
        usersResult.rows.forEach(r => {
            usersByRole[r.role] = parseInt(r.total);
            totalUsers += parseInt(r.total);
        });

        res.json({
            success: true,
            data: {
                total_users: totalUsers,
                users_by_role: usersByRole,
                trades_today: parseInt(tradesTodayResult.rows[0]?.total || 0),
                disputed_trades: parseInt(disputedResult.rows[0]?.total || 0),
                platform_fees_collected: parseFloat(feesResult.rows[0]?.total || 0),
                trades_by_status: tradesResult.rows.reduce((acc, r) => {
                    acc[r.trade_status] = parseInt(r.count);
                    return acc;
                }, {}),
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getDisputedTrades = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT t.*,
              p.name as prosumer_name, p.email as prosumer_email,
              c.name as consumer_name, c.email as consumer_email,
              el.units_available, el.price_per_unit as listing_price
       FROM trades t
       JOIN users p ON t.prosumer_id = p.id
       JOIN users c ON t.consumer_id = c.id
       JOIN energy_listings el ON t.listing_id = el.id
       WHERE t.trade_status = 'disputed'
       ORDER BY t.created_at DESC`
        );

        res.json({
            success: true,
            data: result.rows,
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
                code: 'NOT_FOUND',
            });
        }

        const trade = tradeResult.rows[0];

        if (trade.trade_status !== 'disputed') {
            return res.status(400).json({
                success: false,
                message: 'Trade is not in disputed status',
                code: 'INVALID_STATUS',
            });
        }

        if (!['release', 'refund', 'partial'].includes(resolution)) {
            return res.status(400).json({
                success: false,
                message: 'Resolution must be release, refund, or partial',
                code: 'INVALID_RESOLUTION',
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
                settlement_amount =
                    (units_delivered / trade.units_requested) *
                    (trade.total_amount - trade.platform_fee);
                refund_amount =
                    trade.total_amount -
                    (units_delivered / trade.units_requested) * trade.total_amount;
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
                message: `Dispute resolved — ${resolution}`,
                data: updateResult.rows[0],
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
