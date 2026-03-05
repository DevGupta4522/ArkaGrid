/**
 * ArkaGrid MQTT Meter Handler
 * Subscribes to meter topics and processes readings.
 * Triggers Solana settlement when delivery threshold is met.
 */
import { broker } from './broker.js';
import pool from '../db/connection.js';

let solanaService = null;

// Lazy-load solana service (may not be available)
async function getSolanaService() {
  if (solanaService) return solanaService;
  try {
    solanaService = await import('../services/solana.js');
    return solanaService;
  } catch {
    return null;
  }
}

// ── Start Handlers ──────────────────────────────────
export function startMeterHandler() {
  broker.on('publish', async (packet, client) => {
    if (!client || !packet.topic.startsWith('arkagrid/')) return;

    try {
      const parts = packet.topic.split('/');
      // arkagrid/meters/{userId}/{type}
      if (parts[1] === 'meters' && parts.length === 4) {
        const userId = parts[2];
        const type = parts[3];

        if (type === 'outgoing') {
          await handleOutgoing(packet, userId);
        } else if (type === 'incoming') {
          await handleIncoming(packet, userId);
        } else if (type === 'generation') {
          await handleGeneration(packet, userId);
        }
      }
    } catch (err) {
      console.error('[ArkaGrid MQTT] Handler error:', err.message);
    }
  });

  console.log('✅ [ArkaGrid MQTT] Meter handlers registered');
}

// ── Outgoing (Prosumer sending kWh) ─────────────────
async function handleOutgoing(packet, userId) {
  try {
    const data = JSON.parse(packet.payload.toString());

    // Validate message freshness (< 10 minutes old)
    const age = Date.now() - new Date(data.timestamp).getTime();
    if (age > 600000) {
      console.warn(`[ArkaGrid MQTT] Stale outgoing reading from ${userId.slice(0, 8)}`);
      return;
    }

    // Find active trade for this prosumer
    const { rows } = await pool.query(`
      SELECT * FROM trades 
      WHERE prosumer_id = $1 
      AND trade_status = 'delivering'
      AND delivery_deadline > NOW()
      ORDER BY created_at DESC LIMIT 1
    `, [userId]);

    if (rows.length === 0) return;
    const trade = rows[0];

    // Store meter reading
    await pool.query(`
      INSERT INTO meter_readings 
        (user_id, trade_id, reading_type, kwh_value, recorded_at, source, voltage, current_amps, power_factor)
      VALUES ($1, $2, 'outgoing', $3, $4, $5, $6, $7, $8)
    `, [
      userId, trade.id, data.kwhValue,
      new Date(data.timestamp), data.source || 'simulated',
      data.voltage || null, data.current || null, data.powerFactor || null
    ]);

    // Check if delivery threshold met (98%+)
    const deliveryPct = (data.kwhValue / parseFloat(trade.units_requested)) * 100;

    if (deliveryPct >= 98) {
      console.log(`[ArkaGrid MQTT] ✅ Delivery threshold met for trade ${trade.id.slice(0, 8)} (${deliveryPct.toFixed(1)}%)`);
      await triggerSettlement(trade, data.kwhValue);
    }

    // Anomaly detection
    await detectAnomaly(userId, trade.id, data.kwhValue);

  } catch (err) {
    console.error('[ArkaGrid MQTT] handleOutgoing error:', err.message);
  }
}

// ── Incoming (Consumer receiving kWh) ───────────────
async function handleIncoming(packet, userId) {
  try {
    const data = JSON.parse(packet.payload.toString());

    // Find active trade for this consumer
    const { rows } = await pool.query(`
      SELECT * FROM trades 
      WHERE consumer_id = $1 
      AND trade_status IN ('delivering', 'completing')
      AND delivery_deadline > NOW()
      ORDER BY created_at DESC LIMIT 1
    `, [userId]);

    if (rows.length === 0) return;
    const trade = rows[0];

    // Store meter reading
    await pool.query(`
      INSERT INTO meter_readings 
        (user_id, trade_id, reading_type, kwh_value, recorded_at, source, voltage, current_amps, power_factor)
      VALUES ($1, $2, 'incoming', $3, $4, $5, $6, $7, $8)
    `, [
      userId, trade.id, data.kwhValue,
      new Date(data.timestamp), data.source || 'simulated',
      data.voltage || null, data.current || null, data.powerFactor || null
    ]);

    // Cross-verify with outgoing reading
    const { rows: outgoing } = await pool.query(`
      SELECT kwh_value FROM meter_readings
      WHERE trade_id = $1 AND reading_type = 'outgoing'
      ORDER BY recorded_at DESC LIMIT 1
    `, [trade.id]);

    if (outgoing.length > 0) {
      const outKwh = parseFloat(outgoing[0].kwh_value);
      const inKwh = data.kwhValue;
      const deliveryPct = (inKwh / parseFloat(trade.units_requested)) * 100;

      console.log(`[ArkaGrid MQTT] Trade ${trade.id.slice(0, 8)}: ` +
        `Out=${outKwh.toFixed(3)}kWh In=${inKwh.toFixed(3)}kWh (${deliveryPct.toFixed(1)}%)`);

      // Publish trade status update
      broker.publish({
        topic: `arkagrid/trades/${trade.id}/status`,
        payload: JSON.stringify({
          tradeId: trade.id,
          kwhOut: outKwh,
          kwhIn: inKwh,
          deliveryPct: parseFloat(deliveryPct.toFixed(1)),
          timestamp: new Date().toISOString()
        }),
        qos: 1,
        retain: false,
      });
    }
  } catch (err) {
    console.error('[ArkaGrid MQTT] handleIncoming error:', err.message);
  }
}

