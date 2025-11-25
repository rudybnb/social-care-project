-- Add missing columns to staff table for login functionality
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "username" text;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "password" text;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "start_date" text;

