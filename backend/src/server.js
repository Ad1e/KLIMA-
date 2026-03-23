import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import pool from './db.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json({ ok: true, db: 'connected', now: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ ok: false, db: 'disconnected', error: String(error?.message || error) });
  }
});

app.post('/auth/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (!email || !password) {
    res.status(400).json({ ok: false, message: 'Email and password are required.' });
    return;
  }

  try {
    const result = await pool.query(
      `
      SELECT id, email, password_hash, full_name, role, is_active
      FROM klima.users
      WHERE email = $1
      LIMIT 1;
      `,
      [email],
    );

    if (result.rowCount === 0) {
      res.status(401).json({ ok: false, message: 'Invalid email or password.' });
      return;
    }

    const user = result.rows[0];
    if (!user.is_active) {
      res.status(403).json({ ok: false, message: 'User account is inactive.' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ ok: false, message: 'Invalid email or password.' });
      return;
    }

    res.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Login failed.', error: String(error?.message || error) });
  }
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
