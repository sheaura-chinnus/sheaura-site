import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import passport from 'passport'
import rateLimit from 'express-rate-limit'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { createContext } from './trpc/context.js'
import { appRouter } from './trpc/router.js'
import { db, closePool } from './db/index.js'
import { siteSettings, mediaAssets, users } from './db/schema.js'
import { eq } from 'drizzle-orm'
import { audit } from './trpc/audit.js'
import { validateImageBuffer, saveMediaAsset, getMediaAssetById } from './media/storage.js'
import './auth/session.js' // Initialize passport session
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import crypto from 'crypto'
import fs from 'fs'

// Extend express-session types
declare module 'express-session' {
  interface SessionData {
    csrfToken?: string
  }
}

// Extend Express User type to include role from Passport deserialization
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User {
      id: string
      email: string | null
      phone?: string | null
      name: string | null
      avatarUrl: string | null
      role: 'user' | 'shop_order_receiver' | 'admin'
      createdAt: Date
      updatedAt: Date
    }
  }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = join(__dirname, '..', '..')

// Ensure persistent upload directory exists
const UPLOADS_DIR = join(process.cwd(), 'uploads', 'products')
fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const app = express()
const PORT = Number(process.env.PORT) || 4000
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

// Startup environment validation (without printing secret values!)
const requiredEnvVars = ['SESSION_SECRET']
const missingVars = requiredEnvVars.filter(key => !process.env[key])
if (missingVars.length > 0) {
  console.error(`❌ Startup Error: Missing required environment variables: ${missingVars.join(', ')}`)
  throw new Error(`SESSION_SECRET environment variable is required. Generate a secure random string (32+ chars).`)
}

if (!process.env.ADMIN_PASSWORD) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Startup Error: Missing required environment variable: ADMIN_PASSWORD')
    throw new Error('ADMIN_PASSWORD environment variable is required in production.')
  } else {
    console.warn('⚠️ Warning: ADMIN_PASSWORD environment variable is not configured. Admin portal access will be disabled until set.')
  }
}

// Session secret
const SESSION_SECRET = process.env.SESSION_SECRET!
const SESSION_MAX_AGE = 1000 * 60 * 30 // 30 minutes sliding window

// Trust proxy for secure cookies behind reverse proxy (Render)
app.set('trust proxy', 1)

// 1. Request Correlation ID
app.use((req, res, next) => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID()
  res.setHeader('x-request-id', requestId)
  next()
})

// 2. Strict Security Headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https:;"
  )
  next()
})

// Middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Static file serving for product images
app.use('/uploads', express.static(join(process.cwd(), 'uploads')))

// CORS - Strict Origin Configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', CLIENT_URL)
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, x-request-id')
  res.header('Vary', 'Origin')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// Staging Access Gate - Enabled only when STAGING_MODE=true
export function stagingAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (process.env.STAGING_MODE !== 'true') {
    return next()
  }

  // Allow /health endpoint without credentials for Render monitoring
  if (req.path === '/health') {
    return next()
  }

  const expectedUser = process.env.STAGING_USERNAME
  const expectedPass = process.env.STAGING_PASSWORD

  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Basic ')) {
    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8')
    const [user, pass] = credentials.split(':')

    if (expectedUser && expectedPass && user === expectedUser && pass === expectedPass) {
      return next()
    }
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Staging Access Required"')
  return res.status(401).send('Staging Access Required')
}

app.use(stagingAuth)

// Rate limiting
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 failed attempts per 15 minutes per IP
  skipSuccessfulRequests: true, // Only failed attempts (status >= 400) count against limit
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute for general API
  message: { error: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Apply stricter rate limiting to auth endpoints and admin media uploads
app.use('/trpc/auth.adminLogin', authRateLimiter)
app.use('/trpc/auth.staffLogin', authRateLimiter)
app.use('/auth/logout', authRateLimiter)
app.use('/api/admin/media/upload-logo', authRateLimiter)

// Apply general rate limiting to tRPC
app.use('/trpc', apiRateLimiter)

// Session with sliding expiration
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true, // Enable sliding expiration
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    sameSite: 'lax', // Strict CSRF protection with reverse proxy support
  },
}))

