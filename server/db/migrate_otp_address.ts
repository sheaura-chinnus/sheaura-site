import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  console.log('Connecting to database...')

  try {
    // 1. Create Enum address_label
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE address_label AS ENUM ('home', 'office', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)
    console.log('Enum address_label verified/created')

    // 2. Add columns to users table
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_first_order BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS welcome_coupon_used BOOLEAN DEFAULT FALSE;
    `)
    console.log('Columns is_first_order and welcome_coupon_used added to users')

    // 3. Drop old otp_codes table if exists with varchar id
    await pool.query(`DROP TABLE IF EXISTS otp_codes;`)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone VARCHAR(50) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS otp_codes_phone_idx ON otp_codes(phone);
      CREATE INDEX IF NOT EXISTS otp_codes_expires_at_idx ON otp_codes(expires_at);
    `)
    console.log('Table otp_codes verified/created with UUID')

    // 4. Create user_addresses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        label address_label NOT NULL DEFAULT 'home',
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        street_address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS user_addresses_user_idx ON user_addresses(user_id);
      CREATE INDEX IF NOT EXISTS user_addresses_pincode_idx ON user_addresses(pincode);
    `)
    console.log('Table user_addresses verified/created with UUID')

    console.log('All OTP, Address & Onboarding database migrations completed successfully!')
  } catch (err) {
    console.error('Migration error:', err)
  } finally {
    await pool.end()
  }
}

runMigration()
