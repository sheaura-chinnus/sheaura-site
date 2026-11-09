import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq, or } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

const clientID = process.env.GOOGLE_CLIENT_ID
const clientSecret = process.env.GOOGLE_CLIENT_SECRET
const callbackURL = process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'

if (clientID && clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase().trim()
          if (!email) {
            return done(new Error('No email found in Google profile'), undefined)
          }

          const name = profile.displayName || profile.name?.givenName || 'Valued Shopper'
          const avatarUrl = profile.photos?.[0]?.value || null
          const googleId = profile.id

          // Locate existing user by email or googleId
          const existingUsers = await db
            .select()
            .from(users)
            .where(or(eq(users.email, email), eq(users.googleId, googleId)))
            .limit(1)

          let targetUser = existingUsers[0]

          if (targetUser) {
            // Update googleId, avatarUrl, or name if missing
            const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() }
            if (!targetUser.googleId) updates.googleId = googleId
            if (!targetUser.avatarUrl && avatarUrl) updates.avatarUrl = avatarUrl
            if (!targetUser.name && name) updates.name = name

            const [updated] = await db
              .update(users)
              .set(updates)
              .where(eq(users.id, targetUser.id))
              .returning()
            targetUser = updated
          } else {
            // Create user with a generated salt and password hash
            const salt = crypto.randomBytes(16).toString('hex')
            const randomPassword = crypto.randomBytes(32).toString('hex')
            const hash = crypto.pbkdf2Sync(randomPassword, salt, 10000, 64, 'sha512').toString('hex')
            const storedHash = `${salt}:${hash}`

            const [created] = await db
              .insert(users)
              .values({
                id: uuidv4(),
                email,
                name,
                avatarUrl,
                googleId,
                passwordHash: storedHash,
                role: 'user',
                isFirstOrder: true,
                welcomeCouponUsed: false,
              })
              .returning()
            targetUser = created
          }

          return done(null, targetUser)
        } catch (err) {
          return done(err as Error, undefined)
        }
      }
    )
  )
} else {
  console.warn('⚠️ Warning: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Google OAuth strategy not initialized.')
}

export { passport }
