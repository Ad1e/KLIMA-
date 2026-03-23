import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pool from '../src/db.js';

dotenv.config();

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@klima.local';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';

const createSchemaSql = `CREATE SCHEMA IF NOT EXISTS klima;`;

const createAdvisoriesSql = `
CREATE TABLE IF NOT EXISTS klima.advisories (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  storm_name TEXT NOT NULL,
  advisory_time TIMESTAMPTZ,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const createUsersSql = `
CREATE TABLE IF NOT EXISTS klima.users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const createIndexesSql = `
CREATE INDEX IF NOT EXISTS advisories_source_idx ON klima.advisories (source);
CREATE INDEX IF NOT EXISTS advisories_storm_name_idx ON klima.advisories (storm_name);
CREATE INDEX IF NOT EXISTS advisories_created_at_idx ON klima.advisories (created_at DESC);
`;

async function main() {
  try {
    await pool.query(createSchemaSql);
    await pool.query(createAdvisoriesSql);
    await pool.query(createUsersSql);
    await pool.query(createIndexesSql);

    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
    await pool.query(
      `
      INSERT INTO klima.users (email, password_hash, full_name, role, is_active)
      VALUES ($1, $2, 'System Administrator', 'admin', TRUE)
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        is_active = TRUE,
        updated_at = NOW();
      `,
      [DEFAULT_ADMIN_EMAIL.toLowerCase(), passwordHash],
    );

    console.log('Database objects created successfully in schema "klima".');
    console.log(`Default admin seeded: ${DEFAULT_ADMIN_EMAIL}`);
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
