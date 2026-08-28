import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema.js'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('supabase.com') || process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
})

export const db = drizzle(pool, { schema })

export type Database = typeof db

let _hasItemCodeColumn: boolean | null = null

export async function checkHasItemCodeColumn(): Promise<boolean> {
  if (_hasItemCodeColumn !== null) return _hasItemCodeColumn
  try {
    const res = await pool.query(
      "SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_code'"
    )
    _hasItemCodeColumn = (res.rowCount ?? 0) > 0
  } catch {
    _hasItemCodeColumn = false
  }
  return _hasItemCodeColumn
}

export async function closePool() {
  await pool.end()
}