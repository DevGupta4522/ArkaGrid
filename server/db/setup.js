import pkg from 'pg';
import fs from 'fs';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const { Pool } = pkg;
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/arkagrid';

const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl.includes('supabase') ? { rejectUnauthorized: false } : false,
});

// Seed configuration
const NODE_COUNT = 60; // Total users
const PROSUMER_RATIO = 0.4; // 40% prosumers
const BASE_LAT = 28.6139; // Central Delhi lat
const BASE_LNG = 77.2090; // Central Delhi lng
const SPREAD = 0.15; // Geographic spread ~15km radius

async function setupDatabase() {
  try {
    console.log('📦 Starting robust database setup...');

    // Clear out old data if requested
    if (process.argv.includes('--force')) {
      console.log('🧹 Formatting database (Truncating tables)...');
      await pool.query(`
        TRUNCATE TABLE meter_readings CASCADE;
        TRUNCATE TABLE refresh_tokens CASCADE;
        TRUNCATE TABLE notifications CASCADE;
        TRUNCATE TABLE trades CASCADE;
        TRUNCATE TABLE energy_listings CASCADE;
        TRUNCATE TABLE users CASCADE;
      `);
      console.log('✅ Tables formatted.');
    } else {
      console.log('⚠️ Running in non-destructive mode (use "node setup.js --force" to wipe DB)');
    }

    // Generate standard password Hash
    const passwordHash = await bcrypt.hash('Test@123', 12);

    console.log(`🌱 Constructing ${NODE_COUNT}-node network...`);

    const insertedUsers = {
      prosumers: [],
      consumers: []
    };

    // 1. Insert Base Testing Accounts (to always be available)
    const baseUsers = [
      { name: 'Alice (Prosumer)', email: 'prosumer1@test.com', role: 'prosumer', bal: 500, lat: BASE_LAT, lng: BASE_LNG },
      { name: 'Bob (Prosumer)', email: 'prosumer2@test.com', role: 'prosumer', bal: 1000, lat: BASE_LAT + 0.01, lng: BASE_LNG - 0.01 },
      { name: 'Charlie (Consumer)', email: 'consumer1@test.com', role: 'consumer', bal: 5000, lat: BASE_LAT - 0.01, lng: BASE_LNG + 0.01 },
      { name: 'Dave (Consumer)', email: 'consumer2@test.com', role: 'consumer', bal: 3000, lat: BASE_LAT + 0.02, lng: BASE_LNG + 0.02 },
      { name: 'Admin Zero', email: 'admin@test.com', role: 'admin', bal: 0, lat: BASE_LAT, lng: BASE_LNG }
    ];

    for (const u of baseUsers) {
      const id = uuidv4();
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role, kyc_verified, wallet_balance, phone) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (email) DO NOTHING`,
        [id, u.name, u.email, passwordHash, u.role, true, u.bal, `900000000${baseUsers.indexOf(u)}`]
      );

      const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [u.email]);
      if (u.role === 'prosumer') insertedUsers.prosumers.push({ id: existing.rows[0].id, ...u });
      if (u.role === 'consumer') insertedUsers.consumers.push({ id: existing.rows[0].id, ...u });
    }

    // 2. Insert Simulated Dense Network
    for (let i = 0; i < NODE_COUNT; i++) {
      const isProsumer = Math.random() < PROSUMER_RATIO;
      const role = isProsumer ? 'prosumer' : 'consumer';
      const name = `${isProsumer ? 'Solar' : 'Grid'} Node ${i + 1}`;
      const email = `node${i}@test.com`;

      // Randomize location around center (Delhi)
      const latOffset = (Math.random() - 0.5) * SPREAD;
      const lngOffset = (Math.random() - 0.5) * SPREAD;

      const id = uuidv4();
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role, kyc_verified, wallet_balance, phone) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (email) DO NOTHING`,
        [id, name, email, passwordHash, role, true, isProsumer ? 100 : 2000, `8000000${i.toString().padStart(3, '0')}`]
      );

      const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
      const nodeData = { id: existing.rows[0].id, name, lat: BASE_LAT + latOffset, lng: BASE_LNG + lngOffset };

      if (isProsumer) insertedUsers.prosumers.push(nodeData);
      else insertedUsers.consumers.push(nodeData);
    }

    console.log(`✅ Seeded ${insertedUsers.prosumers.length} prosumers and ${insertedUsers.consumers.length} consumers`);

    // 3. Generate Active Energy Listings
    console.log('⚡ Populating Energy Marketplace...');

    const existingListings = await pool.query(`SELECT COUNT(*) FROM energy_listings`);

    if (parseInt(existingListings.rows[0].count) < 20) {
      let listingCount = 0;
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      const twoDays = new Date(); twoDays.setDate(twoDays.getDate() + 2);

      for (const prosumer of insertedUsers.prosumers) {
        // Give 70% of prosumers an active listing
        if (Math.random() < 0.7) {
          const units = Math.floor(Math.random() * 40) + 5; // 5 to 45 kWh
          const price = (Math.random() * 8 + 3).toFixed(2); // 3.00 to 11.00 Rs
          const id = uuidv4();

          await pool.query(
            `INSERT INTO energy_listings (id, prosumer_id, units_available, price_per_unit, units_remaining, available_from, available_until, latitude, longitude)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [id, prosumer.id, units, price, units, new Date(), Math.random() > 0.5 ? tomorrow : twoDays, prosumer.lat, prosumer.lng]
          );
          listingCount++;
        }
      }
      console.log(`✅ Created ${listingCount} active energy listings`);
    } else {
      console.log(`⏭️  Listings exist, skipping injection`);
    }


    // 4. Generate Active Trades (To light up the map)
    console.log('🤝 Simulating Live Grid Interactions...');

    const listings = await pool.query(`SELECT * FROM energy_listings WHERE status = 'active'`);

    if (listings.rows.length > 0) {
      let tradeCount = 0;

      // Let's create about 15 active delivering trades
      for (let i = 0; i < Math.min(15, listings.rows.length); i++) {
        const listing = listings.rows[i];
        // Pick a random consumer
        const consumer = insertedUsers.consumers[Math.floor(Math.random() * insertedUsers.consumers.length)];

        // Check if they already have an active trade to prevent duplication
        const tr = await pool.query(`SELECT id FROM trades WHERE consumer_id = $1 AND trade_status != 'completed'`, [consumer.id]);
        if (tr.rows.length > 0) continue;

        const units = Math.min(listing.units_remaining, Math.floor(Math.random() * 10) + 2);
        const amount = units * listing.price_per_unit;
        const deadline = new Date(Date.now() + 15 * 60000); // 15 mins from now
        const tradeId = uuidv4();

        await pool.query(
          `INSERT INTO trades (id, listing_id, prosumer_id, consumer_id, units_requested, price_per_unit, total_amount, platform_fee, trade_status, escrow_status, delivery_deadline)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [tradeId, listing.id, listing.prosumer_id, consumer.id, units, listing.price_per_unit, amount, amount * 0.025, 'delivering', 'locked', deadline]
        );

        // Update listing
        await pool.query(
          `UPDATE energy_listings SET units_remaining = units_remaining - $1 WHERE id = $2`,
          [units, listing.id]
        );

        tradeCount++;
      }
      console.log(`✅ Injected ${tradeCount} active flowing trades over the network`);
    }


    console.log('\n✨ Robust Database setup complete!\n');
    console.log('Login credentials for all seeded accounts are identical:');
    console.log('======================================================');
    console.log('Email Prefix : prosumer1@... consumer1@... node1@...');
    console.log('Password     : Test@123\n');

  } catch (error) {
    console.error('❌ Error setting up DB:', error.message);
  } finally {
    await pool.end();
  }
}

setupDatabase();
