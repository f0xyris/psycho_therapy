import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { sendAppointmentSubmittedEmail, sendAdminAppointmentNotification, sendAppointmentConfirmedEmail } from '../server/emailService.js';

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

  // CORS FIX: Expanded allowed origins to include Vercel preview deployments and local development
  const allowedOrigins = [
    'https://psycho-therapy.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin as string | undefined;
  const dynamicAllowedOrigins = new Set([
    ...allowedOrigins,
    'https://psycho-therapy.vercel.app'
  ]);
  if (origin && dynamicAllowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
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
    const url = new URL(req.url || '/', 'https://psycho-therapy.vercel.app');
    const pathname = url.pathname || '';
    // Verify token
    const token = extractTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const payload = verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const isDemo = (payload as any).isDemo === true;
    
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'Database configuration missing' });
    }
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const client = await pool.connect();
    
    try {
      // Determine effective admin from DB to avoid stale token issues
      let effectiveIsAdmin = !!payload.isAdmin;
      try {
        const adminRes = await client.query('SELECT is_admin FROM users WHERE id = $1', [payload.userId]);
        if (adminRes.rows && adminRes.rows[0]) {
          effectiveIsAdmin = effectiveIsAdmin || !!adminRes.rows[0].is_admin;
        }
      } catch (e) {
        // If DB check fails, fall back to token claim
      }

      // Inline sub-router to support /api/working-hours within this single function
      if (pathname.startsWith('/api/working-hours')) {
        if (req.method === 'GET') {
          const dateParam = req.query.date as string | string[] | undefined;
          const date = Array.isArray(dateParam) ? dateParam[0] : dateParam;
          if (!date) return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
          try {
            const structure = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'working_hours'`);
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
          // Admin only
          if (!effectiveIsAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
          }
          const rawBody: any = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
          const { date, startTime, endTime } = rawBody as { date?: string; startTime?: string; endTime?: string };
          if (!date || !startTime || !endTime) {
            return res.status(400).json({ error: 'date, startTime and endTime are required' });
          }
          const hhmm = /^\d{2}:\d{2}$/;
          if (!hhmm.test(String(startTime)) || !hhmm.test(String(endTime))) {
            return res.status(400).json({ error: 'Invalid time format, expected HH:mm' });
          }
          const colsRes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'working_hours'`);
          const hasUpdatedAt = colsRes.rows.some((r: any) => r.column_name === 'updated_at');
          const upd = await client.query(
            `UPDATE working_hours SET start_time = $2, end_time = $3${hasUpdatedAt ? ', updated_at = NOW()' : ''} WHERE date = $1 RETURNING id, date, start_time AS "startTime", end_time AS "endTime"`,
            [date, startTime, endTime]
          );
          if (upd.rowCount > 0) {
            return res.status(200).json(upd.rows[0]);
          }
          const ins = await client.query(
            `INSERT INTO working_hours (date, start_time, end_time${hasUpdatedAt ? ', updated_at' : ''}) VALUES ($1, $2, $3${hasUpdatedAt ? ', NOW()' : ''}) RETURNING id, date, start_time AS "startTime", end_time AS "EndTime"`,
            [date, startTime, endTime]
          );
          // Normalize key name to endTime
          const saved = ins.rows[0];
          if (saved && saved.EndTime && !saved.endTime) {
            saved.endTime = saved.EndTime;
            delete saved.EndTime;
          }
          return res.status(200).json(saved);
        }
        return res.status(405).json({ error: 'Method not allowed' });
      }

      if (req.method === 'GET') {
        // Check if this is a by-date request
        const { date } = req.query;
        if (date && typeof date === 'string') {
          // Handle by-date request
          const result = await client.query(`
            SELECT 
              a.id,
              a.appointment_date as "appointmentDate",
              a.status,
              a.notes,
              a.created_at as "createdAt",
              a.client_name as "clientName",
              a.client_phone as "clientPhone",
              a.client_email as "clientEmail",
              a.is_deleted_from_admin as "isDeletedFromAdmin",
              u.id as "userId",
              u.first_name as "firstName",
              u.last_name as "lastName",
              u.email,
              u.phone
            FROM appointments a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.appointment_date DESC
          `);

          // Filter appointments for the specific date
          const dateAppointments = result.rows.filter((appointment: any) => {
            const appointmentDate = new Date(appointment.appointmentDate);
            const queryDate = new Date(date);
            
            // Compare only the date part (year, month, day)
            return appointmentDate.getFullYear() === queryDate.getFullYear() &&
                   appointmentDate.getMonth() === queryDate.getMonth() &&
                   appointmentDate.getDate() === queryDate.getDate();
          });

          return res.status(200).json(dateAppointments);
        }

        // Check if appointments table exists
        let appointmentsStructure;
        try {
          appointmentsStructure = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'appointments' 
            ORDER BY ordinal_position
          `);
          
          if (appointmentsStructure.rows.length === 0) {
            return res.status(200).json([]);
          }
         } catch (error) {
           console.log('Error checking appointments table structure:', error.message);
           console.log('Appointments table does not exist, returning empty array');
           return res.status(200).json([]);
         }
        
        // Check if services table exists and has name column
        let servicesNameColumn = null;
        try {
          const servicesStructure = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'services' 
            ORDER BY ordinal_position
          `);
          
          if (servicesStructure.rows.some(row => row.column_name === 'name')) {
            servicesNameColumn = 'name';
          } else if (servicesStructure.rows.some(row => row.column_name === 'name_ua')) {
            servicesNameColumn = 'name_ua';
          }
          console.log('Services table found, name column:', servicesNameColumn);
        } catch (error) {
          console.log('Services table not found, skipping service name');
        }
        
                 // Check what columns exist in appointments table
         const appointmentsColumns = appointmentsStructure.rows.map(row => row.column_name);
         console.log('Available appointments columns:', appointmentsColumns);
         
         let query = `
           SELECT 
             a.id, 
             a.user_id, 
             a.service_id, 
             a.appointment_date`;
         
         
         
         // Add other columns that might exist
         if (appointmentsColumns.includes('status')) {
           query += `, a.status`;
         }
         if (appointmentsColumns.includes('notes')) {
           query += `, a.notes`;
         }
                   if (appointmentsColumns.includes('created_at')) {
            query += `, a.created_at`;
          }
         
         // Add user info if users table exists
         query += `,
             u.first_name as user_first_name,
             u.last_name as user_last_name,
             u.email as user_email
         `;
        
        // Add service name if services table exists
        if (servicesNameColumn) {
          query += `, s.${servicesNameColumn} as service_name`;
        }
        
        query += `
          FROM appointments a
          LEFT JOIN users u ON a.user_id = u.id
        `;
        
        // Add services join if table exists
        if (servicesNameColumn) {
          query += ` LEFT JOIN services s ON a.service_id = s.id`;
        }
        
        console.log('Final query with JOINs:', query);
        
        console.log('Final query:', query);
        
        const queryParams = [];
        
        console.log('User ID from token:', payload.userId);
        console.log('Is admin:', payload.isAdmin);
        
                 // If not admin, only show user's own appointments
         if (!payload.isAdmin) {
           query += ' WHERE a.user_id = $1';
           queryParams.push(payload.userId.toString());
         }
         
         console.log('Query parameters:', queryParams);
        
                           query += ' ORDER BY a.appointment_date DESC';
        
        const appointmentsResult = await client.query(query, queryParams);
        
        console.log('Appointments query result:', appointmentsResult.rows.length, 'appointments found');
        console.log('Raw appointments data:', appointmentsResult.rows);
        
        const maskEmail = (email: string | null) => {
          if (!email) return null as any;
          const [name, domain] = email.split('@');
          if (!name || !domain) return '***@***' as any;
          const visible = Math.min(2, name.length);
          return `${name.slice(0, visible)}***@${domain}` as any;
        };

        const appointments = appointmentsResult.rows.map(appointment => ({
           id: appointment.id,
           userId: appointment.user_id,
           serviceId: appointment.service_id,
           appointmentDate: appointment.appointment_date,
                       appointmentTime: null, // No separate appointment_time column
           status: appointment.status,
                       notes: appointment.notes,
            createdAt: appointment.created_at,
           user: {
             firstName: appointment.user_first_name,
             lastName: appointment.user_last_name,
            email: isDemo ? maskEmail(appointment.user_email) : appointment.user_email
           },
                       service: {
              name: typeof appointment.service_name === 'object' && appointment.service_name?.ua 
                ? appointment.service_name.ua 
                : (typeof appointment.service_name === 'string' 
                  ? appointment.service_name 
                  : (servicesNameColumn ? 'Unknown Service' : 'Service ID: ' + appointment.service_id))
            }
         }));
        
        console.log('GET appointments successful, returning', appointments.length, 'appointments');
        res.status(200).json(appointments);
      } else if (req.method === 'POST') {
        // Create new appointment
        const { userId, serviceId, appointmentDate, appointmentTime, notes, isOnline, messengerType, messengerContact } = req.body;
        
        console.log('POST appointment data:', { userId, serviceId, appointmentDate, appointmentTime, notes, isOnline, messengerType, messengerContact });
        
        // Validate required fields
        if (!serviceId || !appointmentDate) {
          console.log('Missing required fields:', { serviceId, appointmentDate });
          return res.status(400).json({ error: 'Missing required fields: serviceId and appointmentDate' });
        }
        
        // If admin is creating appointment for another user, use that userId
        // Otherwise, use the current user's ID
        const targetUserId = (payload.isAdmin && userId) ? userId : payload.userId;
        
        // Ensure appointmentDate is in correct format
        let formattedDate = appointmentDate;
        if (typeof appointmentDate === 'string') {
          // If it's already a timestamp string, use it as is
          formattedDate = appointmentDate;
        } else {
          // If it's a Date object or other format, convert to ISO string
          formattedDate = new Date(appointmentDate).toISOString();
        }
        
        console.log('Formatted date:', formattedDate);
        console.log('Target user ID:', targetUserId);
        
        if (isDemo) {
          // In demo mode, do not write to DB; return synthetic record that resembles real one
          return res.status(201).json({
            id: Math.floor(Math.random() * 1000000) + 1000,
            userId: targetUserId,
            serviceId,
            appointmentDate: formattedDate,
            status: 'pending',
            notes: notes || '',
            createdAt: new Date().toISOString(),
            demo: true,
          });
        }

        // Check what columns exist in appointments table
        const structureCheck = await client.query(`
          SELECT column_name FROM information_schema.columns WHERE table_name = 'appointments'
        `);
        const existingColumns = structureCheck.rows.map((r: any) => r.column_name);
        
        // Build dynamic query based on available columns
        let insertColumns = ['user_id', 'service_id', 'appointment_date', 'status', 'notes', 'created_at'];
        let insertValues = [
          targetUserId.toString(),
          serviceId,
          formattedDate,
          'pending',
          notes || ''
        ];
        let insertPlaceholders = ['$1', '$2', '$3', '$4', '$5', 'NOW()'];
        
        if (existingColumns.includes('is_online')) {
          insertColumns.push('is_online');
          insertValues.push(isOnline || false);
          insertPlaceholders.push(`$${insertValues.length}`);
        }
        
        if (existingColumns.includes('messenger_type') && messengerType) {
          insertColumns.push('messenger_type');
          insertValues.push(messengerType);
          insertPlaceholders.push(`$${insertValues.length}`);
        }
        
        if (existingColumns.includes('messenger_contact') && messengerContact) {
          insertColumns.push('messenger_contact');
          insertValues.push(messengerContact);
          insertPlaceholders.push(`$${insertValues.length}`);
        }
        
        const insertQuery = `
          INSERT INTO appointments (${insertColumns.join(', ')})
          VALUES (${insertPlaceholders.join(', ')})
          RETURNING id
        `;
        
        const result = await client.query(insertQuery, insertValues);
        
        console.log('POST appointment successful, created ID:', result.rows[0].id);

        // Send emails (user + admin) similar to local Express implementation
        try {
          // Try to get service name for email
          let serviceName: string = 'Unknown Service';
          try {
            const svcRes = await client.query('SELECT name FROM services WHERE id = $1', [serviceId]);
            const svc = svcRes.rows?.[0];
            const nameVal = svc?.name;
            if (typeof nameVal === 'string') {
              serviceName = nameVal;
            } else if (nameVal && typeof nameVal === 'object') {
              serviceName = nameVal.ua || nameVal.en || nameVal.pl || nameVal.ru || serviceName;
            }
          } catch (e) {
            console.warn('Failed to fetch service for email, proceeding with default name');
          }

          const userEmail = payload.email;
          const userLanguage = 'ua';

          try {
            await sendAppointmentSubmittedEmail(
              userEmail,
              serviceName,
              new Date(formattedDate),
              userLanguage
            );
          } catch (emailErr) {
            console.error('Error sending appointment submission email:', emailErr);
          }

          try {
            const adminEmail = process.env.ADMIN_EMAIL || 'antip4uck.ia@gmail.com';
            const clientName = `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || 'Unknown Client';
            const clientPhone = 'No phone provided';

            await sendAdminAppointmentNotification(
              adminEmail,
              clientName,
              userEmail,
              clientPhone,
              serviceName,
              new Date(formattedDate),
              isOnline || false,
              userLanguage,
              messengerType || null,
              messengerContact || null
            );
          } catch (adminErr) {
            console.error('Error sending admin notification email:', adminErr);
          }
        } catch (wrapErr) {
          console.error('Unexpected error during email sending:', wrapErr);
        }

        res.status(201).json({ id: result.rows[0].id });
                 } else if (req.method === 'PUT') {
             // CRITICAL FIX: Handle appointment updates from both URL parameters and request body
             // This fixes the issue where frontend sends PUT requests to /api/appointments?id=123
            const rawBody: any = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
            const { id, status: bodyStatus, notes } = rawBody as { id?: number | string; status?: string; notes?: string };

             // Check if this is a status update request (from URL parameter)
            const urlId = req.query.id as string | string[] | undefined;
            const appointmentIdRaw = (Array.isArray(urlId) ? urlId[0] : urlId) ?? (id as any);
            const appointmentId = appointmentIdRaw !== undefined && appointmentIdRaw !== null ? Number(appointmentIdRaw) : undefined;

            if (!appointmentId || Number.isNaN(appointmentId)) {
              return res.status(400).json({ error: 'Appointment ID is required' });
            }

        // Validate status value
        const statusFromQuery = (req.query.status as string | undefined);
        const status = (bodyStatus ?? statusFromQuery) as string | undefined;
        const allowedStatuses = new Set(['pending', 'confirmed', 'cancelled', 'completed']);
        if (status !== undefined && !allowedStatuses.has(String(status))) {
          return res.status(400).json({ error: 'Invalid status value' });
        }
        
        let query = 'UPDATE appointments SET';
        const queryParams: any[] = [];
        let paramIndex = 1;
        let hasUpdates = false;
        
        if (status !== undefined) {
          if (hasUpdates) query += ',';
          query += ` status = $${paramIndex++}`;
          queryParams.push(status);
          hasUpdates = true;
        }
        
        if (notes !== undefined) {
          if (hasUpdates) query += ',';
          query += ` notes = $${paramIndex++}`;
          queryParams.push(notes);
          hasUpdates = true;
        }
        
        if (!hasUpdates) {
          return res.status(400).json({ error: 'No fields to update' });
        }
        
        query += ` WHERE id = $${paramIndex}`;
        queryParams.push(appointmentId);
        
        // If not admin, only allow updating own appointments
        if (!effectiveIsAdmin) {
          query += ` AND user_id = $${paramIndex + 1}`;
          queryParams.push(payload.userId.toString());
        }
        // Return updated row
        query += ' RETURNING id, status, notes, appointment_date as "appointmentDate"';
        const result = await client.query(query, queryParams);

        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Appointment not found or access denied' });
        }

        // If status updated to confirmed, send confirmation email
        try {
          if (status === 'confirmed') {
            const apptRes = await client.query(
              `SELECT a.id, a.user_id, a.service_id, a.appointment_date, u.email as user_email, s.name as service_name
               FROM appointments a
               LEFT JOIN users u ON a.user_id = u.id
               LEFT JOIN services s ON a.service_id = s.id
               WHERE a.id = $1`,
              [appointmentId]
            );
            const appt = apptRes.rows?.[0];
            if (appt && appt.user_email) {
              let serviceName: string = 'Unknown Service';
              const nameVal = appt.service_name;
              if (typeof nameVal === 'string') serviceName = nameVal;
              else if (nameVal && typeof nameVal === 'object') serviceName = nameVal.ua || nameVal.en || nameVal.pl || nameVal.ru || serviceName;

              await sendAppointmentConfirmedEmail(
                appt.user_email,
                serviceName,
                new Date(appt.appointment_date),
                'ua'
              );
            }
          }
        } catch (emailErr) {
          console.error('Error sending appointment confirmation email:', emailErr);
        }

        console.log('PUT appointment successful, updated rows:', result.rowCount, 'updated:', result.rows?.[0]);
        res.status(200).json({ success: true, updated: result.rows?.[0] });
      } else if (req.method === 'DELETE') {
        // Delete appointment
        const { id } = req.query;
        
        if (!id) {
          return res.status(400).json({ error: 'Appointment ID is required' });
        }
        
        let query = 'DELETE FROM appointments WHERE id = $1';
        const queryParams = [id];
        
        // If not admin, only allow deleting own appointments
        if (!effectiveIsAdmin) {
          query += ' AND user_id = $2';
          queryParams.push(payload.userId.toString());
        }
        
        const result = await client.query(query, queryParams);
        
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Appointment not found or access denied' });
        }
        
        console.log('DELETE appointment successful, deleted rows:', result.rowCount);
        res.status(200).json({ success: true });
      }
      
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error) {
    console.error('❌ Appointments error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 