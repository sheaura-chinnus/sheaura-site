import http from 'http'
import type { AddressInfo } from 'net'
import { app } from '../index.js'

let testServer: http.Server | null = null
let testPort: number = 0

export function getTestPort(): number {
  return testPort
}

export function startTestServer(): Promise<number> {
  return new Promise((resolve) => {
    testServer = app.listen(0, '127.0.0.1', () => {
      const addr = testServer!.address() as AddressInfo
      testPort = addr.port
      resolve(testPort)
    })
  })
}

export function stopTestServer(): Promise<void> {
  return new Promise((resolve) => {
    if (testServer) {
      testServer.close(() => resolve())
    } else {
      resolve()
    }
  })
}

export function makeRequest(
  urlPath: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: string
  } = {}
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const method = options.method || 'GET'
    const reqOptions: http.RequestOptions = {
      hostname: '127.0.0.1',
      port: testPort,
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
