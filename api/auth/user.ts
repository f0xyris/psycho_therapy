import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  isDemo?: boolean;
}

function verifyToken(token: string): JWTPayload | null {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

function extractTokenFromRequest(req: any): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookies
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenMatch = cookies.match(/token=([^;]+)/);
    if (tokenMatch) {
      return tokenMatch[1];
    }
  }
  
  // Check query parameters
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }
  
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://laser-touch.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract token from request (same as local)
    const token = extractTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Verify token (same as local)
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // If this is a demo token, return a synthetic admin user without DB lookup and mask sensitive fields
    if (payload.isDemo) {
      return res.status(200).json({
        id: 0,
        email: 'de***@lasertouch.example',
        firstName: 'De***',
        lastName: 'Ad***',
        profileImageUrl: null,
        googleId: null,
        phone: null,
        isAdmin: true,
        isDemo: true
      });
    }

    // Get fresh user data from database (same as local)
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    
    try {
      const userResult = await client.query(
        'SELECT id, email, first_name, last_name, profile_image_url, google_id, phone, is_admin FROM users WHERE id = $1',
        [payload.userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ message: 'User not found' });
      }

      const user = userResult.rows[0];
      
      const responseData = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profileImageUrl: user.profile_image_url,
        googleId: user.google_id,
        phone: user.phone,
        isAdmin: user.is_admin
      };
      
      res.status(200).json(responseData);

    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('❌ User info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 