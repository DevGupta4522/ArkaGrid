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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
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

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 P2P Energy Trading Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Database: ${process.env.DATABASE_URL || 'postgresql://localhost:5432/p2p_energy'}\n`);

  // Start background jobs
  startEscrowTimeoutJob();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
