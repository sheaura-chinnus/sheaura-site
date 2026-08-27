import { initTRPC, TRPCError } from '@trpc/server'
import { type TRPCContext } from './context.js'
import superjson from 'superjson'

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    // Sanitize error messages - don't leak internal details
    const sanitizedShape = { ...shape }

    // In production, remove internal error details
    if (process.env.NODE_ENV === 'production') {
      // Remove zodError which may contain schema details
      if (sanitizedShape.data && typeof sanitizedShape.data === 'object') {
        delete (sanitizedShape.data as Record<string, unknown>).zodError
      }
      // Replace internal error messages with generic ones for server errors
      if (String(shape.code) === 'INTERNAL_SERVER_ERROR') {
        sanitizedShape.message = 'An internal error occurred'
      }
    }

    return sanitizedShape
  },
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
  }
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})

export const shopOrderReceiverProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
  }
  if (!['admin', 'shop_order_receiver'].includes(ctx.user.role)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Insufficient permissions' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})