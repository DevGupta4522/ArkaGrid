import pkg from 'pg';
import fs from 'fs';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from server dir first, then project root as fallback
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const { Pool } = pkg;

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/arkagrid';

const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl.includes('supabase') ? { rejectUnauthorized: false } : false,
});

async function setupDatabase() {
  try {
    console.log('📦 Starting database setup...');
    console.log(`🔌 Connecting to: ${dbUrl.replace(/:[^:@]+@/, ':***@')}`);

    // 1. Create schema
    console.log('📋 Creating schema...');
    const schemaSQL = fs.readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schemaSQL);
    console.log('✅ Schema created');

    // 2. Seed data
    console.log('🌱 Seeding data...');

    // Generate bcrypt hashes
    const prosumerHash = await bcrypt.hash('Test@123', 12);
    const consumerHash = await bcrypt.hash('Test@123', 12);
    const adminHash = await bcrypt.hash('Admin@123', 12);

    // Insert users — ON CONFLICT DO NOTHING so re-runs don't fail
    const prosumer1 = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, kyc_verified, wallet_balance) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email`,
      ['Prosumer One', 'prosumer1@test.com', '9876543210', prosumerHash, 'prosumer', true, 500.00]
    );

    const prosumer2 = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, kyc_verified, wallet_balance) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email`,
      ['Prosumer Two', 'prosumer2@test.com', '9876543211', prosumerHash, 'prosumer', true, 1000.00]
    );

    const consumer1 = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, wallet_balance) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email`,
      ['Consumer One', 'consumer1@test.com', '9876543212', consumerHash, 'consumer', 5000.00]
    );

    const consumer2 = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, wallet_balance) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email`,
      ['Consumer Two', 'consumer2@test.com', '9876543213', consumerHash, 'consumer', 3000.00]
    );

    const admin = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, kyc_verified) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email`,
      ['Admin User', 'admin@test.com', '9876543214', adminHash, 'admin', true]
    );

    console.log(`✅ Users seeded (skipped existing)`);

    // Get prosumer1 ID (might already exist)
    const p1Result = await pool.query(`SELECT id FROM users WHERE email = 'prosumer1@test.com'`);

    if (p1Result.rows.length > 0) {
      const p1Id = p1Result.rows[0].id;

      // Check if listings already exist
      const existingListings = await pool.query(
        'SELECT COUNT(*) FROM energy_listings WHERE prosumer_id = $1', [p1Id]
      );

      if (parseInt(existingListings.rows[0].count) === 0) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const twoDaysAway = new Date();
        twoDaysAway.setDate(twoDaysAway.getDate() + 2);

        await pool.query(
          `INSERT INTO energy_listings (prosumer_id, units_available, price_per_unit, units_remaining, available_from, available_until, latitude, longitude)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [p1Id, 10, 6.50, 10, new Date(), tomorrow, 28.7041, 77.1025]
        );

        await pool.query(
          `INSERT INTO energy_listings (prosumer_id, units_available, price_per_unit, units_remaining, available_from, available_until, latitude, longitude)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [p1Id, 5, 5.50, 5, new Date(), twoDaysAway, 28.7041, 77.1025]
        );

        await pool.query(
          `INSERT INTO energy_listings (prosumer_id, units_available, price_per_unit, units_remaining, available_from, available_until, latitude, longitude)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [p1Id, 15, 7.00, 15, new Date(), tomorrow, 28.7041, 77.1025]
        );

        console.log(`✅ Created 3 sample energy listings`);
      } else {
        console.log(`⏭️  Listings already exist, skipping`);
      }
    }

    console.log('\n✨ Database setup complete!\n');
    console.log('Test accounts:');
    console.log('  Prosumer 1: prosumer1@test.com / Test@123');
    console.log('  Prosumer 2: prosumer2@test.com / Test@123');
    console.log('  Consumer 1: consumer1@test.com / Test@123');
    console.log('  Consumer 2: consumer2@test.com / Test@123');
    console.log('  Admin:      admin@test.com / Admin@123\n');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
