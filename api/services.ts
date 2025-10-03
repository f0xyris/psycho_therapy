import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

type JWTPayload = { userId: number; email: string; isAdmin: boolean; firstName?: string; lastName?: string; isDemo?: boolean };

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
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://laser-touch.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Services endpoint called with method:', req.method);
    const payload = verifyToken(extractToken(req));
    const isDemo = !!payload?.isDemo;
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found');
      return res.status(500).json({ error: 'Database configuration missing' });
    }
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const client = await pool.connect();
    console.log('Database connected successfully');
    
    try {
      if (req.method === 'GET') {
        console.log('Executing services query...');
        // First, let's check the table structure
        console.log('Checking services table structure...');
        const structureResult = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'services' 
          ORDER BY ordinal_position
        `);
        
        console.log('Services table columns:', structureResult.rows.map(row => `${row.column_name} (${row.data_type})`));
        
        // Based on the structure, let's build the proper query
        let query = 'SELECT ';
        const columns = structureResult.rows.map(row => row.column_name);
        
        if (columns.includes('id')) query += 'id, ';
        if (columns.includes('name')) query += 'name, ';
        if (columns.includes('description')) query += 'description, ';
        if (columns.includes('price')) query += 'price, ';
        if (columns.includes('duration')) query += 'duration, ';
        if (columns.includes('category')) query += 'category, ';
        if (columns.includes('is_active')) query += 'is_active, ';
        if (columns.includes('created_at')) query += 'created_at, ';
        if (columns.includes('updated_at')) query += 'updated_at, ';
        
        // Remove trailing comma and space
        query = query.slice(0, -2);
        query += ' FROM services';
        
        if (columns.includes('is_active')) {
          query += ' WHERE is_active = true';
        }
        
        if (columns.includes('created_at')) {
          query += ' ORDER BY created_at DESC';
        }
        
        console.log('Final services query:', query);
        
        const servicesResult = await client.query(query);
        console.log('Services query result:', servicesResult.rows.length, 'services found');
        
        const services = servicesResult.rows.map(service => ({
          id: service.id,
          name: service.name || { ua: 'Untitled Service', en: 'Untitled Service', pl: 'Untitled Service' },
          description: service.description || { ua: '', en: '', pl: '' },
          price: service.price || 0,
          duration: service.duration || 60,
          category: service.category || 'laser',
          isActive: service.is_active !== false,
          createdAt: service.created_at,
          updatedAt: service.updated_at
        }));
        
        res.status(200).json(services);
      } else if (req.method === 'POST') {
        // Create new service
        const { name, description, price, duration, category } = req.body;
        if (isDemo) {
          return res.status(201).json({
            id: Math.floor(Math.random() * 1000000) + 1000,
            name: name || { ua: '', en: '', pl: '' },
            description: description || { ua: '', en: '', pl: '' },
            price: price || 0,
            duration: duration || 60,
            isActive: true,
            category: 'custom',
            demo: true,
          });
        }

        // Detect available columns
        const structure = await client.query(`
          SELECT column_name FROM information_schema.columns WHERE table_name = 'services'
        `);
        const cols = structure.rows.map((r: any) => r.column_name);

        // Base columns always present in our schema
        const insertCols: string[] = ['name', 'description', 'price', 'duration'];
        const insertParams: any[] = [
          JSON.stringify(name || { ua: '', en: '', pl: '' }),
          JSON.stringify(description || { ua: '', en: '', pl: '' }),
          price || 0,
          duration || 60,
        ];
        let placeholders = ['$1', '$2', '$3', '$4'];

        // Optional columns
        if (cols.includes('category')) {
          insertCols.push('category');
          insertParams.push(category || 'laser');
          placeholders.push(`$${insertParams.length}`);
        }
        if (cols.includes('is_active')) {
          insertCols.push('is_active');
          insertParams.push(true);
          placeholders.push(`$${insertParams.length}`);
        }
        if (cols.includes('created_at')) {
          insertCols.push('created_at');
          placeholders.push('NOW()');
        }
        if (cols.includes('updated_at')) {
          insertCols.push('updated_at');
          placeholders.push('NOW()');
        }

        const insertSql = `INSERT INTO services (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`;
        const result = await client.query(insertSql, insertParams);
        const newId = result.rows[0].id;
        // Read back full row and normalize like GET
        const createdRes = await client.query('SELECT * FROM services WHERE id = $1', [newId]);
        const service = createdRes.rows[0] || { id: newId };
        const normalized = {
          id: service.id,
          name: service.name || { ua: '', en: '', pl: '' },
          description: service.description || { ua: '', en: '', pl: '' },
          price: service.price || 0,
          duration: service.duration || 60,
          category: service.category || 'laser',
          isActive: service.is_active !== false,
          createdAt: service.created_at,
          updatedAt: service.updated_at,
        };
        res.status(201).json(normalized);
      } else if (req.method === 'PUT') {
        // Update service
        const { id, name, description, price, duration, category } = req.body;
        if (isDemo) {
          return res.status(200).json({ success: true, demo: true });
        }
        // Detect available columns
        const structure = await client.query(`
          SELECT column_name FROM information_schema.columns WHERE table_name = 'services'
        `);
        const cols = structure.rows.map((r: any) => r.column_name);

        let updateSql = `UPDATE services SET name = $1, description = $2, price = $3, duration = $4`;
        const params: any[] = [
          JSON.stringify(name || { ua: '', en: '', pl: '' }),
          JSON.stringify(description || { ua: '', en: '', pl: '' }),
          price || 0,
          duration || 60,
        ];
        if (cols.includes('category') && category !== undefined) {
          updateSql += `, category = $${params.length + 1}`;
          params.push(category || 'laser');
        }
        if (cols.includes('updated_at')) {
          updateSql += `, updated_at = NOW()`;
        }
        const url = new URL(req.url || '/', 'https://laser-touch.vercel.app');
        const pathname = url.pathname;
        const pathId = pathname.startsWith('/api/services/') ? Number(pathname.split('/').pop()) : undefined;
        const targetId = pathId ?? Number(id);
        updateSql += ` WHERE id = $${params.length + 1}`;
        params.push(targetId);

        const upd = await client.query(updateSql, params);
        if (upd.rowCount === 0) {
          return res.status(404).json({ error: 'Service not found' });
        }
        
        res.status(200).json({ success: true });
      } else if (req.method === 'DELETE') {
        // Delete service (soft delete)
        const { id } = req.query;
        if (isDemo) {
          return res.status(200).json({ success: true, demo: true });
        }
        // Detect available columns
        const structure = await client.query(`
          SELECT column_name FROM information_schema.columns WHERE table_name = 'services'
        `);
        const cols = structure.rows.map((r: any) => r.column_name);

        const url = new URL(req.url || '/', 'https://laser-touch.vercel.app');
        const pathname = url.pathname;
        const pathId = pathname.startsWith('/api/services/') ? Number(pathname.split('/').pop()) : undefined;
        const targetId = (id as string) ? Number(id) : pathId;
        if (!targetId || Number.isNaN(targetId)) {
          return res.status(400).json({ error: 'Service ID is required' });
        }

        if (cols.includes('is_active')) {
          let sql = `UPDATE services SET is_active = false`;
          if (cols.includes('updated_at')) sql += `, updated_at = NOW()`;
          sql += ` WHERE id = $1`;
          const r = await client.query(sql, [targetId]);
          if (r.rowCount === 0) return res.status(404).json({ error: 'Service not found' });
        } else {
          const r = await client.query(`DELETE FROM services WHERE id = $1`, [targetId]);
          if (r.rowCount === 0) return res.status(404).json({ error: 'Service not found' });
        }
        
        res.status(200).json({ success: true });
      }
      
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error) {
    console.error('❌ Services error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 