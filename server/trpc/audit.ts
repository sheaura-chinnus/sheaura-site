import { db } from '../db/index.js'
import { auditLogs, type NewAuditLog } from '../db/schema.js'
import type { TRPCContext } from './context.js'

export interface AuditLogInput {
  action: string
  entityType: string
  entityId?: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
}

export async function createAuditLog(
  ctx: TRPCContext,
  input: AuditLogInput
): Promise<void> {
  try {
    const userId = ctx.user?.id ?? null
    const ipAddress = ctx.req.ip ?? ctx.req.headers['x-forwarded-for'] as string | undefined
    const userAgent = ctx.req.headers['user-agent'] ?? undefined

    const isUuid = input.entityId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.entityId)
    const validEntityId = isUuid ? input.entityId : null
    const additionalMeta = !isUuid && input.entityId ? { targetKey: input.entityId } : {}

    const oldDataObj = input.oldData ? { ...input.oldData, ...additionalMeta } : (Object.keys(additionalMeta).length > 0 ? additionalMeta : null)
    const newDataObj = input.newData ? { ...input.newData, ...additionalMeta } : (Object.keys(additionalMeta).length > 0 ? additionalMeta : null)

    const logEntry: NewAuditLog = {
      userId,
      action: input.action,
      entityType: input.entityType,
      entityId: validEntityId,
      oldData: oldDataObj ? JSON.stringify(oldDataObj) : null,
      newData: newDataObj ? JSON.stringify(newDataObj) : null,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    }

    await db.insert(auditLogs).values(logEntry)
  } catch (error) {
    // Log audit failure but don't throw - audit logging should never break the main operation
    console.error('Failed to create audit log:', error)
  }
}

