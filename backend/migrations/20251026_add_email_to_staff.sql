-- Add email column to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS email TEXT;
