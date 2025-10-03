import type { VercelRequest, VercelResponse } from '@vercel/node';
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
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenMatch = cookies.match(/token=([^;]+)/);
    if (tokenMatch) {
      return tokenMatch[1];
    }
  }
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract token from request
    const token = extractTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Check if user is admin
    if (!payload.isAdmin) {
      return res.status(403).json({ message: "Admin privileges required" });
    }

    // Return admin check result
    res.status(200).json({ 
      isAdmin: true,
      userId: payload.userId,
      isDemo: payload.isDemo || false
    });
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(401).json({ message: "Authentication failed" });
  }
}