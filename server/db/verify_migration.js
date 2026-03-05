import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function fix() {
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });

    try {
        // Add the blockchain column that may have been skipped
        try {
            await pool.query("ALTER TABLE trades ADD COLUMN IF NOT EXISTS blockchain VARCHAR(20) DEFAULT 'solana'");
            console.log('✅ trades.blockchain column added');
        } catch (e) {
            console.log('ℹ️  trades.blockchain:', e.message);
        }

        // Verify all columns
        const r1 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='trades' 
      AND column_name IN ('blockchain','blockchain_status','blockchain_tx_hash','delivery_tx_hash','prosumer_wallet','consumer_wallet')
      ORDER BY column_name
    `);
        console.log('\n📋 trades table blockchain columns:');
        r1.rows.forEach(x => console.log(`   ✅ ${x.column_name} (${x.data_type})`));

        const r2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='users' 
      AND column_name IN ('wallet_address','wallet_type')
      ORDER BY column_name
    `);
        console.log('\n📋 users table wallet columns:');
        r2.rows.forEach(x => console.log(`   ✅ ${x.column_name} (${x.data_type})`));

        console.log(`\n✅ Total: ${r1.rows.length + r2.rows.length} blockchain columns verified`);
    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await pool.end();
    }
}

fix();
