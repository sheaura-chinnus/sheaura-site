import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL!

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
  console.warn('⚠️  Google OAuth credentials not configured. Google login will not work.')
}

import type { User } from '../db/schema.js'

passport.serializeUser((user: User, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1)
    done(null, user[0] || false)
  } catch (error) {
    done(error, false)
  }
})

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value
          if (!email) {
            return done(new Error('No email found in Google profile'), false)
          }

          const OWNER_EMAIL = 'sheaura360@gmail.com'
          const isOwner = email.toLowerCase() === OWNER_EMAIL.toLowerCase()

          // Check if user exists
          let user = await db.select().from(users).where(eq(users.email, email)).limit(1)

          if (user.length > 0) {
            // Update user with Google info and promote owner to admin if needed
            const existingUser = user[0]
            const updateFields: Partial<typeof users.$inferInsert> = {
              updatedAt: new Date(),
            }
            if (!existingUser.avatarUrl && profile.photos?.[0]?.value) {
              updateFields.avatarUrl = profile.photos[0].value
            }
            if (!existingUser.name && profile.displayName) {
              updateFields.name = profile.displayName
            }
            if (isOwner && existingUser.role !== 'admin') {
              updateFields.role = 'admin'
            }

            if (Object.keys(updateFields).length > 1) {
              await db.update(users)
                .set(updateFields)
                .where(eq(users.id, existingUser.id))
              user = await db.select().from(users).where(eq(users.id, existingUser.id)).limit(1)
            }
            return done(null, user[0])
          }

          // Create new user (Owner receives admin, all others receive user/customer)
          const newUser = await db.insert(users).values({
            id: uuidv4(),
            email,
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
            role: isOwner ? 'admin' : 'user',
          }).returning()

          return done(null, newUser[0])
        } catch (error) {
          return done(error as Error, false)
        }
      }
    )
  )
}

export { passport }