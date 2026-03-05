/**
 * ArkaGrid — Live Meter Data Hook
 * Subscribes to MQTT topics for real-time meter readings.
 * Uses WebSocket connection to the embedded Aedes broker.
 */
import { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';

const MQTT_URL = `ws://${window.location.hostname}:${import.meta.env.VITE_MQTT_PORT || '8883'}`;
const MQTT_USER = import.meta.env.VITE_MQTT_USERNAME || 'arkagrid-meter';
const MQTT_PASS = import.meta.env.VITE_MQTT_PASSWORD || 'change-in-production-2025';

export function useMeterData(userId, tradeId = null) {
  const [liveOutput, setLiveOutput] = useState(0);
  const [generationHistory, setGenerationHistory] = useState([]);
  const [tradeStatus, setTradeStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    let client;
    try {
      client = mqtt.connect(MQTT_URL, {
        username: MQTT_USER,
        password: MQTT_PASS,
        clientId: `arkagrid-ui-${userId.slice(0, 8)}-${Date.now()}`,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
      });
    } catch (err) {
      console.error('[ArkaGrid MQTT UI] Connection failed:', err);
      return;
    }

    clientRef.current = client;

    client.on('connect', () => {
      setIsConnected(true);
      console.log('[ArkaGrid MQTT UI] Connected');

      // Subscribe to generation data
      client.subscribe(`arkagrid/meters/${userId}/generation`, { qos: 0 });

      if (tradeId) {
        client.subscribe(`arkagrid/trades/${tradeId}/status`, { qos: 1 });
        client.subscribe(`arkagrid/alerts/${userId}`, { qos: 1 });
        client.subscribe(`arkagrid/meters/${userId}/outgoing`, { qos: 0 });
        client.subscribe(`arkagrid/meters/${userId}/incoming`, { qos: 0 });
      }
    });

    client.on('message', (topic, payload) => {
      try {
        const data = JSON.parse(payload.toString());

        if (topic.includes('/generation')) {
          setLiveOutput(data.kwhValue);
          setLastUpdated(new Date());
          setGenerationHistory(prev => [
            ...prev.slice(-47),
            {
              time: new Date(data.timestamp).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
              }),
              kWh: data.kwhValue,
              timestamp: data.timestamp,
            }
          ]);
        }

        if (topic.includes('/outgoing') || topic.includes('/incoming')) {
          setLastUpdated(new Date());
        }

        if (topic.includes('/trades/') && topic.includes('/status')) {
          setTradeStatus(data);
          setLastUpdated(new Date());
        }

        if (topic.includes('/alerts/')) {
          setAlerts(prev => [...prev.slice(-9), data]);
        }
      } catch (err) {
        console.error('[ArkaGrid MQTT UI] Parse error:', err);
      }
    });

    client.on('disconnect', () => setIsConnected(false));
    client.on('offline', () => setIsConnected(false));
    client.on('error', (err) => {
      console.error('[ArkaGrid MQTT UI] Error:', err.message);
      setIsConnected(false);
    });

    return () => {
      if (client) {
        client.unsubscribe(`arkagrid/meters/${userId}/generation`);
        if (tradeId) {
          client.unsubscribe(`arkagrid/trades/${tradeId}/status`);
          client.unsubscribe(`arkagrid/alerts/${userId}`);
          client.unsubscribe(`arkagrid/meters/${userId}/outgoing`);
          client.unsubscribe(`arkagrid/meters/${userId}/incoming`);
        }
        client.end(true);
      }
    };
  }, [userId, tradeId]);

  return {
    liveOutput,
    generationHistory,
    tradeStatus,
    alerts,
    isConnected,
    lastUpdated,
  };
}