// Convenience functions for common audit actions
export const audit = {
  productCreated: (ctx: TRPCContext, productId: string, data: Record<string, unknown>) =>
    createAuditLog(ctx, {
      action: 'PRODUCT_CREATED',
      entityType: 'product',
      entityId: productId,
      newData: data,
    }),

  productUpdated: (ctx: TRPCContext, productId: string, oldData: Record<string, unknown>, newData: Record<string, unknown>) =>
    createAuditLog(ctx, {
      action: 'PRODUCT_UPDATED',
      entityType: 'product',
      entityId: productId,
      oldData,
      newData,
    }),

  productDeleted: (ctx: TRPCContext, productId: string, oldData: Record<string, unknown>) =>
    createAuditLog(ctx, {
      action: 'PRODUCT_DELETED',
      entityType: 'product',
      entityId: productId,
      oldData,
    }),

  productPublishToggled: (ctx: TRPCContext, productId: string, isPublished: boolean) =>
    createAuditLog(ctx, {
      action: isPublished ? 'PRODUCT_PUBLISHED' : 'PRODUCT_UNPUBLISHED',
      entityType: 'product',
      entityId: productId,
      newData: { isPublished },
    }),

  productFeaturedToggled: (ctx: TRPCContext, productId: string, isFeatured: boolean) =>
    createAuditLog(ctx, {
      action: isFeatured ? 'PRODUCT_FEATURED' : 'PRODUCT_UNFEATURED',
      entityType: 'product',
      entityId: productId,
      newData: { isFeatured },
    }),

  categoryCreated: (ctx: TRPCContext, categoryId: string, data: Record<string, unknown>) =>
    createAuditLog(ctx, {
      action: 'CATEGORY_CREATED',
      entityType: 'category',
      entityId: categoryId,
      newData: data,
    }),

  categoryUpdated: (ctx: TRPCContext, categoryId: string, oldData: Record<string, unknown>, newData: Record<string, unknown>) =>
    createAuditLog(ctx, {
      action: 'CATEGORY_UPDATED',
      entityType: 'category',
      entityId: categoryId,
      oldData,
      newData,
    }),

  categoryDeleted: (ctx: TRPCContext, categoryId: string, oldData: Record<string, unknown>) =>
    createAuditLog(ctx, {
      action: 'CATEGORY_DELETED',
      entityType: 'category',
      entityId: categoryId,
      oldData,
    }),

  categoryActiveToggled: (ctx: TRPCContext, categoryId: string, isActive: boolean) =>
    createAuditLog(ctx, {
      action: isActive ? 'CATEGORY_ACTIVATED' : 'CATEGORY_DEACTIVATED',
      entityType: 'category',
      entityId: categoryId,
      newData: { isActive },
    }),

  enquiryStatusUpdated: (ctx: TRPCContext, enquiryId: string, oldStatus: string, newStatus: string, adminNotes?: string) =>
    createAuditLog(ctx, {
      action: 'ENQUIRY_STATUS_UPDATED',
      entityType: 'enquiry',
      entityId: enquiryId,
      oldData: { status: oldStatus },
      newData: { status: newStatus, adminNotes },
    }),

  enquiryAssigned: (ctx: TRPCContext, enquiryId: string, assignedTo: string | null) =>
    createAuditLog(ctx, {
      action: assignedTo ? 'ENQUIRY_ASSIGNED' : 'ENQUIRY_UNASSIGNED',
      entityType: 'enquiry',
      entityId: enquiryId,
      newData: { assignedTo },
    }),

  enquiryDeleted: (ctx: TRPCContext, enquiryId: string, name?: string) =>
    createAuditLog(ctx, {
      action: 'ENQUIRY_DELETED',
      entityType: 'enquiry',
      entityId: enquiryId,
      oldData: { name },
    }),

  settingUpdated: (ctx: TRPCContext, key: string, oldValue: string | null, newValue: string | null) =>
    createAuditLog(ctx, {
      action: 'SETTING_UPDATED',
      entityType: 'site_setting',
      entityId: key,
      oldData: { value: oldValue },
      newData: { value: newValue },
    }),

  settingsBulkUpdated: (ctx: TRPCContext, changes: Record<string, { old: string | null; new: string | null }>) =>
    createAuditLog(ctx, {
      action: 'SETTINGS_BULK_UPDATED',
      entityType: 'site_setting',
      newData: changes,
    }),

  userRoleChanged: (ctx: TRPCContext, targetUserId: string, oldRole: string, newRole: string) =>
    createAuditLog(ctx, {
      action: 'USER_ROLE_CHANGED',
      entityType: 'user',
      entityId: targetUserId,
      oldData: { role: oldRole },
      newData: { role: newRole },
    }),

  imageAdded: (ctx: TRPCContext, productId: string, imageId: string, data: Record<string, unknown>) =>
    createAuditLog(ctx, {
      action: 'PRODUCT_IMAGE_ADDED',
      entityType: 'product_image',
      entityId: imageId,
      newData: { productId, ...data },
    }),

  imageUpdated: (ctx: TRPCContext, imageId: string, oldData: Record<string, unknown>, newData: Record<string, unknown>) =>
    createAuditLog(ctx, {
      action: 'PRODUCT_IMAGE_UPDATED',
      entityType: 'product_image',
      entityId: imageId,
      oldData,
      newData,
    }),

  imageDeleted: (ctx: TRPCContext, imageId: string, oldData: Record<string, unknown>) =>
    createAuditLog(ctx, {
      action: 'PRODUCT_IMAGE_DELETED',
      entityType: 'product_image',
      entityId: imageId,
      oldData,
    }),

  imagesReordered: (ctx: TRPCContext, productId: string, imageIds: string[]) =>
    createAuditLog(ctx, {
      action: 'PRODUCT_IMAGES_REORDERED',
      entityType: 'product_image',
      entityId: productId,
      newData: { imageIds },
    }),

  logoUploaded: (ctx: TRPCContext, mediaId: string, filename: string, mimeType: string, fileSize: number) =>
    createAuditLog(ctx, {
      action: 'LOGO_UPLOADED',
      entityType: 'media_asset',
      entityId: mediaId,
      newData: { filename, mimeType, fileSize },
    }),

  logoReplaced: (ctx: TRPCContext, newMediaId: string, oldMediaId: string | null, filename: string) =>
    createAuditLog(ctx, {
      action: 'LOGO_REPLACED',
      entityType: 'media_asset',
      entityId: newMediaId,
      oldData: oldMediaId ? { previousMediaId: oldMediaId } : undefined,
      newData: { filename },
    }),

  logoDeleted: (ctx: TRPCContext, mediaId: string | null) =>
    createAuditLog(ctx, {
      action: 'LOGO_DELETED',
      entityType: 'media_asset',
      entityId: mediaId ?? undefined,
    }),
}