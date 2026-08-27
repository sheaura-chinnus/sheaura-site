import 'dotenv/config'
import { describe, it, expect } from 'vitest'
import http from 'http'

function makeRequest(
  urlPath: string,
  options: {
    method?: string
    headers?: Record<string, string>
    port?: number
  } = {}
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve) => {
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

    req.on('error', (err) => {
      resolve({ statusCode: 500, headers: {}, body: err.message })
    })

    req.end()
  })
}

describe('Staging Access Gate & Health Checks', () => {
  it('should allow /health endpoint without credentials', async () => {
    const res = await makeRequest('/health')
    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('status')
    expect(res.body).toContain('ok')
  })

  it('should bypass staging gate when STAGING_MODE is not "true"', async () => {
    delete process.env.STAGING_MODE
    const res = await makeRequest('/health')
    expect(res.statusCode).toBe(200)
  })
})
