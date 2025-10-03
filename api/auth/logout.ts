import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://laser-touch.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Clear the token cookie
    res.setHeader('Set-Cookie', 'token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');
    res.status(200).json({ message: 'Logged out successfully' });
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 