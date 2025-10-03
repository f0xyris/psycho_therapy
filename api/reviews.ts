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

function verifyToken(token: string): JWTPayload | null {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

function extractTokenFromRequest(req: any): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  // Allow known origins to send credentials/headers
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method || '')) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Reviews endpoint called, method:', req.method);
    
    // Check if user is admin (optional for GET, required for other methods)
    const token = extractTokenFromRequest(req);
    let isAdmin = false;
    let userId: number | null = null;
    let isDemo = false;
    
    if (token) {
      const payload = verifyToken(token);
      isAdmin = payload?.isAdmin || false;
      userId = (payload?.userId as number) || null;
      // Demo users are allowed to create synthetic reviews without DB writes
      isDemo = (payload as any)?.isDemo === true;
    }
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found');
      return res.status(500).json({ error: 'Database configuration missing' });
    }
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const client = await pool.connect();
    
    try {
      if (req.method === 'GET') {
        // Check for specific review request (all reviews)
        const { all } = req.query;
        
        // Check if reviews table exists
        let reviewsStructure;
        try {
          reviewsStructure = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'reviews' 
            ORDER BY ordinal_position
          `);
          
          if (reviewsStructure.rows.length === 0) {
            console.log('Reviews table does not exist, returning empty array');
            return res.status(200).json([]);
          }
        } catch (error) {
          console.log('Error checking reviews table structure:', error);
          console.log('Reviews table does not exist, returning empty array');
          return res.status(200).json([]);
        }
        
        // Check what columns exist in reviews table
        const reviewsColumns = reviewsStructure.rows.map(row => row.column_name);
        
        let query = `
          SELECT 
            id, 
            rating, 
            comment`;
        
        // Add user_id if it exists, otherwise use name
        if (reviewsColumns.includes('user_id')) {
          query += `, user_id`;
        } else if (reviewsColumns.includes('name')) {
          query += `, name`;
        }
        
        // Add service_id if it exists
        if (reviewsColumns.includes('service_id')) {
          query += `, service_id`;
        }
        
        // Add status column
        if (reviewsColumns.includes('status')) {
          query += `, status`;
        }
        
        // Add created_at and updated_at if they exist
        if (reviewsColumns.includes('created_at')) {
          query += `, created_at`;
        }
        if (reviewsColumns.includes('updated_at')) {
          query += `, updated_at`;
        }
        
        query += `
          FROM reviews 
        `;
        
        // Add WHERE clause for non-admin users (only show approved reviews)
        if (!isAdmin) {
          query += ` WHERE status = 'approved'`;
        }
        
        query += ` ORDER BY id DESC`;
        
        const reviewsResult = await client.query(query);
        
        const reviews = reviewsResult.rows.map(review => ({
          id: review.id,
          userId: review.user_id || null,
          userName: review.name || null,
          serviceId: review.service_id || null,
          rating: review.rating,
          comment: review.comment,
          isApproved: review.status === 'approved' || false,
          status: review.status || null,
          createdAt: review.created_at || null,
          updatedAt: review.updated_at || null
        }));
        
        res.status(200).json(reviews);
        
      } else if (req.method === 'POST') {
        // Create new review (requires authentication)
        if (!userId && !isDemo) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        
        const { rating, comment, serviceId } = req.body;
        
        if (!rating || !comment) {
          return res.status(400).json({ error: 'Rating and comment are required' });
        }

        if (isDemo) {
          // Do not write to DB in demo mode; return synthetic review
          return res.status(201).json({
            id: Math.floor(Math.random() * 1000000) + 1000,
            userId: null,
            userName: 'Demo User',
            serviceId: serviceId || null,
            rating,
            comment,
            status: 'pending',
            isApproved: false,
            createdAt: new Date().toISOString(),
            demo: true,
          });
        }
        
        const result = await client.query(`
          INSERT INTO reviews (user_id, service_id, rating, comment, status, created_at)
          VALUES ($1, $2, $3, $4, 'pending', NOW())
          RETURNING *
        `, [userId, serviceId || null, rating, comment]);
        
        res.status(201).json(result.rows[0]);
        
      } else if (req.method === 'PUT') {
        // Update review status (admin only)
        if (!isAdmin) {
          return res.status(403).json({ error: 'Admin privileges required' });
        }
        
        const { id } = req.query;
        const { status } = req.body;
        
        if (!id || !status) {
          return res.status(400).json({ error: 'Review ID and status are required' });
        }
        // Check existing columns to avoid referencing non-existent updated_at
        const columnsRes = await client.query(`
          SELECT column_name FROM information_schema.columns WHERE table_name = 'reviews'
        `);
        const colNames = columnsRes.rows.map(r => r.column_name);
        const hasUpdatedAt = colNames.includes('updated_at');

        let updateSql = 'UPDATE reviews SET status = $1';
        if (hasUpdatedAt) {
          updateSql += ', updated_at = NOW()';
        }
        updateSql += ' WHERE id = $2 RETURNING *';

        const result = await client.query(updateSql, [status, id]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Review not found' });
        }
        
        res.status(200).json(result.rows[0]);
        
      } else if (req.method === 'DELETE') {
        // Delete review (admin only)
        if (!isAdmin) {
          return res.status(403).json({ error: 'Admin privileges required' });
        }
        
        const { id } = req.query;
        
        if (!id) {
          return res.status(400).json({ error: 'Review ID is required' });
        }
        
        const result = await client.query('DELETE FROM reviews WHERE id = $1', [id]);
        
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Review not found' });
        }
        
        res.status(204).end();
      }
      
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error) {
    console.error('❌ Reviews endpoint error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}