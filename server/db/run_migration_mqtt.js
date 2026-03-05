/**
 * ArkaGrid — Run MQTT meter_readings migration
 * Usage: node server/db/run_migration_mqtt.js
 */
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import pkg from 'pg';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/arkagrid',
  ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  console.log('🔄 Running meter_readings migration...\n');
  
  try {
    const sql = readFileSync(join(__dirname, 'migration_mqtt.sql'), 'utf-8');
    await pool.query(sql);
    console.log('✅ meter_readings table created successfully!');
    
    // Verify
    const { rows } = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'meter_readings'
      ORDER BY ordinal_position
    `);
    
    console.log(`\n📊 meter_readings columns (${rows.length}):`);
    rows.forEach(r => console.log(`   ${r.column_name}: ${r.data_type}`));
    
    // Count indexes
    const { rows: indexes } = await pool.query(`
      SELECT indexname FROM pg_indexes WHERE tablename = 'meter_readings'
    `);
    console.log(`\n🔍 Indexes: ${indexes.length}`);
    indexes.forEach(i => console.log(`   ${i.indexname}`));
    
    console.log('\n✅ MQTT migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
