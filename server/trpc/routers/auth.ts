import { z } from 'zod'
import { router, publicProcedure, protectedProcedure } from '../trpc/index.js'
import { TRPCError } from '@trpc/server'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export const authRouter = router({
  // Get current user session
  getMe: publicProcedure.query(async ({ ctx }) => {
    return ctx.user
  }),

  // Register user (for OAuth callback)
  registerUser: publicProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1).max(255).optional(),
      avatarUrl: z.string().url().optional(),
      googleId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
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
        return user
      }

      // Create new user
      const newUser = await db.insert(users).values({
        id: uuidv4(),
        email: input.email,
        name: input.name,
        avatarUrl: input.avatarUrl,
        role: 'user',
      }).returning()

      return newUser[0]
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255).optional(),
      avatarUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updated = await db.update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id))
        .returning()

      if (updated.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      }

      return updated[0]
    }),

  // Logout - handled client-side by clearing session cookie
  logoutUser: publicProcedure.mutation(() => {
    return { success: true }
  }),
})

export type AuthRouter = typeof authRouter