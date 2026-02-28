import pool from '../db/connection.js';
import { createNotification } from '../controllers/notificationsController.js';

export const processEscrowTimeouts = async () => {
  try {
    // Find all expired trades
    const expiredTradesResult = await pool.query(
      `SELECT * FROM trades 
         WHERE (trade_status = 'delivering' OR trade_status = 'pending')
         AND delivery_deadline < NOW()
         AND escrow_status = 'locked'`
    );

    if (expiredTradesResult.rows.length === 0) {
      return; // No expired trades
    }

    console.log(`🔄 Processing ${expiredTradesResult.rows.length} expired trades...`);

    for (const trade of expiredTradesResult.rows) {
      try {
        // Start transaction
        const client = await pool.connect();

        try {
          await client.query('BEGIN');

          // Refund consumer
          await client.query('SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE', [trade.consumer_id]);
          await client.query(
            'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
            [trade.total_amount, trade.consumer_id]
          );

          // Restore listing units
          await client.query(
            `UPDATE energy_listings 
               SET units_remaining = units_remaining + $1,
                   status = CASE WHEN available_until > NOW() THEN 'active' ELSE status END
               WHERE id = $2`,
            [trade.units_requested, trade.listing_id]
          );

          // Update trade
          await client.query(
            `UPDATE trades 
               SET trade_status = $1, escrow_status = $2
               WHERE id = $3`,
            ['failed', 'refunded', trade.id]
          );

          await client.query('COMMIT');

          // Notify buyer and seller
          await createNotification(null, trade.consumer_id, 'trade_failed', 'Trade Auto-Refunded', `The delivery deadline passed for ${trade.units_requested} kWh. ₹${trade.total_amount} has been refunded to your wallet.`, trade.id);
          await createNotification(null, trade.prosumer_id, 'trade_failed', 'Trade Failed', `Delivery deadline passed for trade. Escrow refunded to buyer.`, trade.id);

          console.log(`✅ Trade ${trade.id} auto-refunded: delivery deadline expired`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      } catch (error) {
        console.error(`❌ Error processing trade ${trade.id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in escrow timeout job:', error.message);
  }
};

export const startEscrowTimeoutJob = () => {
  console.log('⏱️  Starting escrow timeout job (runs every 5 minutes)');
  setInterval(processEscrowTimeouts, 5 * 60 * 1000); // Run every 5 minutes
};
