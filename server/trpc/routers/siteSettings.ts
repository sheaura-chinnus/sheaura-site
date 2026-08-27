import { z } from 'zod'
import { publicProcedure, adminProcedure } from '../index.js'
import { db } from '../../db/index.js'
import { siteSettings } from '../../db/schema.js'
import { eq, or } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

const updateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().optional(),
})

export const siteSettingsRouter = {
  // Public: Get public settings
  getPublic: publicProcedure
    .query(async () => {
      const settings = await db
        .select({
          key: siteSettings.key,
          value: siteSettings.value,
        })
        .from(siteSettings)
        .where(
          or(
            eq(siteSettings.key, 'currency'),
            eq(siteSettings.key, 'country'),
            eq(siteSettings.key, 'phone'),
            eq(siteSettings.key, 'whatsapp'),
            eq(siteSettings.key, 'email'),
            eq(siteSettings.key, 'instagram'),
            eq(siteSettings.key, 'domain'),
            eq(siteSettings.key, 'depositPolicy'),
            eq(siteSettings.key, 'deliveryPolicy'),
            eq(siteSettings.key, 'heroTitle'),
            eq(siteSettings.key, 'heroSubtitle'),
          )
        )

      return Object.fromEntries(settings.map(s => [s.key, s.value]))
    }),

  // Admin: Get all settings
  adminGetList: adminProcedure
    .query(async () => {
      return db.select().from(siteSettings).orderBy(siteSettings.key)
    }),

  // Admin: Update setting
  updateSetting: adminProcedure
    .input(updateSettingSchema)
    .mutation(async ({ input }) => {
      const [setting] = await db
        .insert(siteSettings)
        .values({ key: input.key, value: input.value })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: input.value, updatedAt: new Date() },
        })
        .returning()

      return setting
    }),

  // Admin: Bulk update settings
  bulkUpdateSettings: adminProcedure
    .input(z.array(updateSettingSchema))
    .mutation(async ({ input }) => {
      for (const setting of input) {
        await db
          .insert(siteSettings)
          .values({ key: setting.key, value: setting.value })
          .onConflictDoUpdate({
            target: siteSettings.key,
            set: { value: setting.value, updatedAt: new Date() },
          })
      }
      return { success: true }
    }),
}