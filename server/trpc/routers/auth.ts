import { z } from 'zod'
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../index.js'
import { TRPCError } from '@trpc/server'
import { db } from '../../db/index.js'
import { users } from '../../db/schema.js'
import { eq, desc, ilike, count, and, or } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import type { TRPCContext } from '../context.js'
import { audit } from '../audit.js'

const createUserInput = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url().optional(),
  googleId: z.string().optional(),
})

const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['user', 'shop_order_receiver', 'admin']),
})

export const authRouter = router({
  // Get current user session
  getMe: publicProcedure.query(async ({ ctx }: { ctx: TRPCContext }) => {
    if (!ctx.user) return null
    // Return user with properties matching client expectations
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      image: ctx.user.avatarUrl,
      role: ctx.user.role,
    }
  }),

  // Register user (for OAuth callback)
  registerUser: publicProcedure
    .input(createUserInput)
    .mutation(async ({ input }: { input: z.infer<typeof createUserInput> }) => {
      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1)

      if (existingUser.length > 0) {
        // Update existing user with OAuth info if needed
        const user = existingUser[0]
        if (input.googleId && !user.avatarUrl && input.avatarUrl) {
          await db.update(users)
            .set({ avatarUrl: input.avatarUrl, updatedAt: new Date() })
            .where(eq(users.id, user.id))
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
          role: user.role,
        }
      }

      // Create new user
      const newUser = await db.insert(users).values({
        id: uuidv4(),
        email: input.email,
        name: input.name,
        avatarUrl: input.avatarUrl,
        role: 'user',
      }).returning()

      return {
        id: newUser[0].id,
        email: newUser[0].email,
        name: newUser[0].name,
        image: newUser[0].avatarUrl,
        role: newUser[0].role,
      }
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255).optional(),
      avatarUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }: { ctx: TRPCContext; input: z.infer<typeof updateProfileInput> }) => {
      const updated = await db.update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, ctx.user!.id))
        .returning()

      if (updated.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      }

      return updated[0]
    }),

  // Logout - handled client-side by clearing session cookie
  logoutUser: publicProcedure.mutation(({ ctx }) => {
    if (ctx.req.session) {
      ctx.req.session.destroy(() => {})
    }
    return { success: true }
  }),

  // Demo 1-click Login for testing and admin access
  demoLogin: publicProcedure
    .input(z.object({ role: z.enum(['admin', 'user']).default('admin') }))
    .mutation(async ({ ctx, input }) => {
      const email = input.role === 'admin' ? 'sheaura360@gmail.com' : 'customer@sheaura.com'
      const name = input.role === 'admin' ? 'Sheaura Admin' : 'Valued Customer'

      let userList = await db.select().from(users).where(eq(users.email, email)).limit(1)
      let targetUser = userList[0]

      if (!targetUser) {
        const created = await db.insert(users).values({
          id: uuidv4(),
          email,
          name,
          role: input.role === 'admin' ? 'admin' : 'user',
        }).returning()
        targetUser = created[0]
      }

      if (ctx.req.session) {
        ;(ctx.req as any).session.passport = { user: targetUser.id }
        await new Promise<void>((resolve) => ctx.req.session.save(() => resolve()))
      }

      return {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
        image: targetUser.avatarUrl,
      }
    }),

  // Admin: Get all users
  adminGetUsers: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(50),
      search: z.string().optional(),
      role: z.enum(['user', 'shop_order_receiver', 'admin']).optional(),
    }))
    .query(async ({ input }) => {
      const { page, limit, search, role } = input
      const offset = (page - 1) * limit

      const conditions = []
      if (search) {
        conditions.push(
          or(
            ilike(users.name, `%${search}%`),
            ilike(users.email, `%${search}%`)
          )!
        )
      }
      if (role) {
        conditions.push(eq(users.role, role))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const [items, totalResult] = await Promise.all([
        db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            avatarUrl: users.avatarUrl,
            role: users.role,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(whereClause)
          .orderBy(desc(users.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(users).where(whereClause),
      ])

      return {
        items,
        total: totalResult[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalResult[0].count / limit),
      }
    }),

  // Admin: Update user role
  adminUpdateUserRole: adminProcedure
    .input(updateUserRoleSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId, role } = input

      // Prevent admin from changing their own role
      if (userId === ctx.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot change your own role' })
      }

      const oldUser = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1)
      if (oldUser.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      }

      const oldRole = oldUser[0].role

      if (oldRole === role) {
        return { success: true, message: 'Role unchanged' }
      }

      const [updated] = await db
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning()

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      }

      // Audit log
      await audit.userRoleChanged(ctx, userId, oldRole, role)

      return updated
    }),
})

const updateProfileInput = z.object({
  name: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url().optional(),
})

export type AuthRouter = typeof authRouter