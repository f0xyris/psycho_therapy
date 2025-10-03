import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  // Optional flag to indicate demo/preview mode user
  isDemo?: boolean;
}

export function generateToken(payload: JWTPayload): string {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function extractTokenFromRequest(req: any): string | null {
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