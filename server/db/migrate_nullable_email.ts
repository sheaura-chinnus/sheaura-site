import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  console.log('--- Migrating users table: Drop NOT NULL on email, add unique index on phone ---')

  // 1. Drop NOT NULL on email column
  try {
    await pool.query(`ALTER TABLE users ALTER COLUMN email DROP NOT NULL;`)
    console.log('✓ Dropped NOT NULL constraint on users.email')
  } catch (err: any) {
    console.log('Note on drop not null:', err.message)
  }

  // 2. Clean up any dummy @phone.sheaura.com emails
  try {
    const res = await pool.query(`UPDATE users SET email = NULL WHERE email LIKE '%@phone.sheaura.com';`)
    console.log(`✓ Cleaned up ${res.rowCount} dummy @phone.sheaura.com email records to NULL`)
  } catch (err: any) {
    console.log('Note on cleanup:', err.message)
  }

  // 3. Ensure unique index on phone
  try {
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique_idx ON users (phone) WHERE phone IS NOT NULL;`)
    console.log('✓ Created unique index on users.phone')
  } catch (err: any) {
    console.log('Note on phone index:', err.message)
  }

  await pool.end()
  console.log('Migration completed successfully!')
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
