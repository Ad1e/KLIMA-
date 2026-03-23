import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
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

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
