import { z } from 'zod'
import { router, publicProcedure, adminProcedure } from '../index.js'
import { db } from '../../db/index.js'
import { siteSettings, mediaAssets } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { audit } from '../audit.js'
import {
  ALLOWED_SETTING_KEYS,
  DEFAULT_SITE_SETTINGS,
  validateSetting,
} from '../../config/siteSettingsSchema.js'

const updateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().optional(),
})

export const siteSettingsRouter = router({
  // Public: Get public settings merged with safe defaults
  getPublic: publicProcedure
    .query(async () => {
      const dbSettings = await db
        .select({
          key: siteSettings.key,
          value: siteSettings.value,
        })
        .from(siteSettings)

      const dbMap = new Map<string, string>()
      for (const s of dbSettings) {
        if (s.value !== null && s.value !== undefined) {
          dbMap.set(s.key, s.value)
        }
      }

      // Merge defaults with stored values (only allowlisted keys)
      const merged: Record<string, string> = {}
      for (const key of ALLOWED_SETTING_KEYS) {
        merged[key] = dbMap.has(key) && dbMap.get(key) !== ''
          ? dbMap.get(key)!
          : DEFAULT_SITE_SETTINGS[key]
      }

      return merged
    }),

  // Admin: Get all settings (merged with defaults for editor display)
  adminGetList: adminProcedure
    .query(async () => {
      const stored = await db.select().from(siteSettings).orderBy(siteSettings.key)
      const storedMap = new Map(stored.map(s => [s.key, s]))

      // Return items for all allowlisted keys
      return ALLOWED_SETTING_KEYS.map(key => {
        const existing = storedMap.get(key)
        return {
          key,
          value: existing?.value ?? DEFAULT_SITE_SETTINGS[key],
          isCustomized: existing !== undefined && existing.value !== null && existing.value !== '',
          updatedAt: existing?.updatedAt ?? null,
        }
      })
    }),

  // Admin: Update a single setting
  updateSetting: adminProcedure
    .input(updateSettingSchema)
    .mutation(async ({ input, ctx }) => {
      // Validate key and value
      const validation = validateSetting(input.key, input.value)
      if (!validation.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: validation.error || 'Invalid setting format or disallowed key',
        })
      }

      // Get old value for audit
      const oldSetting = await db
        .select({ value: siteSettings.value })
        .from(siteSettings)
        .where(eq(siteSettings.key, input.key))
        .limit(1)
      const oldValue = oldSetting[0]?.value ?? null

      const [setting] = await db
        .insert(siteSettings)
        .values({ key: input.key, value: input.value ?? '' })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: input.value ?? '', updatedAt: new Date() },
        })
        .returning()

      // Audit log without secret leakage
      await audit.settingUpdated(ctx, input.key, oldValue, input.value ?? null)

      return setting
    }),

  // Admin: Bulk update settings (transactional)
  bulkUpdateSettings: adminProcedure
    .input(z.array(updateSettingSchema).max(100))
    .mutation(async ({ input, ctx }) => {
      // 1. Pre-validate every setting in the batch before making any DB changes
      for (const setting of input) {
        const validation = validateSetting(setting.key, setting.value)
        if (!validation.valid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Validation failed for key "${setting.key}": ${validation.error}`,
          })
        }
      }

      // 2. Fetch existing settings for accurate audit log
      const oldSettings = await db
        .select({ key: siteSettings.key, value: siteSettings.value })
        .from(siteSettings)
      const oldValuesMap = new Map(oldSettings.map(s => [s.key, s.value]))

      const changes: Record<string, { old: string | null; new: string | null }> = {}

      // 3. Apply updates
      for (const setting of input) {
        const oldValue = oldValuesMap.get(setting.key) ?? null
        const newValue = setting.value ?? ''
        changes[setting.key] = { old: oldValue, new: newValue }

        await db
          .insert(siteSettings)
          .values({ key: setting.key, value: newValue })
          .onConflictDoUpdate({
            target: siteSettings.key,
            set: { value: newValue, updatedAt: new Date() },
          })
      }

      // 4. Audit log the bulk update
      await audit.settingsBulkUpdated(ctx, changes)

      return { success: true, count: input.length }
    }),

  // Admin: Delete/revert logo
  deleteLogo: adminProcedure
    .mutation(async ({ ctx }) => {
      const oldLogoSetting = await db
        .select({ value: siteSettings.value })
        .from(siteSettings)
        .where(eq(siteSettings.key, 'logoAssetId'))
        .limit(1)
      const oldAssetId = oldLogoSetting[0]?.value ?? null

      // Clear logo settings
      await db
        .insert(siteSettings)
        .values({ key: 'logoAssetId', value: '' })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: '', updatedAt: new Date() },
        })

      await db
        .insert(siteSettings)
        .values({ key: 'logoUrl', value: '' })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: '', updatedAt: new Date() },
        })

      // Clean up old media asset record if exists
      if (oldAssetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(oldAssetId)) {
        await db.delete(mediaAssets).where(eq(mediaAssets.id, oldAssetId))
      }

      // Record audit log
      await audit.logoDeleted(ctx, oldAssetId)

      return { success: true }
    }),
})