// Passport
app.use(passport.initialize())
app.use(passport.session())

// CSRF Protection - Double-submit cookie pattern
function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Set CSRF token cookie on responses
app.use((req, res, next) => {
  if (req.method === 'GET' || !req.session.csrfToken) {
    const token = req.session.csrfToken || generateCsrfToken()
    req.session.csrfToken = token

    res.cookie('csrf_token', token, {
      httpOnly: false, // Frontend reads for mutation headers
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })
  }
  next()
})

// CSRF validation middleware for state-changing operations
function validateCsrfToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Skip CSRF for safe read methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  // Skip for health check
  if (req.path === '/health') {
    return next()
  }

  const sessionToken = req.session.csrfToken
  const headerToken = (req.headers['x-csrf-token'] as string) || (req.headers['X-CSRF-Token'] as string)

  if (!sessionToken || !headerToken || sessionToken !== headerToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' })
  }

  next()
}

app.use(validateCsrfToken)

// Health check (always available, lightweight for Render monitoring)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Public Media Serving Endpoint (safe headers, no script execution)
app.get(['/api/media/:id', '/api/media/:id/:filename'], async (req, res) => {
  try {
    const rawId = req.params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId
    if (!id || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({ error: 'Invalid media asset ID' })
    }

    const asset = await getMediaAssetById(id)
    if (!asset) {
      return res.status(404).json({ error: 'Media asset not found' })
    }

    res.setHeader('Content-Type', asset.mimeType)
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'")
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.send(asset.buffer)
  } catch (error) {
    console.error('Failed to serve media:', error)
    res.status(500).json({ error: 'Failed to retrieve media asset' })
  }
})

// Admin Authentication Middleware
export async function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.path.includes('.')) {
    return next()
  }
  try {
    // 1. Fast path: check Passport deserialized user
    if (req.user && req.user.role === 'admin') {
      return next()
    }

    // 2. Check session userId or passport session
    const sessionData = req.session as unknown as Record<string, unknown> | undefined
    const userId = (sessionData?.userId as string | undefined) || ((sessionData?.passport as any)?.user as string | undefined)

    if (!userId) {
      if (req.originalUrl?.includes('/api/admin') || req.path?.includes('/api/admin')) {
        return res.status(403).json({ error: 'Access denied: Administrator privileges required.' })
      }
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Verify user and role directly in the database
    const userList = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    const user = userList[0]

    if (!user || user.role !== 'admin') {
      if (req.originalUrl?.includes('/api/admin') || req.path?.includes('/api/admin')) {
        return res.status(403).json({ error: 'Access denied: Administrator privileges required.' })
      }
      return res.status(403).json({ error: 'Admin access required' })
    }

    req.user = user
    return next()
  } catch (err) {
    console.error('requireAdminAuth error:', err)
    if (req.originalUrl?.includes('/api/admin') || req.path?.includes('/api/admin')) {
      return res.status(403).json({ error: 'Access denied: Administrator privileges required.' })
    }
    return res.status(401).json({ error: 'Not authenticated' })
  }
}

