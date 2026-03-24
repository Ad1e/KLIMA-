import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';

const router = Router();

router.post('/register', async (req, res) => {
  const fullName = String(req.body?.full_name ?? req.body?.fullName ?? '').trim();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (!fullName || !email || !password) {
    return res.status(400).json({
      ok: false,
      message: 'full_name, email, and password are required.',
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role`,
      [fullName, email, passwordHash, 'member'],
    );

    return res.status(201).json({
      ok: true,
      message: 'Registration successful.',
      user: result.rows[0],
    });
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({
        ok: false,
        message: 'Email already registered.',
      });
    }

    if (error?.code === '42P01') {
      return res.status(500).json({
        ok: false,
        message: 'Users table is missing. Run: npm run init-db',
      });
    }

    if (error?.code === '28P01' || error?.code === 'ECONNREFUSED') {
      return res.status(500).json({
        ok: false,
        message: 'Database connection failed. Check backend/.env DATABASE_URL.',
      });
    }

    return res.status(500).json({
      ok: false,
      message: 'Registration failed.',
    });
  }
});

router.post('/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      message: 'email and password are required.',
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, full_name, email, password_hash, role
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        ok: false,
        message: 'Invalid email or password.',
      });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        ok: false,
        message: 'Invalid email or password.',
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error?.code === '42P01') {
      return res.status(500).json({
        ok: false,
        message: 'Users table is missing. Run: npm run init-db',
      });
    }

    if (error?.code === '28P01' || error?.code === 'ECONNREFUSED') {
      return res.status(500).json({
        ok: false,
        message: 'Database connection failed. Check backend/.env DATABASE_URL.',
      });
    }

    return res.status(500).json({
      ok: false,
      message: 'Login failed.',
    });
  }
});

export default router;
