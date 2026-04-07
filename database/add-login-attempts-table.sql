-- Add login attempts tracking table
CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN DEFAULT FALSE
);

-- Create indexes for login_attempts table
CREATE INDEX IF NOT EXISTS idx_username ON login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_attempt_time ON login_attempts(attempt_time);

-- Add account lock tracking to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS failed_login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS permanent_lock BOOLEAN DEFAULT FALSE;

-- Create index for locked accounts
CREATE INDEX IF NOT EXISTS idx_account_locked ON users(account_locked_until);