// Admin Media Upload Endpoint (CSRF protected, Admin auth checked, Magic bytes validated)
app.post('/api/admin/media/upload-logo', authRateLimiter, requireAdminAuth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Administrator privileges required.' })
    }

    const { fileBase64, originalFilename, altText } = req.body
    if (!fileBase64 || typeof fileBase64 !== 'string') {
      return res.status(400).json({ error: 'fileBase64 string is required' })
    }

    const cleanBase64 = fileBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '')
    const buffer = Buffer.from(cleanBase64, 'base64')

    // Strict validation: magic bytes, MIME type, max 2MB, rejects SVG
    const validated = validateImageBuffer(buffer, 2 * 1024 * 1024)

    // Check for previous logo asset to clean up
    const oldLogoSetting = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, 'logoAssetId'))
      .limit(1)
    const oldAssetId = oldLogoSetting[0]?.value ?? null

    // Store media asset safely
    const asset = await saveMediaAsset(validated, {
      originalFilename: typeof originalFilename === 'string' ? originalFilename.slice(0, 100) : undefined,
      altText: typeof altText === 'string' ? altText.slice(0, 255) : 'Sheaura Brand Logo',
      userId: req.user.id,
    })

    // Update site settings atomically
    await db
      .insert(siteSettings)
      .values({ key: 'logoAssetId', value: asset.id })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: asset.id, updatedAt: new Date() },
      })

    await db
      .insert(siteSettings)
      .values({ key: 'logoUrl', value: asset.url })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: asset.url, updatedAt: new Date() },
      })

    if (altText && typeof altText === 'string') {
      await db
        .insert(siteSettings)
        .values({ key: 'logoAltText', value: altText.slice(0, 255) })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: altText.slice(0, 255), updatedAt: new Date() },
        })
    }

    // Clean up previous logo asset in DB if it was replaced
    if (oldAssetId && oldAssetId !== asset.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(oldAssetId)) {
      await db.delete(mediaAssets).where(eq(mediaAssets.id, oldAssetId))
    }

    // Audit log
    await audit.logoUploaded(
      { user: req.user, req } as any,
      asset.id,
      asset.filename,
      asset.mimeType,
      asset.size
    )

    return res.json({
      success: true,
      asset: {
        id: asset.id,
        url: asset.url,
        filename: asset.filename,
        mimeType: asset.mimeType,
        size: asset.size,
      },
    })
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to upload logo' })
  }
})

// Logout
app.post('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err)
    req.session.destroy(() => {
      res.clearCookie('connect.sid')
      res.json({ success: true })
    })
  })
})

// Get current user
app.get('/auth/me', (req, res) => {
  if (req.user) {
    res.json(req.user)
  } else {
    res.status(401).json({ error: 'Not authenticated' })
  }
})

// Google OAuth 2.0 Endpoints
app.get('/auth/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect('/login?error=google_not_configured')
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })(req, res, next)
})

app.get('/auth/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect('/login?error=google_not_configured')
  }
  const successRedirect = process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL ? '/' : `${CLIENT_URL.replace(/\/$/, '')}/`
  const failureRedirect = process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL ? '/login?error=google_failed' : `${CLIENT_URL.replace(/\/$/, '')}/login?error=google_failed`

  passport.authenticate('google', {
    successRedirect,
    failureRedirect,
  })(req, res, next)
})

// Serve static files from client build in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = fs.existsSync(join(process.cwd(), 'dist', 'client'))
    ? join(process.cwd(), 'dist', 'client')
    : join(PROJECT_ROOT, 'dist', 'client')
  app.use(express.static(clientDist))
}

// tRPC middleware
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`❌ tRPC error on ${path}:`, error)
      }
    },
  })
)

// Admin route protection middleware for API routes
app.use('/admin', requireAdminAuth)

// SPA fallback
if (process.env.NODE_ENV === 'production') {
  const clientDist = fs.existsSync(join(process.cwd(), 'dist', 'client'))
    ? join(process.cwd(), 'dist', 'client')
    : join(PROJECT_ROOT, 'dist', 'client')
  app.get('/{*splat}', (_, res) => {
    res.sendFile('index.html', { root: clientDist })
  })
}

// Centralized Safe Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err.message)
  res.status(500).json({ error: 'An unexpected server error occurred' })
})

// Graceful shutdown
let server: any = null

export async function shutdown() {
  console.log('Shutting down gracefully...')
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
  await closePool()
}

process.on('SIGTERM', async () => {
  await shutdown()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await shutdown()
  process.exit(0)
})

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`)
    console.log(`📡 tRPC endpoint: http://0.0.0.0:${PORT}/trpc`)
  })
}

export { app, server }