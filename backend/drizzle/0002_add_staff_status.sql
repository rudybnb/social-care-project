-- Add staff status tracking columns to shifts table
ALTER TABLE "shifts" 
ADD COLUMN IF NOT EXISTS "staff_status" text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS "decline_reason" text;

