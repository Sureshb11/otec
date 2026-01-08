-- Migration: Add password reset fields to users table
-- Run this migration to add password reset functionality

ALTER TABLE users
ADD COLUMN IF NOT EXISTS "resetPasswordToken" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMP;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users("resetPasswordToken") WHERE "resetPasswordToken" IS NOT NULL;

