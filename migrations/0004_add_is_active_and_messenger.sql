-- Add is_active column to services table for soft delete
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add messenger fields to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS messenger_type TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS messenger_contact TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

