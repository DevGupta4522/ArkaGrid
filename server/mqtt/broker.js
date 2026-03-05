/**
 * ArkaGrid MQTT Broker — Embedded Aedes broker
 * Self-contained — no external broker needed.
 * 
 * Topics:
 *   arkagrid/meters/{userId}/outgoing    – prosumer sending kWh
 *   arkagrid/meters/{userId}/incoming    – consumer receiving kWh
 *   arkagrid/meters/{userId}/generation  – solar panel output
 *   arkagrid/trades/{tradeId}/status     – trade state updates
 *   arkagrid/alerts/{userId}             – anomaly alerts
 */
import { Aedes } from 'aedes';
import { createServer } from 'net';
import { WebSocketServer } from 'ws';
import http from 'http';

let brokerInstance = null;
let connectedClients = 0;

const aedes = new Aedes();

// ── Authentication — only ArkaGrid devices ──────────
aedes.authenticate = (client, username, password, callback) => {
  const validUser = process.env.MQTT_USERNAME || 'arkagrid-meter';
  const validPass = process.env.MQTT_PASSWORD || 'change-in-production-2025';

  const valid =
    username === validUser &&
    password?.toString() === validPass;

  if (!valid) {
    console.warn(`[ArkaGrid MQTT] ❌ Rejected client: ${client?.id || 'unknown'}`);
  }
  callback(null, valid);
};

// ── Connection events ───────────────────────────────
aedes.on('client', (client) => {
  connectedClients++;
  console.log(`[ArkaGrid MQTT] ✅ Meter connected: ${client.id} (${connectedClients} total)`);
});

aedes.on('clientDisconnect', (client) => {
  connectedClients = Math.max(0, connectedClients - 1);
  console.log(`[ArkaGrid MQTT] Meter disconnected: ${client.id} (${connectedClients} remaining)`);
});

aedes.on('publish', (packet, client) => {
  if (client && packet.topic.startsWith('arkagrid/')) {
    // Only log non-system messages
    if (!packet.topic.startsWith('$')) {
      console.log(`[ArkaGrid MQTT] 📡 ${packet.topic} | ${packet.payload?.length || 0}b`);
    }
  }
});

aedes.on('subscribe', (subscriptions, client) => {
  if (client) {
    const topics = subscriptions.map(s => s.topic).join(', ');
    console.log(`[ArkaGrid MQTT] 📥 ${client.id} subscribed: ${topics}`);
  }
});

// ── Start broker ────────────────────────────────────
export function startMQTTBroker() {
  const MQTT_PORT = parseInt(process.env.MQTT_TCP_PORT || '1883');
  const WS_PORT = parseInt(process.env.MQTT_WS_PORT || '8883');

  // TCP server for MQTT protocol (used by simulator + backend)
  const tcpServer = createServer(aedes.handle);
  tcpServer.listen(MQTT_PORT, () => {
    console.log(`✅ [ArkaGrid MQTT] TCP broker on port ${MQTT_PORT}`);
  });

  // WebSocket server for browser clients
  const httpServer = http.createServer();
  const wsServer = new WebSocketServer({ server: httpServer });
  wsServer.on('connection', (ws) => {
    const stream = aedes.handle(ws);
  });
  httpServer.listen(WS_PORT, () => {
    console.log(`✅ [ArkaGrid MQTT] WebSocket broker on port ${WS_PORT}`);
  });

  brokerInstance = aedes;
  return aedes;
}

// ── Getters ─────────────────────────────────────────
export function getMQTTStatus() {
  return {
    status: brokerInstance ? 'running' : 'stopped',
    connectedMeters: connectedClients,
  };
}

export function getBroker() {
  return aedes;
}

export { aedes as broker };
