import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

type JWTPayload = { userId: number; email: string; isAdmin: boolean; isDemo?: boolean };

function extractToken(req: VercelRequest): string | null {
  const auth = req.headers['authorization'];
  if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

function verifyToken(token: string | null): JWTPayload | null {
  if (!token) return null;
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS (mirror other API handlers)
  const allowedOrigins = [
    'https://laser-touch.vercel.app',
    'https://laser-touch-git-main-yaroslav-kravets-projects.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  const origin = req.headers.origin as string | undefined;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!['GET', 'POST'].includes(req.method || '')) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'Database configuration missing' });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    if (req.method === 'GET') {
      const dateParam = req.query.date as string | string[] | undefined;
      const date = Array.isArray(dateParam) ? dateParam[0] : dateParam;
      if (!date) return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });

      // Try to select from working_hours table defensively
      try {
        const structure = await client.query(`
          SELECT column_name FROM information_schema.columns WHERE table_name = 'working_hours'
        `);
        if (structure.rows.length === 0) {
          return res.status(200).json({});
        }
      } catch {
        return res.status(200).json({});
      }

      const result = await client.query(
        `SELECT id, date, start_time AS "startTime", end_time AS "endTime" FROM working_hours WHERE date = $1 LIMIT 1`,
        [date]
      );
      const row = result.rows[0] || null;
      return res.status(200).json(row || {});
    }

    if (req.method === 'POST') {
      const payload = verifyToken(extractToken(req));
      if (!payload || !payload.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { date, startTime, endTime } = (typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : req.body) || {};
      if (!date || !startTime || !endTime) {
        return res.status(400).json({ error: 'date, startTime and endTime are required' });
      }
      const hhmm = /^\d{2}:\d{2}$/;
      if (!hhmm.test(String(startTime)) || !hhmm.test(String(endTime))) {
        return res.status(400).json({ error: 'Invalid time format, expected HH:mm' });
      }

      // Ensure table exists and columns are detectable
      const colsRes = await client.query(`
        SELECT column_name FROM information_schema.columns WHERE table_name = 'working_hours'
      `);
      const hasUpdatedAt = colsRes.rows.some((r: any) => r.column_name === 'updated_at');

      // Upsert logic: try update, if no row affected then insert
      const upd = await client.query(
        `UPDATE working_hours SET start_time = $2, end_time = $3${hasUpdatedAt ? ', updated_at = NOW()' : ''} WHERE date = $1 RETURNING id, date, start_time AS "startTime", end_time AS "endTime"`,
        [date, startTime, endTime]
      );
      if (upd.rowCount > 0) {
        return res.status(200).json(upd.rows[0]);
      }
      const ins = await client.query(
        `INSERT INTO working_hours (date, start_time, end_time${hasUpdatedAt ? ', updated_at' : ''}) VALUES ($1, $2, $3${hasUpdatedAt ? ', NOW()' : ''}) RETURNING id, date, start_time AS "startTime", end_time AS "endTime"`,
        [date, startTime, endTime]
      );
      return res.status(200).json(ins.rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('❌ Working hours error:', error);
    return res.status(500).json({ error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
  } finally {
    client.release();
    await pool.end();
  }
}


