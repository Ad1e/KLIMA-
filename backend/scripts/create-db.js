import dotenv from 'dotenv';
import pool from '../src/db.js';

dotenv.config();

const sql = `
CREATE SCHEMA IF NOT EXISTS klima;

CREATE TABLE IF NOT EXISTS klima.advisories (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  storm_name TEXT NOT NULL,
  advisory_time TIMESTAMPTZ,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS advisories_source_idx ON klima.advisories (source);
CREATE INDEX IF NOT EXISTS advisories_storm_name_idx ON klima.advisories (storm_name);
CREATE INDEX IF NOT EXISTS advisories_created_at_idx ON klima.advisories (created_at DESC);
`;

async function main() {
  try {
    await pool.query(sql);
    console.log('Database objects created successfully in schema "klima".');
  } catch (error) {
    console.error('Failed to create database objects.');
    console.error('Check backend/.env PostgreSQL settings (DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE).');

    if (error?.errors && Array.isArray(error.errors)) {
      for (const item of error.errors) {
        console.error(`- ${String(item?.message || item)}`);
      }
    } else {
      console.error(String(error?.message || error));
    }

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
