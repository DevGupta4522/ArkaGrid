import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runMigration() {
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });

    try {
        console.log('🔗 Connecting to database...');
        const client = await pool.connect();

        const sqlPath = path.join(__dirname, 'migration_solana.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        console.log('🚀 Running Solana migration...\n');

        // Split by semicolons and run each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const stmt of statements) {
            try {
                await client.query(stmt);
                // Extract a short description from the statement
                const desc = stmt.split('\n').find(l => !l.startsWith('--') && l.trim().length > 0) || stmt.slice(0, 60);
                console.log(`  ✅ ${desc.trim().slice(0, 70)}`);
            } catch (err) {
                if (err.code === '42701') {
                    // Column already exists — safe to skip
                    console.log(`  ⏭️  Column already exists — skipped`);
                } else {
                    console.error(`  ❌ Error: ${err.message}`);
                }
            }
        }

        client.release();
        console.log('\n✅ Solana migration completed successfully!');

        // Verify columns exist
        const verifyClient = await pool.connect();
        const tradesCols = await verifyClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'trades' 
      AND column_name IN ('blockchain', 'delivery_tx_hash', 'blockchain_status', 'prosumer_wallet', 'consumer_wallet')
      ORDER BY column_name
    `);
        const usersCols = await verifyClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('wallet_address', 'wallet_type')
      ORDER BY column_name
    `);
        verifyClient.release();

        console.log('\n📋 Verification — trades table:');
        tradesCols.rows.forEach(r => console.log(`   ${r.column_name} (${r.data_type})`));

        console.log('\n📋 Verification — users table:');
        usersCols.rows.forEach(r => console.log(`   ${r.column_name} (${r.data_type})`));

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
