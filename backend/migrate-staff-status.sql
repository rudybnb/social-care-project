-- Add staff status tracking columns to shifts table
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS staff_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- Update existing shifts to 'accepted' status (they were already assigned)
UPDATE shifts SET staff_status = 'accepted' WHERE staff_status IS NULL OR staff_status = 'pending';

