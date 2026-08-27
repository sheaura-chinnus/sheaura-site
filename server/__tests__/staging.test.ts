import 'dotenv/config'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startTestServer, stopTestServer, makeRequest } from './testHelper.js'

describe('Staging Access Gate & Health Checks', () => {
  beforeAll(async () => {
    await startTestServer()
  })

  afterAll(async () => {
    await stopTestServer()
  })

  it('should allow /health endpoint without credentials', async () => {
    const res = await makeRequest('/health')
    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('status')
    expect(res.body).toContain('ok')
  })

  it('should bypass staging gate when STAGING_MODE is not "true"', async () => {
    const origMode = process.env.STAGING_MODE
    delete process.env.STAGING_MODE
    try {
      const res = await makeRequest('/health')
      expect(res.statusCode).toBe(200)
    } finally {
      if (origMode !== undefined) process.env.STAGING_MODE = origMode
    }
  })

  it('should enforce basic auth when STAGING_MODE is "true" on regular routes', async () => {
    const origMode = process.env.STAGING_MODE
    const origUser = process.env.STAGING_USERNAME
    const origPass = process.env.STAGING_PASSWORD

    process.env.STAGING_MODE = 'true'
    process.env.STAGING_USERNAME = 'staginguser'
    process.env.STAGING_PASSWORD = 'stagingpass'

    try {
      // 1. Unauthenticated request to /auth/me should receive 401 with WWW-Authenticate header
      const resUnauth = await makeRequest('/auth/me')
      expect(resUnauth.statusCode).toBe(401)
      expect(resUnauth.headers['www-authenticate']).toContain('Basic realm="Staging Access Required"')

      // 2. /health should still succeed without credentials even in staging mode
      const resHealth = await makeRequest('/health')
      expect(resHealth.statusCode).toBe(200)

      // 3. Valid basic auth should bypass staging gate
      const validCreds = Buffer.from('staginguser:stagingpass').toString('base64')
      const resAuth = await makeRequest('/auth/me', {
        headers: { Authorization: `Basic ${validCreds}` }
      })
      // Should bypass staging gate; /auth/me then returns 401 because user has no session, but NOT the staging WWW-Authenticate
      expect(resAuth.headers['www-authenticate']).toBeUndefined()
    } finally {
      if (origMode !== undefined) {
        process.env.STAGING_MODE = origMode
      } else {
        delete process.env.STAGING_MODE
      }
      process.env.STAGING_USERNAME = origUser
      process.env.STAGING_PASSWORD = origPass
    }
  })
})
