import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import passport from 'passport'
import rateLimit from 'express-rate-limit'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { createContext } from './trpc/context.js'
import { appRouter } from './trpc/router.js'
import { closePool } from './db/index.js'
import './auth/google.js' // Initialize passport Google strategy
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import crypto from 'crypto'

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
      email: string
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

const app = express()
const PORT = process.env.PORT || 4000
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

// Session secret - MUST be set, no default allowed (even in development for security)
const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required. Generate a secure random string (32+ chars).')
}

// Session configuration
const SESSION_MAX_AGE = 1000 * 60 * 30 // 30 minutes

// Trust proxy for secure cookies behind reverse proxy
app.set('trust proxy', 1)

// Middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// CORS - Improved configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', CLIENT_URL)
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token')
  res.header('Vary', 'Origin')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// Staging Access Gate - Enabled only when STAGING_MODE=true
function stagingAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (process.env.STAGING_MODE !== 'true') {
    return next()
  }

  // Allow /health endpoint without credentials
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
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per 15-minute window for auth endpoints
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

// Apply stricter rate limiting to auth endpoints
app.use('/auth/google', authRateLimiter)
app.use('/auth/logout', authRateLimiter)

// Apply general rate limiting to tRPC
app.use('/trpc', apiRateLimiter)

// Session with sliding expiration
app.use(session({
  secret: SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  rolling: true, // Enable sliding expiration
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    sameSite: 'lax', // Use 'lax' for CSRF protection, works in production behind proxy
  },
}))

// Passport
app.use(passport.initialize())
app.use(passport.session())

// CSRF Protection - Double-submit cookie pattern
// Generate CSRF token for each session
function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Set CSRF token cookie on all responses (for GET requests and initial load)
app.use((req, res, next) => {
  // Only set CSRF cookie for safe methods or if not already set
  if (req.method === 'GET' || !req.session.csrfToken) {
    const token = req.session.csrfToken || generateCsrfToken()
    req.session.csrfToken = token

    // Set cookie (accessible to frontend for reading)
    res.cookie('csrf_token', token, {
      httpOnly: false, // Frontend needs to read this
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
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  // Skip for OAuth callback (external POST from Google)
  if (req.path.startsWith('/auth/google/callback')) {
    return next()
  }

  // Skip for health check
  if (req.path === '/health') {
    return next()
  }

  const sessionToken = req.session.csrfToken
  const headerToken = req.headers['x-csrf-token'] as string

  if (!sessionToken || !headerToken || sessionToken !== headerToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' })
  }

  next()
}

app.use(validateCsrfToken)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Google OAuth routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
  (_req, res) => {
    // Successful authentication, redirect to client
    res.redirect(`${CLIENT_URL}/`)
  }
)

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

// Serve static files from client build in production (before admin middleware so admin panel loads)
if (process.env.NODE_ENV === 'production') {
  const clientDist = join(PROJECT_ROOT, 'dist', 'client')
  console.log('📁 Serving static files from:', clientDist)
  app.use(express.static(clientDist))
}

// tRPC middleware
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`❌ tRPC error on ${path}:`, error)
    },
  })
)

// Admin route protection middleware - MUST be after static file serving for admin panel to load
// Only protect API routes, not static files
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Skip admin auth for static files (they have extensions)
  if (req.path.includes('.')) {
    return next()
  }

  // Check if user is authenticated via session
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  // Check if user has admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

// Apply admin auth protection to all /admin/* routes
app.use('/admin', requireAdminAuth)

// SPA fallback - must be last
if (process.env.NODE_ENV === 'production') {
  app.get('/{*splat}', (_, res) => {
    console.log('🔀 SPA fallback hit')
    res.sendFile('index.html', { root: join(PROJECT_ROOT, 'dist', 'client') })
  })
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await closePool()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  await closePool()
  process.exit(0)
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📡 tRPC endpoint: http://localhost:${PORT}/trpc`)
  console.log(`🔐 Google OAuth: http://localhost:${PORT}/auth/google`)
})