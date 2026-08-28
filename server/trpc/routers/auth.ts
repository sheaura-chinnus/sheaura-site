import { z } from 'zod'
import crypto from 'crypto'
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../index.js'
import { TRPCError } from '@trpc/server'
import { db } from '../../db/index.js'
import { users, otpCodes, userAddresses } from '../../db/schema.js'
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

// Helper function to normalize Indian & International mobile numbers
function normalizePhone(phone: string, countryCode: string = '+91'): string {
  const clean = phone.trim()
  if (clean.startsWith('+')) {
    return clean.replace(/[\s-]/g, '')
  }
  const digitsOnly = clean.replace(/\D/g, '')
  if (digitsOnly.length === 10) {
    return `${countryCode}${digitsOnly}`
  }
  if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
    return `+${digitsOnly}`
  }
  return `+${digitsOnly}`
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
      isFirstOrder: (userRecord as any).isFirstOrder ?? true,
      welcomeCouponUsed: (userRecord as any).welcomeCouponUsed ?? false,
    }
  }),

  // One-Tap Mobile OTP Auth: Send OTP via SMS / WhatsApp simulation
  sendOtp: publicProcedure
    .input(z.object({
      phone: z.string().min(8, 'Phone number must be at least 8 digits').max(20),
      countryCode: z.string().default('+91'),
    }))
    .mutation(async ({ input }) => {
      const normalizedPhone = normalizePhone(input.phone, input.countryCode)

      // Generate a 4-digit code (deterministic for tests, randomized for normal execution)
      const code = process.env.NODE_ENV === 'test'
        ? '1234'
        : Math.floor(1000 + Math.random() * 9000).toString()

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

      // Insert OTP record
      await db.insert(otpCodes).values({
        id: uuidv4(),
        phone: normalizedPhone,
        code,
        expiresAt,
        verified: false,
      })

      // Check if user already exists
      const existingUser = await db
        .select({ id: users.id, name: users.name, isFirstOrder: users.isFirstOrder })
        .from(users)
        .where(eq(users.phone, normalizedPhone))
        .limit(1)

      return {
        success: true,
        message: `OTP sent to ${normalizedPhone}`,
        phone: normalizedPhone,
        expiresInSeconds: 300,
        isExistingUser: existingUser.length > 0,
        demoOtp: code, // Provided for instant preview / testing
      }
    }),

  // One-Tap Mobile OTP Auth: Verify 4-Digit Code & Create Instant Headless Account
  verifyOtp: publicProcedure
    .input(z.object({
      phone: z.string().min(8).max(20),
      countryCode: z.string().default('+91'),
      code: z.string().length(4, 'OTP must be 4 digits'),
      fullName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const normalizedPhone = normalizePhone(input.phone, input.countryCode)

      // Find active matching unverified OTP record
      const otps = await db
        .select()
        .from(otpCodes)
        .where(
          and(
            eq(otpCodes.phone, normalizedPhone),
            eq(otpCodes.code, input.code.trim()),
            eq(otpCodes.verified, false)
          )
        )
        .orderBy(desc(otpCodes.createdAt))
        .limit(1)

      if (otps.length === 0) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid OTP code. Please check the 4 digits and try again.',
        })
      }

      const activeOtp = otps[0]
      if (new Date() > new Date(activeOtp.expiresAt)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'This OTP has expired. Please tap "Resend Code" to get a new one.',
        })
      }

      // Mark OTP as verified
      await db.update(otpCodes).set({ verified: true }).where(eq(otpCodes.id, activeOtp.id))

      // Locate or auto-create customer account
      const cleanPhoneDigits = normalizedPhone.replace(/\D/g, '')
      const emailFallback = `${cleanPhoneDigits}@phone.sheaura.com`

      const existingUsers = await db
        .select()
        .from(users)
        .where(or(eq(users.phone, normalizedPhone), eq(users.email, emailFallback)))
        .limit(1)

      let targetUser = existingUsers[0]
      let isNewUser = false

      if (!targetUser) {
        isNewUser = true
        const [created] = await db
          .insert(users)
          .values({
            id: uuidv4(),
            email: emailFallback,
            phone: normalizedPhone,
            name: input.fullName?.trim() || 'Valued Shopper',
            role: 'user',
            isFirstOrder: true,
            welcomeCouponUsed: false,
          })
          .returning()
        targetUser = created
      } else if (input.fullName?.trim() && (!targetUser.name || targetUser.name === 'Valued Shopper')) {
        const [updated] = await db
          .update(users)
          .set({ name: input.fullName.trim(), updatedAt: new Date() })
          .where(eq(users.id, targetUser.id))
          .returning()
        targetUser = updated
      }

      // Establish session
      if (ctx.req.session) {
        ;(ctx.req as any).session.userId = targetUser.id
        ;(ctx.req as any).session.passport = { user: targetUser.id }
        if (typeof (ctx.req.session as any).save === 'function') {
          await new Promise<void>((resolve) => ctx.req.session.save(() => resolve()))
        }
      }

      return {
        success: true,
        user: {
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
          isFirstOrder: targetUser.isFirstOrder,
          welcomeCouponUsed: targetUser.welcomeCouponUsed,
        },
        isNewUser,
        isFirstOrder: targetUser.isFirstOrder,
        welcomeCoupon: 'WELCOME10',
      }
    }),

  // Claim or Auto-Apply Welcome Incentive Coupon
  claimWelcomeCoupon: protectedProcedure
    .mutation(async ({ ctx }) => {
      const [updated] = await db
        .update(users)
        .set({ welcomeCouponUsed: true, updatedAt: new Date() })
        .where(eq(users.id, ctx.user!.id))
        .returning()

      return {
        success: true,
        couponCode: 'WELCOME10',
        discountPercent: 10,
        user: updated,
      }
    }),

  // Guest-to-Account Silent Auto-Conversion upon Checkout
  guestAutoConvert: publicProcedure
    .input(z.object({
      phone: z.string().min(8),
      countryCode: z.string().default('+91'),
      email: z.string().email().optional(),
      fullName: z.string().min(1, 'Name is required'),
      streetAddress: z.string().min(3, 'Address is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      pincode: z.string().min(6, 'PIN code is required'),
    }))
    .mutation(async ({ ctx, input }) => {
      const normalizedPhone = normalizePhone(input.phone, input.countryCode)
      const cleanPhoneDigits = normalizedPhone.replace(/\D/g, '')
      const emailFallback = input.email || `${cleanPhoneDigits}@phone.sheaura.com`

      const existingUsers = await db
        .select()
        .from(users)
        .where(or(eq(users.phone, normalizedPhone), eq(users.email, emailFallback)))
        .limit(1)

      let targetUser = existingUsers[0]

      if (!targetUser) {
        const [created] = await db
          .insert(users)
          .values({
            id: uuidv4(),
            email: emailFallback,
            phone: normalizedPhone,
            name: input.fullName,
            deliveryAddress: input.streetAddress,
            city: input.city,
            state: input.state,
            pincode: input.pincode,
            role: 'user',
            isFirstOrder: true,
            welcomeCouponUsed: false,
          })
          .returning()
        targetUser = created
      } else {
        const [updated] = await db
          .update(users)
          .set({
            name: input.fullName || targetUser.name,
            deliveryAddress: input.streetAddress || targetUser.deliveryAddress,
            city: input.city || targetUser.city,
            state: input.state || targetUser.state,
            pincode: input.pincode || targetUser.pincode,
            updatedAt: new Date(),
          })
          .where(eq(users.id, targetUser.id))
          .returning()
        targetUser = updated
      }

      // Check if address already in address book
      const existingAddr = await db
        .select()
        .from(userAddresses)
        .where(
          and(
            eq(userAddresses.userId, targetUser.id),
            eq(userAddresses.pincode, input.pincode),
            eq(userAddresses.streetAddress, input.streetAddress)
          )
        )
        .limit(1)

      if (existingAddr.length === 0) {
        await db.insert(userAddresses).values({
          id: uuidv4(),
          userId: targetUser.id,
          label: 'home',
          fullName: input.fullName,
          phone: normalizedPhone,
          streetAddress: input.streetAddress,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          isDefault: true,
        })
      }

      // Log in session if not logged in
      if (ctx.req.session && !ctx.user) {
        ;(ctx.req as any).session.userId = targetUser.id
        ;(ctx.req as any).session.passport = { user: targetUser.id }
        if (typeof (ctx.req.session as any).save === 'function') {
          await new Promise<void>((resolve) => ctx.req.session.save(() => resolve()))
        }
      }

      return {
        success: true,
        userId: targetUser.id,
        isFirstOrder: targetUser.isFirstOrder,
        user: targetUser,
      }
    }),

  // Get Saved Addresses
  getAddresses: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, ctx.user.id))
      .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt))
  }),

  // Save or Update Address Card
  saveAddress: protectedProcedure
    .input(z.object({
      id: z.string().uuid().optional(),
      label: z.enum(['home', 'office', 'other']).default('home'),
      fullName: z.string().min(1, 'Full name is required'),
      phone: z.string().min(8, 'Phone number is required'),
      streetAddress: z.string().min(3, 'Street address is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      pincode: z.string().min(6, 'Valid 6-digit PIN code is required'),
      isDefault: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, isDefault, ...data } = input

      if (isDefault) {
        await db.update(userAddresses).set({ isDefault: false }).where(eq(userAddresses.userId, ctx.user.id))
      }

      if (id) {
        const [updated] = await db
          .update(userAddresses)
          .set({ ...data, isDefault: isDefault ?? false, updatedAt: new Date() })
          .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, ctx.user.id)))
          .returning()

        // Also update primary user address if default
        if (isDefault) {
          await db.update(users).set({
            name: data.fullName,
            phone: data.phone,
            deliveryAddress: data.streetAddress,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            updatedAt: new Date(),
          }).where(eq(users.id, ctx.user.id))
        }

        return updated
      } else {
        const existingCount = await db
          .select({ count: count() })
          .from(userAddresses)
          .where(eq(userAddresses.userId, ctx.user.id))

        const shouldBeDefault = isDefault || existingCount[0].count === 0

        const [created] = await db
          .insert(userAddresses)
          .values({
            id: uuidv4(),
            userId: ctx.user.id,
            ...data,
            isDefault: shouldBeDefault,
          })
          .returning()

        if (shouldBeDefault) {
          await db.update(users).set({
            name: data.fullName,
            phone: data.phone,
            deliveryAddress: data.streetAddress,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            updatedAt: new Date(),
          }).where(eq(users.id, ctx.user.id))
        }

        return created
      }
    }),

  // Delete Address Card
  deleteAddress: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(userAddresses).where(and(eq(userAddresses.id, input.id), eq(userAddresses.userId, ctx.user.id)))
      return { success: true }
    }),

  // Set Default Address
  setDefaultAddress: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db.update(userAddresses).set({ isDefault: false }).where(eq(userAddresses.userId, ctx.user.id))
      const [updated] = await db
        .update(userAddresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(and(eq(userAddresses.id, input.id), eq(userAddresses.userId, ctx.user.id)))
        .returning()

      if (updated) {
        await db.update(users).set({
          name: updated.fullName,
          phone: updated.phone,
          deliveryAddress: updated.streetAddress,
          city: updated.city,
          state: updated.state,
          pincode: updated.pincode,
          updatedAt: new Date(),
        }).where(eq(users.id, ctx.user.id))
      }

      return updated
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