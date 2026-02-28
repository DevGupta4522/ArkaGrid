import pkg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from server dir first, then project root as fallback
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const { Pool } = pkg;

const pool = new Pool({
    connectionString:
        process.env.DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:5432/arkagrid',
});

async function resetDatabase() {
    try {
        console.log('🗑️  Dropping all tables...');

        await pool.query(`
      DROP TABLE IF EXISTS ratings CASCADE;
      DROP TABLE IF EXISTS meter_readings CASCADE;
      DROP TABLE IF EXISTS refresh_tokens CASCADE;
      DROP TABLE IF EXISTS trades CASCADE;
      DROP TABLE IF EXISTS energy_listings CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

        console.log('✅ All tables dropped');
        console.log('');
        console.log('Now run the setup script to recreate:');
        console.log('  npm run db:setup');
    } catch (error) {
        console.error('❌ Error resetting database:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

resetDatabase();
