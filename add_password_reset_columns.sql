-- Add password reset fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_reset_code TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ;
