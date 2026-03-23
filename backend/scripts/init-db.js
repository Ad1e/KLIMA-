import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initDb() {
  try {
    const sql = readFileSync(join(__dirname, 'init.sql'), 'utf8');
    await pool.query(sql);
    console.log('Users table initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize users table:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void initDb();
