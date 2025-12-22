-- Add auto-accept tracking fields to shifts table
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS auto_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS response_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS week_deadline TIMESTAMP;

-- Add comment for documentation
COMMENT ON COLUMN shifts.auto_accepted IS 'True if shift was auto-accepted after Saturday midnight deadline';
COMMENT ON COLUMN shifts.response_locked IS 'True if past deadline and cannot be changed without admin approval';
COMMENT ON COLUMN shifts.week_deadline IS 'The Saturday midnight deadline for this shift week';
