import { db, type Database } from '../db/index.js'
import type { Request } from 'express'

export interface UserSession {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  role: 'user' | 'shop_order_receiver' | 'admin'
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
    // Get user from Passport session (req.user is set by passport.session() middleware)
    if (req.user && typeof req.user === 'object' && 'id' in req.user) {
      const user = req.user as { id: string; email: string; name: string | null; avatarUrl: string | null; role: 'user' | 'shop_order_receiver' | 'admin' }
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
      }
    }
    return null
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