// ── Generation (Solar panel output) ─────────────────
async function handleGeneration(packet, userId) {
  try {
    const data = JSON.parse(packet.payload.toString());

    await pool.query(`
      INSERT INTO meter_readings
        (user_id, trade_id, reading_type, kwh_value, recorded_at, source)
      VALUES ($1, NULL, 'generation', $2, $3, $4)
    `, [userId, data.kwhValue, new Date(data.timestamp), data.source || 'simulated']);

  } catch (err) {
    console.error('[ArkaGrid MQTT] handleGeneration error:', err.message);
  }
}

// ── Settlement trigger ──────────────────────────────
async function triggerSettlement(trade, kwhDelivered) {
  try {
    // Update trade status in DB first
    await pool.query(`
      UPDATE trades SET trade_status='completing', 
      units_delivered=$1 WHERE id=$2
    `, [kwhDelivered, trade.id]);

    // Try Solana settlement
    const solana = await getSolanaService();
    if (solana) {
      try {
        const result = await solana.confirmDeliveryOnSolana({
          tradeId: trade.id,
          kwhDelivered,
          buyerWallet: trade.consumer_wallet,
          sellerWallet: trade.prosumer_wallet,
          treasuryWallet: process.env.ARKAGRID_TREASURY_PUBKEY,
        });

        await pool.query(`
          UPDATE trades SET 
            trade_status='completed',
            escrow_status='released',
            delivery_tx_hash=$1,
            blockchain_status='settled',
            units_delivered=$2,
            delivery_confirmed_at=NOW(),
            payment_released_at=NOW()
          WHERE id=$3
        `, [result.txHash, kwhDelivered, trade.id]);

        console.log(`[ArkaGrid MQTT] ✅ Trade ${trade.id.slice(0, 8)} settled on Solana: ${result.txHash?.slice(0, 16)}...`);
      } catch (err) {
        console.error('[ArkaGrid MQTT] Solana settlement failed — DB escrow active:', err.message);
        // Fallback: complete in DB only
        await pool.query(`
          UPDATE trades SET 
            trade_status='completed',
            escrow_status='released',
            blockchain_status='settlement_failed',
            units_delivered=$1,
            delivery_confirmed_at=NOW(),
            payment_released_at=NOW()
          WHERE id=$2
        `, [kwhDelivered, trade.id]);
      }
    } else {
      // No Solana — DB-only settlement  
      await pool.query(`
        UPDATE trades SET 
          trade_status='completed',
          escrow_status='released',
          blockchain_status='db_only',
          units_delivered=$1,
          delivery_confirmed_at=NOW(),
          payment_released_at=NOW()
        WHERE id=$2
      `, [kwhDelivered, trade.id]);
    }

    // Credit prosumer wallet in DB
    const prosumerAmount = parseFloat(trade.total_amount) - parseFloat(trade.platform_fee || 0);
    await pool.query(`
      UPDATE users SET wallet_balance = wallet_balance + $1 
      WHERE id = $2
    `, [prosumerAmount, trade.prosumer_id]);

    // Carbon credit notification
    await pool.query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, $2, $3, $4)
    `, [
      trade.prosumer_id,
      '🌱 Carbon Credit Issued',
      `ArkaGrid verified ${kwhDelivered} kWh of clean solar energy. Carbon credit recorded.`,
      'carbon_credit'
    ]);

    console.log(`[ArkaGrid MQTT] ✅ Trade ${trade.id.slice(0, 8)} fully settled — prosumer credited ₹${prosumerAmount.toFixed(2)}`);
  } catch (err) {
    console.error('[ArkaGrid MQTT] triggerSettlement error:', err.message);
  }
}

// ── Anomaly Detection ───────────────────────────────
async function detectAnomaly(userId, tradeId, currentKwh) {
  try {
    const { rows } = await pool.query(`
      SELECT kwh_value FROM meter_readings
      WHERE user_id=$1 AND reading_type='outgoing'
      ORDER BY recorded_at DESC LIMIT 3
    `, [userId]);

    if (rows.length >= 2) {
      const avg = rows.reduce((sum, r) => sum + parseFloat(r.kwh_value), 0) / rows.length;
      const dropPct = ((avg - currentKwh) / avg) * 100;

      if (dropPct > 50) {
        console.warn(`[ArkaGrid MQTT] ⚠️ ANOMALY: User ${userId.slice(0, 8)} ` +
          `dropped ${dropPct.toFixed(0)}% (avg: ${avg.toFixed(2)}kWh, now: ${currentKwh})`);

        broker.publish({
          topic: `arkagrid/alerts/${userId}`,
          payload: JSON.stringify({
            type: 'anomaly',
            message: `Unusual meter reading drop detected (${dropPct.toFixed(0)}%)`,
            severity: 'warning',
            tradeId,
            timestamp: new Date().toISOString()
          }),
          qos: 1,
        });
      }
    }
  } catch (err) {
    console.error('[ArkaGrid MQTT] detectAnomaly error:', err.message);
  }
}
