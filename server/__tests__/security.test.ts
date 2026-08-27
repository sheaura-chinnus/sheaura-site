import 'dotenv/config'
import { describe, it, expect } from 'vitest'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { db } from '../db/index.js'
import { products } from '../db/schema.js'

function makeRequest(
  urlPath: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: string
    port?: number
  } = {}
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const method = options.method || 'GET'
    const port = options.port || 4000
    const reqOptions: http.RequestOptions = {
      hostname: 'localhost',
      port,
      path: urlPath,
      method,
      headers: options.headers || {},
    }

    const req = http.request(reqOptions, (res) => {
      let body = ''
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => {
        resolve({ statusCode: res.statusCode || 500, headers: res.headers, body })
      })
    })

    req.on('error', (err) => reject(err))

    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

describe('Stage 6 — Security & Authorization Automated Tests', () => {

  describe('1. Unauthenticated Access & Deny-by-Default Protection', () => {
    it('should deny unauthenticated access to Express /admin routes with 401', async () => {
      const res = await makeRequest('/admin/dashboard')
      expect(res.statusCode).toBe(401)
      expect(res.body).toContain('Not authenticated')
    })

    it('should deny unauthenticated tRPC admin procedure (enquiries.adminGetList) with 401 UNAUTHORIZED', async () => {
      const res = await makeRequest('/trpc/enquiries.adminGetList')
      expect(res.statusCode).toBe(401)
      expect(res.body).toContain('UNAUTHORIZED')
    })

    it('should deny unauthenticated tRPC admin procedure (siteSettings.adminGetList) with 401 UNAUTHORIZED', async () => {
      const res = await makeRequest('/trpc/siteSettings.adminGetList')
      expect(res.statusCode).toBe(401)
      expect(res.body).toContain('UNAUTHORIZED')
    })
  })

  describe('2. CSRF Token Protection', () => {
    it('should block POST mutation without x-csrf-token header with 403 Invalid CSRF token', async () => {
      const inputStr = JSON.stringify({
        '0': {
          json: {
            name: 'CSRF Test',
            email: 'csrf@example.com',
            items: [],
          },
        },
      })
      const res = await makeRequest('/trpc/enquiries.createEnquiry?batch=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: inputStr,
        port: 3000,
      })
      expect(res.statusCode).toBe(403)
      expect(res.body).toContain('Invalid CSRF token')
    })

    it('should allow POST mutation when valid x-csrf-token header and session cookie are sent', async () => {
      // Step A: GET request to acquire CSRF cookie & session
      const getRes = await makeRequest('/trpc/siteSettings.getPublic?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D', { port: 3000 })
      const setCookies = getRes.headers['set-cookie'] || []
      let csrfToken = ''
      setCookies.forEach((c) => {
        const m = c.match(/csrf_token=([^;]+)/)
        if (m) csrfToken = m[1]
      })

      expect(csrfToken).toBeTruthy()

      // Dynamically fetch a valid product ID directly from DB
      const existingProds = await db.select({ id: products.id }).from(products).limit(1)
      const targetProductId = existingProds[0]?.id || 'cb6a8b7c-4eb8-4651-aa73-e494b4aec651'

      // Step B: Send POST with x-csrf-token header
      const payload = JSON.stringify({
        '0': {
          json: {
            name: 'Valid Customer',
            email: 'valid@example.com',
            phone: '9999999999',
            eventDate: '2026-12-01T00:00:00.000Z',
            items: [{ productId: targetProductId, quantity: 1, mode: 'sale' }],
          },
          meta: { values: { eventDate: ['Date'] } },
        },
      })

      const postRes = await makeRequest('/trpc/enquiries.createEnquiry?batch=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: setCookies.map((c) => c.split(';')[0]).join('; '),
          'x-csrf-token': csrfToken,
        },
        body: payload,
        port: 3000,
      })

      if (postRes.statusCode !== 200) {
        console.log('DEBUG postRes:', postRes.statusCode, postRes.body)
      }
      expect(postRes.statusCode).toBe(200)
      expect(postRes.body).toContain('enquiryId')
    })
  })

  describe('3. Rate Limiting (Max 5 Attempts / 15-Min Window)', () => {
    it('should enforce rate limiting on auth endpoints with 429 status', async () => {
      // Send requests to /auth/google until rate limited
      let hitRateLimit = false
      for (let i = 0; i < 10; i++) {
        const res = await makeRequest('/auth/google')
        if (res.statusCode === 429) {
          hitRateLimit = true
          expect(res.body).toContain('Too many authentication attempts')
          break
        }
      }
      expect(hitRateLimit).toBe(true)
    })
  })

  describe('4. Secret Scanning & Security Audit', () => {
    it('should verify no credentials or DATABASE_URL secrets are hardcoded in source files', () => {
      const serverFiles = fs.readdirSync(path.resolve(__dirname, '..'))
      const hardcodedSecretPattern = /(postgres:\/\/[^@]+@|GOCSPX-[a-zA-Z0-9_-]{20,})/

      for (const file of serverFiles) {
        const fullPath = path.resolve(__dirname, '..', file)
        if (fs.statSync(fullPath).isFile() && (file.endsWith('.ts') || file.endsWith('.js'))) {
          const content = fs.readFileSync(fullPath, 'utf8')
          expect(content).not.toMatch(hardcodedSecretPattern)
        }
      }
    })
  })
})
