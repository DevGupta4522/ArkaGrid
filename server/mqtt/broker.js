/**
 * ArkaGrid MQTT Broker - Embedded Aedes broker
 * Self-contained - no external broker needed.
 *
 * Topics:
 *   arkagrid/meters/{userId}/outgoing    - prosumer sending kWh
 *   arkagrid/meters/{userId}/incoming    - consumer receiving kWh
 *   arkagrid/meters/{userId}/generation  - solar panel output
 *   arkagrid/trades/{tradeId}/status     - trade state updates
 *   arkagrid/alerts/{userId}             - anomaly alerts
 */
import { Aedes } from 'aedes';
import { createServer } from 'net';
import { WebSocketServer } from 'ws';
import http from 'http';

let brokerInstance = null;
let connectedClients = 0;

const aedes = new Aedes();

aedes.authenticate = (client, username, password, callback) => {
  const validUser = process.env.MQTT_USERNAME || 'arkagrid-meter';
  const validPass = process.env.MQTT_PASSWORD || 'change-in-production-2025';
  const valid = username === validUser && password?.toString() === validPass;

  if (!valid) {
    console.warn(`[ArkaGrid MQTT] Rejected client: ${client?.id || 'unknown'}`);
  }

  callback(null, valid);
};

aedes.on('client', (client) => {
  connectedClients++;
  console.log(`[ArkaGrid MQTT] Meter connected: ${client.id} (${connectedClients} total)`);
});

aedes.on('clientDisconnect', (client) => {
  connectedClients = Math.max(0, connectedClients - 1);
  console.log(`[ArkaGrid MQTT] Meter disconnected: ${client.id} (${connectedClients} remaining)`);
});

aedes.on('publish', (packet, client) => {
  if (client && packet.topic.startsWith('arkagrid/') && !packet.topic.startsWith('$')) {
    console.log(`[ArkaGrid MQTT] ${packet.topic} | ${packet.payload?.length || 0}b`);
  }
});

aedes.on('subscribe', (subscriptions, client) => {
  if (client) {
    const topics = subscriptions.map((subscription) => subscription.topic).join(', ');
    console.log(`[ArkaGrid MQTT] ${client.id} subscribed: ${topics}`);
  }
});

export function startMQTTBroker() {
  const mqttPort = parseInt(process.env.MQTT_TCP_PORT || '1883', 10);
  const wsPort = parseInt(process.env.MQTT_WS_PORT || '8883', 10);

  const tcpServer = createServer(aedes.handle);
  const httpServer = http.createServer();
  const wsServer = new WebSocketServer({ server: httpServer });

  wsServer.on('connection', (ws) => {
    aedes.handle(ws);
  });

  return new Promise((resolve, reject) => {
    let pending = 2;
    let settled = false;

    const finish = () => {
      pending -= 1;
      if (pending === 0 && !settled) {
        brokerInstance = aedes;
        resolve(aedes);
      }
    };

    const fail = (err) => {
      if (settled) return;
      settled = true;
      try { tcpServer.close(); } catch {}
      try { wsServer.close(); } catch {}
      try { httpServer.close(); } catch {}
      reject(err);
    };

    tcpServer.once('error', fail);
    httpServer.once('error', fail);

    tcpServer.listen(mqttPort, () => {
      console.log(`[ArkaGrid MQTT] TCP broker on port ${mqttPort}`);
      finish();
    });

    httpServer.listen(wsPort, () => {
      console.log(`[ArkaGrid MQTT] WebSocket broker on port ${wsPort}`);
      finish();
    });
  });
}

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
