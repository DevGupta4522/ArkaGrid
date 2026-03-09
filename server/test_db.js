import { Client } from 'pg';
import "dotenv/config";

const connectionString = "postgresql://postgres.rstnyhelzuemvvsdgoza:DevGupta%401234@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";
// or process.env.DATABASE_URL

const client = new Client({
  connectionString: connectionString
});

async function testConnection() {
  console.log('Attempting to connect with port 5432 (Session pooler) ...');
  try {
    await client.connect();
    console.log('Connected successfully using 5432!');
    const res = await client.query('SELECT NOW()');
    console.log(res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error with port 5432:', err.message);

    console.log('\nTrying port 6543 (Transaction pooler) instead...');
    const client2 = new Client({
      connectionString: connectionString.replace(':5432/', ':6543/')
    });
    try {
        await client2.connect();
        console.log('Connected successfully using 6543!');
        await client2.end();
    } catch(err2) {
        console.error('Connection error with port 6543:', err2.message);
    }
    
  }
}

testConnection();
