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
}

function generateToken(payload: JWTPayload): string {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function getBaseUrl(req: VercelRequest): string {
  const envBase = process.env.PUBLIC_BASE_URL;
  if (envBase && /^https?:\/\//i.test(envBase)) return envBase.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
  return `${proto}://${host}`.replace(/\/$/, '');
}

function getRedirectUri(req: VercelRequest): string {
  return `${getBaseUrl(req)}/api/auth/google`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = getBaseUrl(req);
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if this is a callback request (has 'code' or 'error' parameter)
    const { code, error } = req.query;
    
    if (code || error) {
      // Handle OAuth callback
      return await handleCallback(req, res);
    } else {
      // Handle OAuth initiation
      return await handleOAuthInit(req, res);
    }
  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    res.status(500).json({ error: 'Google OAuth failed' });
  }
}

async function handleOAuthInit(req: VercelRequest, res: VercelResponse) {
  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('❌ Google OAuth not configured');
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }
  
  // Use the same URL for both initiation and callback
  const redirectUri = getRedirectUri(req);
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=openid%20email%20profile&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  res.redirect(googleAuthUrl);
}

async function handleCallback(req: VercelRequest, res: VercelResponse) {
  // Check environment variables
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('❌ Google OAuth not configured');
    return res.redirect('/login?error=oauth_not_configured');
  }
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not configured');
    return res.redirect('/login?error=database_not_configured');
  }
  
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET not configured');
    return res.redirect('/login?error=jwt_not_configured');
  }
  
  const { code, error } = req.query;
  
  if (error) {
    console.error('❌ Google OAuth error:', error);
    return res.redirect('/login?error=oauth_failed');
  }
  
  if (!code) {
    console.error('❌ No authorization code received');
    return res.redirect('/login?error=no_code');
  }
  
  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code: code as string,
      grant_type: 'authorization_code',
      redirect_uri: getRedirectUri(req),
    }),
  });
  
  const tokenData = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    console.error('❌ Token exchange failed:', tokenData);
    return res.redirect('/login?error=token_exchange_failed');
  }
  
  // Get user info from Google
  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });
  
  const userInfo = await userInfoResponse.json();
  
  if (!userInfoResponse.ok) {
    console.error('❌ Failed to get user info:', userInfo);
    return res.redirect('/login?error=user_info_failed');
  }
  
  // Connect to database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  const client = await pool.connect();
  
  try {
    // Check if user exists
    let userResult = await client.query(
      'SELECT id, email, first_name, last_name, google_id, is_admin FROM users WHERE email = $1',
      [userInfo.email]
    );
    
    let user;
    
    if (userResult.rows.length === 0) {
      // Create new user
      const newUserResult = await client.query(
        `INSERT INTO users (email, first_name, last_name, google_id, is_admin, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
         RETURNING id, email, first_name, last_name, google_id, is_admin`,
        [
          userInfo.email,
          userInfo.given_name || null,
          userInfo.family_name || null,
          userInfo.id,
          userInfo.email === 'antip4uck.ia@gmail.com' // Make this email admin
        ]
      );
      user = newUserResult.rows[0];
    } else {
      // Update existing user with Google ID if needed
      user = userResult.rows[0];
      if (!user.google_id) {
        await client.query(
          'UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2',
          [userInfo.id, user.id]
        );
      }
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isAdmin: user.is_admin
    });
    
    // Redirect to home page with token in URL
    res.redirect(`/?token=${encodeURIComponent(token)}`);
    
  } finally {
    client.release();
    await pool.end();
  }
} 