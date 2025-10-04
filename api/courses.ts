import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import { sendCoursePurchasedEmail } from '../server/emailService.js';
import { put as putBlob } from '@vercel/blob';
import formidable from 'formidable';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-06-30.basil' })
  : null as unknown as Stripe;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const extractToken = (req: VercelRequest): string | null => {
    const auth = req.headers['authorization'];
    if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7);
    return null;
  };
  const verifyToken = (token: string | null): any => {
    if (!token) return null;
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    try { return jwt.verify(token, secret); } catch { return null; }
  };
  const origin = req.headers.origin as string | undefined;
  const url = new URL(req.url || '/', 'https://laser-touch.vercel.app');
  const pathname = url.pathname;

  // Stripe webhook must read raw body and doesn't need CORS
  if (req.method === 'POST' && pathname === '/api/webhook/stripe') {
    const sig = req.headers['stripe-signature'] as string | undefined;
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET || !stripe) {
      return res.status(400).send('Stripe is not configured');
    }
    try {
      const rawBody = await (async () => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
        }
        return Buffer.concat(chunks);
      })();
      const event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const courseId = paymentIntent.metadata?.courseId;
        const courseNameMeta = paymentIntent.metadata?.courseName;
        const userEmail = paymentIntent.metadata?.userEmail || 'customer@example.com';

        if (courseId) {
          const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
          const client = await pool.connect();
          try {
            const courseRes = await client.query('SELECT id, name, price, duration FROM courses WHERE id = $1', [courseId]);
            const course = courseRes.rows?.[0];
            if (course) {
              const courseName = (() => {
                const name = course.name;
                if (typeof name === 'string') return name;
                if (name && typeof name === 'object') return name.ua || name.en || name.pl || name.ru || courseNameMeta || 'Unknown Course';
                return courseNameMeta || 'Unknown Course';
              })();
              const courseDuration = `${course.duration} ${course.duration === 1 ? 'hour' : 'hours'}`;
              const coursePrice = `${(course.price / 100).toLocaleString('ru-RU')} ₽`;
              try {
                await sendCoursePurchasedEmail(userEmail, courseName, courseDuration, coursePrice, 'ua');
              } catch (emailErr) {
                console.error('Error sending course purchase email:', emailErr);
              }
            }
          } finally {
            client.release();
            await pool.end();
          }
        }
      }

      return res.status(200).json({ received: true });
    } catch (err: any) {
      console.error('Webhook error:', err?.message || err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  // Normal CORS for browser endpoints
  const allowedOrigins = [
    'https://laser-touch.vercel.app',
    'https://laser-touch-git-main-yaroslav-kravets-projects.vercel.app',
    'https://psycho-therapy.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Create Payment Intent routed to this file
  if (req.method === 'POST' && pathname === '/api/create-payment-intent') {
    if (!stripe) return res.status(500).json({ error: 'Stripe is not configured' });
    try {
      const { courseId, userEmail } = req.body as { courseId: number; userEmail?: string };
      if (!courseId) return res.status(400).json({ error: 'courseId required' });

      const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      const client = await pool.connect();
      try {
        const courseRes = await client.query('SELECT id, name, price, duration FROM courses WHERE id = $1', [courseId]);
        const course = courseRes.rows?.[0];
        if (!course) return res.status(404).json({ error: 'Course not found' });

        const courseName = (() => {
          const name = course.name;
          if (typeof name === 'string') return name;
          if (name && typeof name === 'object') return name.ua || name.en || name.pl || name.ru || 'Unknown Course';
          return 'Unknown Course';
        })();

        const paymentIntent = await stripe.paymentIntents.create({
          amount: course.price,
          currency: 'rub',
          automatic_payment_methods: { enabled: true },
          metadata: {
            courseId: String(courseId),
            courseName,
            userEmail: userEmail || 'customer@example.com',
          },
        });

        return res.status(200).json({ clientSecret: paymentIntent.client_secret, course });
      } finally {
        client.release();
        await pool.end();
      }
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      return res.status(500).json({ error: 'Error creating payment intent: ' + error.message });
    }
  }

  // Upload endpoint (form-data) consolidated here to avoid extra functions
  if (req.method === 'POST' && pathname === '/api/upload') {
    const token = extractToken(req);
    const payload = verifyToken(token);
    if (!payload || !payload.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    try {
      // Ensure Vercel Blob is configured
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({ error: 'Blob storage is not configured. Set BLOB_READ_WRITE_TOKEN in project settings.' });
      }
      // Parse multipart form with formidable
      const form = formidable({ multiples: false, maxFileSize: 10 * 1024 * 1024 });
      const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
        form.parse(req as any, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });

      const anyFile = (files as any)?.file || Object.values(files)[0];
      const file = Array.isArray(anyFile) ? anyFile[0] : anyFile;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Read file buffer
      const fs = await import('fs');
      const data = await fs.promises.readFile(file.filepath);
      const contentType = (file.mimetype as string) || 'application/octet-stream';
      const fileName = `${Date.now()}_${(file.originalFilename || 'upload').replace(/[^a-zA-Z0-9_.-]/g, '')}`;

      // Upload to Vercel Blob (requires BLOB_READ_WRITE_TOKEN on project)
      const blob = await putBlob(`uploads/${fileName}`, data, { access: 'public', contentType });

      // Respond with public URL to be saved in DB
      return res.status(200).json({ url: blob.url, originalName: file.originalFilename });
    } catch (err: any) {
      console.error('Upload error:', err);
      const message = typeof err?.message === 'string' ? err.message : 'Upload failed';
      // Surface common misconfiguration messages
      if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('401')) {
        return res.status(500).json({ error: 'Blob auth failed. Check BLOB_READ_WRITE_TOKEN in project env.' });
      }
      return res.status(500).json({ error: 'Upload failed' });
    }
  }

  // Read single course by id
  if (pathname.startsWith('/api/courses/') && req.method === 'GET') {
    const idStr = pathname.split('/').pop();
    const id = Number(idStr);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'Database configuration missing' });
    }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    try {
      // Detect columns to normalize safely
      const structure = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'courses'`);
      const cols = structure.rows.map((r: any) => r.column_name);
      const rowRes = await client.query('SELECT * FROM courses WHERE id = $1 LIMIT 1', [id]);
      const course = rowRes.rows?.[0];
      if (!course) return res.status(404).json({ error: 'Not found' });
      const normalized = {
        id: course.id,
        name: (cols.includes('name') ? course.name : course.title) || { ua: '', en: '', pl: '' },
        description: cols.includes('description') ? (course.description || { ua: '', en: '', pl: '' }) : { ua: '', en: '', pl: '' },
        price: cols.includes('price') ? (course.price || 0) : 0,
        duration: cols.includes('duration') ? (course.duration || 60) : 60,
        imageUrl: (cols.includes('image_url') ? (course.image_url || null) : null) || (cols.includes('image') ? (course.image || null) : null),
        docUrl: cols.includes('doc_url') ? (course.doc_url || null) : null,
        category: cols.includes('category') ? (course.category || 'custom') : 'custom',
        isActive: cols.includes('is_active') ? (course.is_active !== false) : true,
        createdAt: cols.includes('created_at') ? course.created_at : null,
        updatedAt: cols.includes('updated_at') ? course.updated_at : null,
      };
      return res.status(200).json(normalized);
    } finally {
      client.release();
      await pool.end();
    }
  }

  // Write operations for courses with dynamic columns
  if (pathname === '/api/courses' && req.method === 'POST') {
    const payload = verifyToken(extractToken(req));
    const isDemo = !!payload?.isDemo;
    const { name, price, duration, description, category, imageUrl, docUrl } = req.body as any;
    if (isDemo) {
      return res.status(201).json({
        id: Math.floor(Math.random() * 1000000) + 1000,
        name: name || { ua: '', en: '', pl: '' },
        description: description || { ua: '', en: '', pl: '' },
        price: price || 0,
        duration: duration || 60,
        imageUrl: imageUrl || null,
        category: category || 'custom',
        demo: true,
      });
    }
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'Database configuration missing' });
    }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    try {
      const structure = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'courses'`);
      const cols = structure.rows.map((r: any) => r.column_name);
      const insertCols: string[] = [];
      const params: any[] = [];
      const placeholders: string[] = [];
      const add = (col: string, value: any, raw = false) => {
        insertCols.push(col);
        if (raw) {
          placeholders.push(value);
        } else {
          params.push(value);
          placeholders.push(`$${params.length}`);
        }
      };
      if (cols.includes('name')) add('name', JSON.stringify(name || { ua: '', en: '', pl: '' }));
      if (cols.includes('description')) add('description', JSON.stringify(description || { ua: '', en: '', pl: '' }));
      if (cols.includes('price')) add('price', price || 0);
      if (cols.includes('duration')) add('duration', duration || 60);
      if (cols.includes('category')) add('category', category || 'custom');
      if (cols.includes('image_url')) add('image_url', imageUrl || null);
      if (cols.includes('doc_url')) add('doc_url', docUrl || null);
      if (cols.includes('image')) add('image', imageUrl || null);
      if (cols.includes('created_at')) add('created_at', 'NOW()', true);
      if (cols.includes('updated_at')) add('updated_at', 'NOW()', true);
      const sql = `INSERT INTO courses (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`;
      const result = await client.query(sql, params);
      const newId = result.rows[0].id;
      const created = await client.query('SELECT * FROM courses WHERE id = $1', [newId]);
      const course = created.rows[0] || { id: newId };
      const normalized = {
        id: course.id,
        name: course.name || course.title || { ua: '', en: '', pl: '' },
        description: course.description || { ua: '', en: '', pl: '' },
        price: course.price || 0,
        duration: course.duration || 60,
        imageUrl: course.image_url || course.image || null,
        docUrl: course.doc_url || null,
        category: course.category || 'custom',
        isActive: course.is_active !== false,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
      };
      return res.status(201).json(normalized);
    } finally {
      client.release();
      await pool.end();
    }
  }
  // Update by id
  if (pathname.startsWith('/api/courses/') && req.method === 'PUT') {
    const payload = verifyToken(extractToken(req));
    const isDemo = !!payload?.isDemo;
    if (isDemo) return res.status(200).json({ success: true, demo: true });
    const id = Number(pathname.split('/').pop());
    const { name, description, price, duration, category, imageUrl, docUrl } = req.body as any;
    if (!process.env.DATABASE_URL) return res.status(500).json({ error: 'Database configuration missing' });
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    try {
      const structure = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'courses'`);
      const cols = structure.rows.map((r: any) => r.column_name);
      const sets: string[] = [];
      const params: any[] = [];
      const add = (expr: string, value: any) => { params.push(value); sets.push(`${expr} = $${params.length}`); };
      if (cols.includes('name') && name !== undefined) add('name', JSON.stringify(name));
      if (cols.includes('description') && description !== undefined) add('description', JSON.stringify(description));
      if (cols.includes('price') && price !== undefined) add('price', price);
      if (cols.includes('duration') && duration !== undefined) add('duration', duration);
      if (cols.includes('category') && category !== undefined) add('category', category);
      if (cols.includes('image_url') && imageUrl !== undefined) add('image_url', imageUrl);
      if (cols.includes('doc_url') && docUrl !== undefined) add('doc_url', docUrl);
      if (cols.includes('image') && imageUrl !== undefined) add('image', imageUrl);
      if (cols.includes('updated_at')) sets.push('updated_at = NOW()');
      if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
      const sql = `UPDATE courses SET ${sets.join(', ')} WHERE id = $${params.length + 1}`;
      params.push(id);
      await client.query(sql, params);
      return res.status(200).json({ success: true });
    } finally {
      client.release();
      await pool.end();
    }
  }
  // Delete by id
  if (pathname.startsWith('/api/courses/') && req.method === 'DELETE') {
    const payload = verifyToken(extractToken(req));
    const isDemo = !!payload?.isDemo;
    if (isDemo) return res.status(200).json({ success: true, demo: true });
    const id = Number(pathname.split('/').pop());
    if (!process.env.DATABASE_URL) return res.status(500).json({ error: 'Database configuration missing' });
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    try {
      const structure = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'courses'`);
      const cols = structure.rows.map((r: any) => r.column_name);
      if (cols.includes('is_active')) {
        let sql = `UPDATE courses SET is_active = false`;
        if (cols.includes('updated_at')) sql += `, updated_at = NOW()`;
        sql += ` WHERE id = $1`;
        await client.query(sql, [id]);
      } else {
        await client.query(`DELETE FROM courses WHERE id = $1`, [id]);
      }
      return res.status(200).json({ success: true });
    } finally {
      client.release();
      await pool.end();
    }
  }

  if (req.method !== 'GET' || pathname !== '/api/courses') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Courses endpoint called');
    
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
      // First, let's check the table structure
      console.log('Checking courses table structure...');
      const structureResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'courses' 
        ORDER BY ordinal_position
      `);
      
      console.log('Courses table columns:', structureResult.rows.map(row => `${row.column_name} (${row.data_type})`));
      
      // Now let's try a simple query to see what columns exist
      console.log('Executing simple courses query...');
      const coursesResult = await client.query(`
        SELECT * FROM courses LIMIT 1
      `);
      
      if (coursesResult.rows.length > 0) {
        console.log('Sample course row:', coursesResult.rows[0]);
      }
      
      // Based on the structure, let's build the proper query
      let query = 'SELECT ';
      const columns = structureResult.rows.map(row => row.column_name);
      
      if (columns.includes('id')) query += 'id, ';
      if (columns.includes('title')) query += 'title, ';
      if (columns.includes('name')) query += 'name, ';
      if (columns.includes('description')) query += 'description, ';
      if (columns.includes('price')) query += 'price, ';
      if (columns.includes('duration')) query += 'duration, ';
      if (columns.includes('image_url')) query += 'image_url, ';
      if (columns.includes('image')) query += 'image, ';
      if (columns.includes('category')) query += 'category, ';
      if (columns.includes('is_active')) query += 'is_active, ';
      if (columns.includes('created_at')) query += 'created_at, ';
      if (columns.includes('updated_at')) query += 'updated_at, ';
      
      // Remove trailing comma and space
      query = query.slice(0, -2);
      query += ' FROM courses';
      
      if (columns.includes('is_active')) {
        query += ' WHERE is_active = true';
      }
      
      if (columns.includes('created_at')) {
        query += ' ORDER BY created_at DESC';
      }
      
      console.log('Final query:', query);
      
      const finalResult = await client.query(query);
      console.log('Courses query result:', finalResult.rows.length, 'courses found');
      
      const courses = finalResult.rows.map(course => ({
        id: course.id,
        name: course.name || course.title || { ua: 'Untitled Course', en: 'Untitled Course', pl: 'Untitled Course' },
        description: course.description || { ua: '', en: '', pl: '' },
        price: course.price || 0,
        duration: course.duration || 60,
        imageUrl: course.image_url || course.image || null,
        category: course.category || 'laser',
        isActive: course.is_active !== false,
        createdAt: course.created_at,
        updatedAt: course.updated_at
      }));
      
      res.status(200).json(courses);
      
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error) {
    console.error('❌ Courses fetch error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 