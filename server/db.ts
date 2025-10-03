import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

async function applyMigrations(pool: Pool) {
  try {
    const client = await pool.connect();

    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' 
      AND column_name = 'is_deleted_from_admin'
    `);
    
    if (checkResult.rows.length === 0) {
      await client.query(`
        ALTER TABLE appointments 
        ADD COLUMN is_deleted_from_admin boolean DEFAULT false
      `);

    }
    
    const updateResult = await client.query(`
      UPDATE appointments 
      SET is_deleted_from_admin = true 
      WHERE status = 'deleted'
    `);
    
    if (updateResult.rowCount && updateResult.rowCount > 0) {
  
    }
    
    // Ensure courses.doc_url exists
    const docCol = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'courses' 
      AND column_name = 'doc_url'
    `);
    if (docCol.rows.length === 0) {
      await client.query(`
        ALTER TABLE courses 
        ADD COLUMN doc_url text
      `);
    }

    // Ensure working_hours table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS working_hours (
        id SERIAL PRIMARY KEY,
        date VARCHAR NOT NULL UNIQUE,
        start_time VARCHAR NOT NULL,
        end_time VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Ensure appointments.is_online exists
    const onlineCol = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'appointments' AND column_name = 'is_online'
    `);
    if (onlineCol.rows.length === 0) {
      await client.query(`ALTER TABLE appointments ADD COLUMN is_online boolean DEFAULT false`);
    }

    client.release();
  } catch (error) {
    console.error('❌ Ошибка при применении миграций:', error);
  }
}

applyMigrations(pool);