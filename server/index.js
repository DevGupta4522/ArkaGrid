import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from server dir first, then project root as fallback
dotenv.config({ path: join(__dirname, '.env') });
dotenv.config({ path: join(__dirname, '..', '.env') });

import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import listingsRoutes from './routes/listings.js';
import tradesRoutes from './routes/trades.js';
import walletRoutes from './routes/wallet.js';
import adminRoutes from './routes/admin.js';
import notificationsRoutes from './routes/notifications.js';
import metersRoutes from './routes/meters.js';
import { startEscrowTimeoutJob } from './jobs/escrowTimeout.js';
import { securityHeaders, apiLimiter } from './middleware/security.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(securityHeaders);

// CORS Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// API Routes (Rate Limited)
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/trades', tradesRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/meters', metersRoutes);

// Health check — all services
app.get('/api/health', async (req, res) => {
  // Solana status
  let solanaStatus = { enabled: false, status: 'not_imported' };
  try {
    const { getSolanaStatus } = await import('./services/solana.js');
    solanaStatus = await getSolanaStatus();
  } catch (err) {
    solanaStatus = { enabled: false, status: 'import_failed', error: err.message };
  }

  // MQTT status 
  let mqttStatus = { status: 'not_imported', connectedMeters: 0 };
  try {
    const { getMQTTStatus } = await import('./mqtt/broker.js');
    mqttStatus = getMQTTStatus();
  } catch (err) {
    mqttStatus = { status: 'import_failed', error: err.message };
  }

  // Database status
  let dbStatus = 'connected';
  try {
    const pool = (await import('./db/connection.js')).default;
    await pool.query('SELECT 1');
  } catch {
    dbStatus = 'error';
  }

  res.json({
    success: true,
    status: 'operational',
    version: '2.0.0',
    app: 'ArkaGrid',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      solana: solanaStatus,
      mqtt: mqttStatus,
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Error handler
app.use(errorHandler);

// ── Start server ────────────────────────────────────
app.listen(PORT, async () => {
  const network = process.env.SOLANA_NETWORK || 'devnet';
  const programId = process.env.SOLANA_PROGRAM_ID || 'not set';

  // 1. Start MQTT broker
  let mqttRunning = false;
  try {
    const { startMQTTBroker } = await import('./mqtt/broker.js');
    startMQTTBroker();
    mqttRunning = true;
  } catch (err) {
    console.warn(`[ArkaGrid MQTT] Broker failed to start: ${err.message}`);
  }

  // 2. Start meter handlers
  if (mqttRunning) {
    try {
      const { startMeterHandler } = await import('./mqtt/meterHandler.js');
      startMeterHandler();
    } catch (err) {
      console.warn(`[ArkaGrid MQTT] Handlers failed: ${err.message}`);
    }
  }

  // 3. Start meter simulator
  if (mqttRunning) {
    try {
      const { startMeterSimulator } = await import('./mqtt/meterSimulator.js');
      startMeterSimulator();
    } catch (err) {
      console.warn(`[ArkaGrid Simulator] Failed: ${err.message}`);
    }
  }

  // 4. Start escrow timeout job  
  startEscrowTimeoutJob();

  // 5. Print startup banner
  console.log(`
╔══════════════════════════════════════════════╗
║            ArkaGrid Server v2.0              ║
║        P2P Energy Trading Platform           ║
╠══════════════════════════════════════════════╣
║  API:        http://localhost:${PORT}             ║
║  MQTT TCP:   mqtt://localhost:1883           ║
║  MQTT WS:    ws://localhost:8883             ║
║  Blockchain: Solana ${network.padEnd(25)}║
║  Program:    ${(programId?.slice(0, 16) + '...').padEnd(27)}║
║  Simulator:  ${mqttRunning ? 'Active (5min intervals)    ' : 'Disabled                   '}║
╚══════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
