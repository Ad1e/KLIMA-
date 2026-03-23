import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

// Connect to default 'postgres' database to create our DB
const baseUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/postgres';
const url = baseUrl.replace(/\/[^/]+$/, '/postgres');

const pool = new Pool({ connectionString: url });

async function createDb() {
  try {
    await pool.query('CREATE DATABASE klima');
    console.log('Database "klima" created successfully.');
  } catch (err) {
    if (err.code === '42P04') {
      console.log('Database "klima" already exists.');
    } else {
      console.error('Failed to create database:', err.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

createDb();
