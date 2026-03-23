CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Manual admin SQL example:
-- 1) Generate a bcrypt hash in Node:
--    node -e "import bcrypt from 'bcrypt'; bcrypt.hash('AdminPass123!',10).then(console.log)"
-- 2) Use that hash in this INSERT:
-- INSERT INTO users (full_name, email, password_hash, role)
-- VALUES ('System Admin', 'admin@klima.local', '$2b$10$replace_with_real_hash', 'admin');
