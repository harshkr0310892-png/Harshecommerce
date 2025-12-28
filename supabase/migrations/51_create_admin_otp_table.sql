-- Create admin_otp table for storing OTP codes
CREATE TABLE IF NOT EXISTS admin_otp (
  email TEXT PRIMARY KEY,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for cleanup of expired OTPs
CREATE INDEX IF NOT EXISTS idx_admin_otp_expires_at ON admin_otp(expires_at);

-- Disable RLS since this table is only accessed via edge functions using service role
-- Service role bypasses RLS anyway, so it's safe to disable
ALTER TABLE admin_otp DISABLE ROW LEVEL SECURITY;

