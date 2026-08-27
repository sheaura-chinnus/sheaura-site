import { z } from 'zod'
import { router, publicProcedure, adminProcedure } from '../index.js'
import { db } from '../../db/index.js'
import { siteSettings } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
import { audit } from '../audit.js'

const updateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().optional(),
})

export const siteSettingsRouter = router({
  // Public: Get public settings
  getPublic: publicProcedure
    .query(async () => {
      const secretKeys = ['razorpayKeySecret', 'stripeSecretKey', 'googleClientSecret', 'facebookAppSecret', 'whWhatsAppToken']
      const settings = await db
        .select({
          key: siteSettings.key,
          value: siteSettings.value,
        })
        .from(siteSettings)

      return Object.fromEntries(
        settings
          .filter(s => !secretKeys.includes(s.key))
          .map(s => [s.key, s.value])
      )
    }),

  // Admin: Get all settings
  adminGetList: adminProcedure
    .query(async () => {
      return db.select().from(siteSettings).orderBy(siteSettings.key)
    }),

  // Admin: Update setting
  updateSetting: adminProcedure
    .input(updateSettingSchema)
    .mutation(async ({ input, ctx }) => {
      // Get old value for audit
      const oldSetting = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, input.key)).limit(1)
      const oldValue = oldSetting[0]?.value ?? null

      const [setting] = await db
        .insert(siteSettings)
        .values({ key: input.key, value: input.value })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: input.value, updatedAt: new Date() },
        })
        .returning()

      // Audit log
      await audit.settingUpdated(ctx, input.key, oldValue, input.value ?? null)

      return setting
    }),

  // Admin: Bulk update settings
  bulkUpdateSettings: adminProcedure
    .input(z.array(updateSettingSchema))
    .mutation(async ({ input, ctx }) => {
      // Get old values for audit
      const oldSettings = await db.select({ key: siteSettings.key, value: siteSettings.value }).from(siteSettings)
      const oldValuesMap = new Map(oldSettings.map(s => [s.key, s.value]))

      const changes: Record<string, { old: string | null; new: string | null }> = {}

      for (const setting of input) {
        const oldValue = oldValuesMap.get(setting.key) ?? null
        const newValue = setting.value ?? null
        changes[setting.key] = { old: oldValue, new: newValue }

        await db
          .insert(siteSettings)
          .values({ key: setting.key, value: setting.value })
          .onConflictDoUpdate({
            target: siteSettings.key,
            set: { value: setting.value, updatedAt: new Date() },
          })
      }

      // Audit log
      await audit.settingsBulkUpdated(ctx, changes)

      return { success: true }
    }),
})