import dotenv from 'dotenv';
import pg from 'pg';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL in backend/.env');
  process.exit(1)
}

const { Pool } = pg;
const pool = new Pool({ connectionString: databaseUrl });

async function testDbConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('DB connection successful');
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void testDbConnection();
