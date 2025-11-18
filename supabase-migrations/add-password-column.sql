-- Add password column to users table
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/aikbdtyzigeszkrozdng/sql

-- Add password column (nullable for now to allow existing users)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password TEXT;

-- Optional: Add comment to explain the column
COMMENT ON COLUMN users.password IS 'Hashed password (bcrypt)';

-- IMPORTANT: After running this migration, you should:
-- 1. Redeploy your app to re-enable password hashing
-- 2. Have users reset their passwords to populate this field
