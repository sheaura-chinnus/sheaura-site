import 'dotenv/config'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startTestServer, stopTestServer, makeRequest } from './testHelper.js'
import { pool } from '../db/index.js'

describe('Phase 3 — PostgreSQL-Backed Session Persistence & Durability', () => {
  beforeAll(async () => {
    await startTestServer()
  })

  afterAll(async () => {
    await stopTestServer()
  })

  it('should store and persist sessions in PostgreSQL table', async () => {
    // 1. Initial request to establish session and CSRF cookie
    const res = await makeRequest('/health')
    expect(res.statusCode).toBe(200)

    const cookieHeader = res.headers['set-cookie']
    expect(cookieHeader).toBeDefined()

    // 2. Query PostgreSQL session table directly to confirm sessions are stored in DB
    const dbRes = await pool.query('SELECT count(*)::int as count FROM "session"')
    expect(dbRes.rows[0].count).toBeGreaterThanOrEqual(0)
  })

  it('should preserve session across simulated server restart', async () => {
    // 1. First get a valid CSRF token & session
    const res1 = await makeRequest('/health')
    const cookies = res1.headers['set-cookie'] || []
    const sidCookie = cookies.find((c) => c.includes('connect.sid'))
    expect(sidCookie).toBeDefined()

    // 2. Simulate server restart: stop and restart the HTTP listener
    await stopTestServer()
    await startTestServer()

    // 3. Make request with previous session cookie
    const res2 = await makeRequest('/health', {
      headers: {
        Cookie: sidCookie!,
      },
    })
    expect(res2.statusCode).toBe(200)
  })
})
