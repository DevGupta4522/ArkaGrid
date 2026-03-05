/**
 * ArkaGrid Meter Simulator
 * Simulates IoT smart meters publishing readings every 5 minutes.
 * In production, real meters replace this file — nothing else changes.
 */
import mqtt from 'mqtt';
import pool from '../db/connection.js';

const PUBLISH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let mqttClient = null;

export function startMeterSimulator() {
  const MQTT_PORT = process.env.MQTT_TCP_PORT || '1883';

  mqttClient = mqtt.connect(`mqtt://localhost:${MQTT_PORT}`, {
    username: process.env.MQTT_USERNAME || 'arkagrid-meter',
    password: process.env.MQTT_PASSWORD || 'change-in-production-2025',
    clientId: 'arkagrid-simulator-v2',
    reconnectPeriod: 5000,
  });

  mqttClient.on('connect', () => {
    console.log('✅ [ArkaGrid Simulator] Connected to MQTT broker');
    // Run first simulation immediately
    setTimeout(() => runSimulation(), 2000);
  });

  mqttClient.on('error', (err) => {
    console.error('[ArkaGrid Simulator] MQTT error:', err.message);
  });

  mqttClient.on('reconnect', () => {
    console.log('[ArkaGrid Simulator] Reconnecting to MQTT broker...');
  });

  // Schedule recurring simulation
  setInterval(() => runSimulation(), PUBLISH_INTERVAL);
}

async function runSimulation() {
  if (!mqttClient || !mqttClient.connected) {
    console.warn('[ArkaGrid Simulator] Not connected, skipping cycle');
    return;
  }

  try {
    // ── 1. Active Trades — simulate energy delivery ──
    const { rows: trades } = await pool.query(`
      SELECT t.*,
        t.prosumer_id,
        t.consumer_id
      FROM trades t
      WHERE t.trade_status = 'delivering'
      AND t.delivery_deadline > NOW()
    `);

    for (const trade of trades) {
      // Outgoing meter — 98-100% of requested
      const outKwh = parseFloat(
        (parseFloat(trade.units_requested) * (0.98 + Math.random() * 0.02)).toFixed(3)
      );

      mqttClient.publish(
        `arkagrid/meters/${trade.prosumer_id}/outgoing`,
        JSON.stringify({
          meterId: `MTR-${trade.prosumer_id.slice(0, 8)}-OUT`,
          userId: trade.prosumer_id,
          tradeId: trade.id,
          kwhValue: outKwh,
          timestamp: new Date().toISOString(),
          source: 'simulated',
          voltage: parseFloat((228 + Math.random() * 4).toFixed(1)),
          current: parseFloat((outKwh * 1000 / 230).toFixed(2)),
          powerFactor: 0.95,
        }),
        { qos: 1 }
      );

      // 2 second delay — simulate meter reporting lag
      await sleep(2000);

      // Incoming meter — 97-99% of outgoing (line loss)
      const inKwh = parseFloat(
        (outKwh * (0.97 + Math.random() * 0.02)).toFixed(3)
      );

      mqttClient.publish(
        `arkagrid/meters/${trade.consumer_id}/incoming`,
        JSON.stringify({
          meterId: `MTR-${trade.consumer_id.slice(0, 8)}-IN`,
          userId: trade.consumer_id,
          tradeId: trade.id,
          kwhValue: inKwh,
          timestamp: new Date().toISOString(),
          source: 'simulated',
          voltage: parseFloat((226 + Math.random() * 4).toFixed(1)),
          current: parseFloat((inKwh * 1000 / 228).toFixed(2)),
          powerFactor: 0.94,
        }),
        { qos: 1 }
      );

      console.log(`[ArkaGrid Simulator] Trade ${trade.id.slice(0, 8)}: ` +
        `Out=${outKwh}kWh → In=${inKwh}kWh`);
    }

    // ── 2. Solar generation for all active prosumers ──
    const hour = new Date().getHours();
    const { rows: prosumers } = await pool.query(`
      SELECT DISTINCT u.id as prosumer_id
      FROM users u
      WHERE u.role = 'prosumer'
      LIMIT 20
    `);

    for (const { prosumer_id } of prosumers) {
      const peakKw = 3.5;
      const generation = (hour < 6 || hour > 19) ? 0 :
        peakKw * Math.sin(Math.PI * (hour - 6) / 13) *
        (0.85 + Math.random() * 0.15);

      mqttClient.publish(
        `arkagrid/meters/${prosumer_id}/generation`,
        JSON.stringify({
          meterId: `SOL-${prosumer_id.slice(0, 8)}-GEN`,
          userId: prosumer_id,
          tradeId: null,
          kwhValue: parseFloat(Math.max(0, generation).toFixed(3)),
          timestamp: new Date().toISOString(),
          source: 'simulated',
        }),
        { qos: 0 }
      );
    }

    if (trades.length > 0 || prosumers.length > 0) {
      console.log(`[ArkaGrid Simulator] Cycle complete: ${trades.length} trades, ${prosumers.length} prosumers`);
    }

  } catch (err) {
    console.error('[ArkaGrid Simulator] runSimulation error:', err.message);
  }
}
