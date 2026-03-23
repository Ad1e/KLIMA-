/**
 * Quick script to verify your DATABASE_URL works.
 * Run: node server/test-db-connection.js
 */
import 'dotenv/config';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('No DATABASE_URL found. Copy .env.example to .env and set DATABASE_URL.');
  process.exit(1);
}

// Hide password in output
const safeUrl = url.replace(/:([^:@]+)@/, ':****@');
console.log('Testing:', safeUrl);
console.log('');

const pool = new pg.Pool({ connectionString: url });

pool
  .query('SELECT 1 as ok, current_database() as db')
  .then((res) => {
    console.log('✓ Connection OK');
    console.log('  Database:', res.rows[0].db);
    process.exit(0);
  })
  .catch((err) => {
    console.error('✗ Connection failed:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('  → PostgreSQL is not running or wrong host/port');
    } else if (err.message.includes('password') || err.code === '28P01') {
      console.error('  → Wrong username or password');
    } else if (err.message.includes('database') || err.code === '3D000') {
      console.error('  → Database does not exist. Run: npm run create-db');
    }
    process.exit(1);
  })
  .finally(() => pool.end());
