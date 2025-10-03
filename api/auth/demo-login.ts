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

function generateToken(payload: JWTPayload): string {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const demoUser = {
      id: 0,
      email: "demo@lasertouch.example",
      firstName: "Demo",
      lastName: "Admin",
      isAdmin: true,
    };
    
    const token = generateToken({
      userId: demoUser.id,
      email: demoUser.email,
      firstName: demoUser.firstName,
      lastName: demoUser.lastName,
      isAdmin: true,
      isDemo: true,
    });
    
    res.status(200).json({ token, user: { ...demoUser, isDemo: true } });
  } catch (e) {
    console.error("Demo login error:", e);
    res.status(500).json({ error: "Failed to create demo session" });
  }
}