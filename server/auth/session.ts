import passport from 'passport'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'

passport.serializeUser((user: any, done) => {
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

export { passport }