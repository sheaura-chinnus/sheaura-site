import { z } from 'zod'
import crypto from 'crypto'
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

// Helper function to hash passwords securely with salt
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
}

export const authRouter = router({
  // Get current user session
  getMe: publicProcedure.query(async ({ ctx }: { ctx: TRPCContext }) => {
    if (!ctx.user) return null
    // Fetch full user record to include customer address and phone fields
    const userList = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1)
    const userRecord = userList[0] || ctx.user

    return {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      phone: (userRecord as any).phone || null,
      image: userRecord.avatarUrl,
      role: userRecord.role,
      deliveryAddress: (userRecord as any).deliveryAddress || null,
      city: (userRecord as any).city || null,
      state: (userRecord as any).state || null,
      pincode: (userRecord as any).pincode || null,
    }
  }),

  // Customer Registration (Email, Password, Name, Phone)
  customerRegister: publicProcedure
    .input(z.object({
      email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
      name: z.string().min(1, 'Name is required').max(255).trim(),
      phone: z.string().max(50).optional(),
      password: z.string().min(6, 'Password must be at least 6 characters'),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1)

      if (existing.length > 0 && existing[0].passwordHash) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An account with this email already exists. Please sign in.',
        })
      }

      const salt = crypto.randomBytes(16).toString('hex')
      const hash = hashPassword(input.password, salt)
      const storedHash = `${salt}:${hash}`

      let targetUser = existing[0]

      if (targetUser) {
        const [updated] = await db
          .update(users)
          .set({
            name: input.name,
            phone: input.phone,
            passwordHash: storedHash,
            updatedAt: new Date(),
          })
          .where(eq(users.id, targetUser.id))
          .returning()
        targetUser = updated
      } else {
        const [created] = await db
          .insert(users)
          .values({
            id: uuidv4(),
            email: input.email,
            name: input.name,
            phone: input.phone,
            passwordHash: storedHash,
            role: 'user',
          })
          .returning()
        targetUser = created
      }

      if (ctx.req.session) {
        ;(ctx.req as any).session.passport = { user: targetUser.id }
        await new Promise<void>((resolve) => ctx.req.session.save(() => resolve()))
      }

      return {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        phone: targetUser.phone,
        role: targetUser.role,
        image: targetUser.avatarUrl,
        deliveryAddress: targetUser.deliveryAddress,
        city: targetUser.city,
        state: targetUser.state,
        pincode: targetUser.pincode,
      }
    }),

  // Customer Login (Email & Password)
  customerLogin: publicProcedure
    .input(z.object({
      email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
      password: z.string().min(1, 'Password is required'),
    }))
    .mutation(async ({ ctx, input }) => {
      const userList = await db.select().from(users).where(eq(users.email, input.email)).limit(1)
      const targetUser = userList[0]

      if (!targetUser || !targetUser.passwordHash) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password. Please check your credentials or create an account.',
        })
      }

      const [salt, expectedHash] = targetUser.passwordHash.split(':')
      if (!salt || !expectedHash) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid login method. Please sign in using Google or reset your password.',
        })
      }

      const inputHash = hashPassword(input.password, salt)
      if (inputHash !== expectedHash) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password. Access denied.',
        })
      }

      if (ctx.req.session) {
        ;(ctx.req as any).session.passport = { user: targetUser.id }
        await new Promise<void>((resolve) => ctx.req.session.save(() => resolve()))
      }

      return {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        phone: targetUser.phone,
        role: targetUser.role,
        image: targetUser.avatarUrl,
        deliveryAddress: targetUser.deliveryAddress,
        city: targetUser.city,
        state: targetUser.state,
        pincode: targetUser.pincode,
      }
    }),

  // Google OAuth / One-Tap Authentication
  googleLogin: publicProcedure
    .input(z.object({
      email: z.string().email().toLowerCase().trim(),
      name: z.string().optional(),
      avatarUrl: z.string().url().optional(),
      googleId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1)
      let targetUser = existing[0]

      if (targetUser) {
        const [updated] = await db
          .update(users)
          .set({
            name: targetUser.name || input.name,
            avatarUrl: input.avatarUrl || targetUser.avatarUrl,
            googleId: input.googleId || targetUser.googleId,
            updatedAt: new Date(),
          })
          .where(eq(users.id, targetUser.id))
          .returning()
        targetUser = updated
      } else {
        const [created] = await db
          .insert(users)
          .values({
            id: uuidv4(),
            email: input.email,
            name: input.name || 'Shopper',
            avatarUrl: input.avatarUrl,
            googleId: input.googleId,
            role: 'user',
          })
          .returning()
        targetUser = created
      }

      if (ctx.req.session) {
        ;(ctx.req as any).session.passport = { user: targetUser.id }
        await new Promise<void>((resolve) => ctx.req.session.save(() => resolve()))
      }

      return {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        phone: targetUser.phone,
        role: targetUser.role,
        image: targetUser.avatarUrl,
        deliveryAddress: targetUser.deliveryAddress,
        city: targetUser.city,
        state: targetUser.state,
        pincode: targetUser.pincode,
      }
    }),

  // Customer Profile & Delivery Address Update
  updateCustomerProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255).optional(),
      phone: z.string().max(50).optional(),
      deliveryAddress: z.string().max(500).optional(),
      city: z.string().max(100).optional(),
      state: z.string().max(100).optional(),
      pincode: z.string().max(20).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(users)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user!.id))
        .returning()

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      }

      return {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        phone: updated.phone,
        role: updated.role,
        image: updated.avatarUrl,
        deliveryAddress: updated.deliveryAddress,
        city: updated.city,
        state: updated.state,
        pincode: updated.pincode,
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

  // Admin Password Login (Secure, timing-safe SHA-256 verification)
  adminLogin: publicProcedure
    .input(z.object({
      password: z.string().min(1, 'Admin password is required'),
    }))
    .mutation(async ({ ctx, input }) => {
      const configuredPassword = process.env.ADMIN_PASSWORD || 'sheaura@admin2026'

      const inputHash = crypto.createHash('sha256').update(input.password).digest()
      const expectedHash = crypto.createHash('sha256').update(configuredPassword).digest()

      const isMatch = crypto.timingSafeEqual(inputHash, expectedHash)

      if (!isMatch) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid admin password. Access denied.',
        })
      }

      const email = 'sheaura360@gmail.com'
      const name = 'Sheaura Admin'

      let userList = await db.select().from(users).where(eq(users.email, email)).limit(1)
      let targetUser = userList[0]

      if (!targetUser) {
        const created = await db.insert(users).values({
          id: uuidv4(),
          email,
          name,
          role: 'admin',
        }).returning()
        targetUser = created[0]
      } else if (targetUser.role !== 'admin') {
        const updated = await db.update(users).set({ role: 'admin' }).where(eq(users.id, targetUser.id)).returning()
        targetUser = updated[0]
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

  // Staff & Delivery Enquiry Login
  staffLogin: publicProcedure
    .input(z.object({
      password: z.string().min(1, 'Password is required'),
      role: z.enum(['admin', 'shop_order_receiver']).default('admin'),
    }))
    .mutation(async ({ ctx, input }) => {
      const configuredPassword = process.env.ADMIN_PASSWORD || 'sheaura@admin2026'

      const inputHash = crypto.createHash('sha256').update(input.password).digest()
      const expectedHash = crypto.createHash('sha256').update(configuredPassword).digest()

      const isMatch = crypto.timingSafeEqual(inputHash, expectedHash)

      if (!isMatch) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid staff password. Access denied.',
        })
      }

      const email = input.role === 'admin' ? 'sheaura360@gmail.com' : 'delivery@sheaura.com'
      const name = input.role === 'admin' ? 'Sheaura Admin' : 'Delivery & Enquiry Team'

      let userList = await db.select().from(users).where(eq(users.email, email)).limit(1)
      let targetUser = userList[0]

      if (!targetUser) {
        const created = await db.insert(users).values({
          id: uuidv4(),
          email,
          name,
          role: input.role,
        }).returning()
        targetUser = created[0]
      } else if (targetUser.role !== input.role) {
        const updated = await db.update(users).set({ role: input.role }).where(eq(users.id, targetUser.id)).returning()
        targetUser = updated[0]
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