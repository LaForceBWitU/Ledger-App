-- Migration to add approval system to users table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

-- Add approved column (default false for new users)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT false;

-- Add approved_at column (nullable, set when owner approves)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- IMPORTANT: Update existing users to be approved
-- (This ensures existing users can still access the app)
UPDATE users
SET approved = true, approved_at = NOW()
WHERE approved IS NULL OR approved = false;

-- Optional: Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_approved ON users(approved);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
