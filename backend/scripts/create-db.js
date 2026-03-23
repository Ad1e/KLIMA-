import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const baseUrl = process.env.DATABASE_URL;

if (!baseUrl) {
  console.error('DATABASE_URL is required in backend/.env');
  process.exit(1);
}

const adminUrl = baseUrl.replace(/\/[^/?]+(\?.*)?$/, '/postgres$1');
const targetDbName = baseUrl.split('/').pop()?.split('?')[0] || 'klima';

const pool = new Pool({ connectionString: adminUrl });

async function createDb() {
  try {
    await pool.query(`CREATE DATABASE "${targetDbName}"`);
    console.log(`Database "${targetDbName}" created successfully.`);
  } catch (error) {
    if (error?.code === '42P04') {
      console.log(`Database "${targetDbName}" already exists.`);
    } else {
      console.error('Failed to create database:', error.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

void createDb();
