CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (full_name, email, password_hash, role)
VALUES (
  'System Admin',
  'admin@klima.local',
  crypt('AdminPass123!', gen_salt('bf', 10)),
  'admin'
)
ON CONFLICT (email) DO NOTHING;