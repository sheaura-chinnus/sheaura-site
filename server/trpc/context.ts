import { db, type Database } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'

export interface UserSession {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  role: 'user' | 'admin'
}

export interface TRPCContext {
  db: Database
  user: UserSession | null
  req: Request
}

export async function createContext(opts: { req: Request }): Promise<TRPCContext> {
  const { req } = opts

  // Get user from session cookie (Manus OAuth sets this)
  const user = await getUserFromRequest(req)

  return {
    db,
    user,
    req,
  }
}

async function getUserFromRequest(req: Request): Promise<UserSession | null> {
  try {
    // Check for Manus session cookie
    const cookieHeader = req.headers.get('cookie')
    if (!cookieHeader) return null

    const sessionCookie = cookieHeader
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('manus_session='))

    if (!sessionCookie) return null

    const sessionValue = decodeURIComponent(sessionCookie.split('=')[1])
    const session = JSON.parse(sessionValue)

    if (!session.userId) return null

    // Fetch user from database
    const user = await db.select().from(users).where(eq(users.id, session.userId)).limit(1)
    if (user.length === 0) return null

    return {
      id: user[0].id,
      email: user[0].email,
      name: user[0].name,
      avatarUrl: user[0].avatarUrl,
      role: user[0].role,
    }
  } catch {
    return null
  }
}

export function requireAuth(ctx: TRPCContext): UserSession {
  if (!ctx.user) {
    throw new Error('UNAUTHORIZED')
  }
  return ctx.user
}

export function requireAdmin(ctx: TRPCContext): UserSession {
  const user = requireAuth(ctx)
  if (user.role !== 'admin') {
    throw new Error('FORBIDDEN')
  }
  return user
}