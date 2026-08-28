import { z } from 'zod'
import { router, publicProcedure, protectedProcedure, shopOrderReceiverProcedure, adminProcedure } from '../index.js'
import { db } from '../../db/index.js'
import { enquiries, enquiryItems, products, users, productImages } from '../../db/schema.js'
import { eq, desc, asc, count, and, or, ilike, sql, inArray } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { audit } from '../audit.js'

// Helper function to check if user can access an enquiry
async function canAccessEnquiry(ctx: { user: { id: string; role: string } }, enquiryId: string): Promise<boolean> {
  const user = ctx.user

  // Admins can access all enquiries
  if (user.role === 'admin') {
    return true
  }

  // Shop order receivers can only access enquiries assigned to them
  if (user.role === 'shop_order_receiver') {
    const enquiry = await db
      .select({ assignedTo: enquiries.assignedTo })
      .from(enquiries)
      .where(eq(enquiries.id, enquiryId))
      .limit(1)

    return enquiry.length > 0 && enquiry[0].assignedTo === user.id
  }

  return false
}

const createEnquirySchema = z.object({
  name: z.string().min(1).max(255).default('Guest Shopper'),
  email: z.string().email().max(255).optional().or(z.literal('')).default('guest@sheaura.com'),
  phone: z.string().max(50).optional(),
  preferredContact: z.enum(['email', 'phone', 'whatsapp']).default('whatsapp'),
  eventDate: z.date().optional(),
  returnDate: z.date().optional(),
  deliveryPickup: z.enum(['delivery', 'pickup']).optional(),
  shippingAddress: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(20).optional(),
  paymentMethod: z.string().max(50).optional().default('whatsapp'),
  paymentStatus: z.string().max(50).optional().default('pending'),
  prepaidDiscount: z.number().optional().default(0),
  message: z.string().max(2000).optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).default(1),
    mode: z.enum(['sale', 'rental']).default('sale'),
  })).min(1),
})

const updateEnquiryStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['new', 'contacted', 'reserved', 'fulfilled', 'cancelled', 'rejected']),
  adminNotes: z.string().max(2000).optional(),
})

const enquiryFilterSchema = z.object({
  status: z.enum(['new', 'contacted', 'reserved', 'fulfilled', 'cancelled', 'rejected']).optional(),
  search: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['newest', 'oldest']).default('newest'),
})

const assignEnquirySchema = z.object({
  id: z.string().uuid(),
  assignedTo: z.string().uuid().nullable(), // null to unassign
})

export const enquiriesRouter = router({
  // Customer: Get My Orders & Order Tracking
  getMyOrders: protectedProcedure
    .query(async ({ ctx }) => {
      const user = ctx.user!

      const userEnquiries = await db
        .select()
        .from(enquiries)
        .where(
          or(
            eq(enquiries.userId, user.id),
            eq(enquiries.email, user.email)
          )
        )
        .orderBy(desc(enquiries.createdAt))

      if (userEnquiries.length === 0) {
        return []
      }

      const enquiryIds = userEnquiries.map(e => e.id)

      const items = await db
        .select({
          id: enquiryItems.id,
          enquiryId: enquiryItems.enquiryId,
          productId: enquiryItems.productId,
          productName: products.name,
          productSlug: products.slug,
          itemCode: products.itemCode,
          quantity: enquiryItems.quantity,
          unitPrice: enquiryItems.unitPrice,
          mode: enquiryItems.mode,
        })
        .from(enquiryItems)
        .innerJoin(products, eq(enquiryItems.productId, products.id))
        .where(inArray(enquiryItems.enquiryId, enquiryIds))

      const itemProductIds = Array.from(new Set(items.map(i => i.productId)))
      const images = itemProductIds.length > 0 ? await db
        .select({
          productId: productImages.productId,
          url: productImages.url,
          altText: productImages.altText,
        })
        .from(productImages)
        .where(
          and(
            inArray(productImages.productId, itemProductIds),
            eq(productImages.isPrimary, true)
          )
        ) : []

      const imageMap = new Map(images.map(img => [img.productId, img.url]))

      return userEnquiries.map(enq => ({
        ...enq,
        items: items
          .filter(i => i.enquiryId === enq.id)
          .map(i => ({
            ...i,
            imageUrl: imageMap.get(i.productId) || null,
          })),
      }))
    }),

  // Public & Customer: Create order / enquiry
  createEnquiry: publicProcedure
    .input(createEnquirySchema)
    .mutation(async ({ ctx, input }) => {
      // Validate all products exist and are published/available
      const productIds = input.items.map(i => i.productId)
      const productData = await db
        .select({
          id: products.id,
          mode: products.mode,
          salePrice: products.salePrice,
          rentalPrice: products.rentalPrice,
          availability: products.availability,
          isPublished: products.isPublished,
        })
        .from(products)
        .where(inArray(products.id, productIds))

      if (productData.length !== productIds.length) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'One or more products not found' })
      }

      // Check each item
      for (const item of input.items) {
        const product = productData.find(p => p.id === item.productId)
        if (!product) continue

        if (!product.isPublished) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Product ${product.id} is not published` })
        }

        if (product.availability !== 'available' && product.availability !== 'low_stock') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Product ${product.id} is not available` })
        }
      }

      // Calculate prices for items
      const itemsWithPrices = input.items.map(item => {
        const product = productData.find(p => p.id === item.productId)!
        const unitPrice = (item.mode === 'sale' ? product.salePrice : product.rentalPrice) || product.salePrice || product.rentalPrice || '0'
        return {
          ...item,
          unitPrice,
        }
      })

      // Create enquiry with associated userId if authenticated
      const [enquiry] = await db.insert(enquiries).values({
        userId: ctx.user?.id || null,
        name: input.name,
        email: input.email,
        phone: input.phone,
        preferredContact: input.preferredContact,
        eventDate: input.eventDate,
        returnDate: input.returnDate,
        deliveryPickup: input.deliveryPickup,
        shippingAddress: input.shippingAddress,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentStatus,
        prepaidDiscount: input.prepaidDiscount ? input.prepaidDiscount.toString() : '0.00',
        message: input.message,
        status: 'new',
      }).returning()

      // Create enquiry items
      await db.insert(enquiryItems).values(
        itemsWithPrices.map(item => ({
          enquiryId: enquiry.id,
          productId: item.productId,
          quantity: item.quantity,
          mode: item.mode,
          unitPrice: item.unitPrice,
        }))
      )

      return { success: true, enquiryId: enquiry.id }
    }),

  // Protected: Get user's enquiries
  getMyEnquiries: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input, ctx }) => {
      const { page, limit } = input
      const offset = (page - 1) * limit

      const [items, totalResult] = await Promise.all([
        db
          .select({
            id: enquiries.id,
            name: enquiries.name,
            email: enquiries.email,
            status: enquiries.status,
            eventDate: enquiries.eventDate,
            returnDate: enquiries.returnDate,
            deliveryPickup: enquiries.deliveryPickup,
            createdAt: enquiries.createdAt,
            itemId: enquiryItems.id,
            itemProductId: enquiryItems.productId,
            itemQuantity: enquiryItems.quantity,
            itemMode: enquiryItems.mode,
            itemUnitPrice: enquiryItems.unitPrice,
            productId: products.id,
            productName: products.name,
            productSlug: products.slug,
            productMode: products.mode,
            productSalePrice: products.salePrice,
            productRentalPrice: products.rentalPrice,
          })
          .from(enquiries)
          .leftJoin(enquiryItems, eq(enquiryItems.enquiryId, enquiries.id))
          .leftJoin(products, eq(enquiryItems.productId, products.id))
          .where(eq(enquiries.userId, ctx.user.id))
          .orderBy(desc(enquiries.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(enquiries).where(eq(enquiries.userId, ctx.user.id)),
      ])

      // Group items by enquiry
      const enquiryMap = new Map()
      for (const row of items) {
        if (!enquiryMap.has(row.id)) {
          enquiryMap.set(row.id, {
            id: row.id,
            name: row.name,
            email: row.email,
            status: row.status,
            eventDate: row.eventDate,
            returnDate: row.returnDate,
            deliveryPickup: row.deliveryPickup,
            createdAt: row.createdAt,
            items: [],
          })
        }
        if (row.itemId) {
          enquiryMap.get(row.id).items.push({
            id: row.itemId,
            productId: row.itemProductId,
            quantity: row.itemQuantity,
            mode: row.itemMode,
            unitPrice: row.itemUnitPrice,
            product: {
              id: row.productId,
              name: row.productName,
              slug: row.productSlug,
              mode: row.productMode,
              salePrice: row.productSalePrice,
              rentalPrice: row.productRentalPrice,
            },
          })
        }
      }

      return {
        items: Array.from(enquiryMap.values()),
        total: totalResult[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalResult[0].count / limit),
      }
    }),

  // Admin/Shop Order Receiver: List all enquiries with filters
  adminGetList: shopOrderReceiverProcedure
    .input(enquiryFilterSchema)
    .query(async ({ input, ctx }) => {
      const { status, search, dateFrom, dateTo, page, limit, sortBy } = input
      const offset = (page - 1) * limit

      const conditions = []

      // Shop order receivers only see enquiries assigned to them
      if (ctx.user.role === 'shop_order_receiver') {
        conditions.push(eq(enquiries.assignedTo, ctx.user.id))
      }

      if (status) {
        conditions.push(eq(enquiries.status, status))
      }

      if (search) {
        conditions.push(
          or(
            ilike(enquiries.name, `%${search}%`),
            ilike(enquiries.email, `%${search}%`),
            ilike(enquiries.phone, `%${search}%`)
          )!
        )
      }

      if (dateFrom) {
        conditions.push(sql`${enquiries.createdAt} >= ${dateFrom}`)
      }

      if (dateTo) {
        conditions.push(sql`${enquiries.createdAt} <= ${dateTo}`)
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const orderBy = sortBy === 'oldest' ? asc(enquiries.createdAt) : desc(enquiries.createdAt)

      const [items, totalResult] = await Promise.all([
        db
          .select({
            id: enquiries.id,
            userId: enquiries.userId,
            name: enquiries.name,
            email: enquiries.email,
            phone: enquiries.phone,
            preferredContact: enquiries.preferredContact,
            eventDate: enquiries.eventDate,
            returnDate: enquiries.returnDate,
            deliveryPickup: enquiries.deliveryPickup,
            message: enquiries.message,
            status: enquiries.status,
            adminNotes: enquiries.adminNotes,
            createdAt: enquiries.createdAt,
            updatedAt: enquiries.updatedAt,
            user: {
              id: users.id,
              name: users.name,
              email: users.email,
            },
          })
          .from(enquiries)
          .leftJoin(users, eq(enquiries.userId, users.id))
          .where(whereClause)
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(enquiries).where(whereClause),
      ])

      return {
        items,
        total: totalResult[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalResult[0].count / limit),
      }
    }),

  // Admin/Shop Order Receiver: Get enquiry details with items
  adminGetById: shopOrderReceiverProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // IDOR check
      const hasAccess = await canAccessEnquiry(ctx, input.id)
      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to access this enquiry' })
      }

      const enquiry = await db
        .select({
          id: enquiries.id,
          userId: enquiries.userId,
          name: enquiries.name,
          email: enquiries.email,
          phone: enquiries.phone,
          preferredContact: enquiries.preferredContact,
          eventDate: enquiries.eventDate,
          returnDate: enquiries.returnDate,
          deliveryPickup: enquiries.deliveryPickup,
          message: enquiries.message,
          status: enquiries.status,
          adminNotes: enquiries.adminNotes,
          createdAt: enquiries.createdAt,
          updatedAt: enquiries.updatedAt,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(enquiries)
        .leftJoin(users, eq(enquiries.userId, users.id))
        .where(eq(enquiries.id, input.id))
        .limit(1)

      if (enquiry.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Enquiry not found' })
      }

      const items = await db
        .select({
          id: enquiryItems.id,
          productId: enquiryItems.productId,
          quantity: enquiryItems.quantity,
          mode: enquiryItems.mode,
          unitPrice: enquiryItems.unitPrice,
          productId2: products.id,
          productItemCode: products.itemCode,
          productName: products.name,
          productSlug: products.slug,
          productMode: products.mode,
          productSalePrice: products.salePrice,
          productRentalPrice: products.rentalPrice,
          productStockQuantity: products.stockQuantity,
          productAvailability: products.availability,
          imageUrl: productImages.url,
          imageAltText: productImages.altText,
        })
        .from(enquiryItems)
        .leftJoin(products, eq(enquiryItems.productId, products.id))
        .leftJoin(
          productImages,
          and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true))
        )
        .where(eq(enquiryItems.enquiryId, input.id))

      // Transform items to match expected structure
      const transformedItems = items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        mode: item.mode,
        unitPrice: item.unitPrice,
        product: {
          id: item.productId2,
          itemCode: item.productItemCode,
          name: item.productName,
          slug: item.productSlug,
          mode: item.productMode,
          salePrice: item.productSalePrice,
          rentalPrice: item.productRentalPrice,
          stockQuantity: item.productStockQuantity ?? 0,
          availability: item.productAvailability ?? 'available',
          images: item.imageUrl ? [{
            url: item.imageUrl,
            altText: item.imageAltText,
          }] : [],
        },
      }))

      return {
        ...enquiry[0],
        items: transformedItems,
      }
    }),

  // Admin/Shop Order Receiver: Update enquiry status (auto syncs product availability when sent to rental)
  updateEnquiryStatus: shopOrderReceiverProcedure
    .input(updateEnquiryStatusSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, status, adminNotes } = input

      // IDOR check
      const hasAccess = await canAccessEnquiry(ctx, id)
      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to update this enquiry' })
      }

      // Get old status for audit
      const oldEnquiry = await db.select({ status: enquiries.status, adminNotes: enquiries.adminNotes }).from(enquiries).where(eq(enquiries.id, id)).limit(1)
      const oldStatus = oldEnquiry[0]?.status

      const [enquiry] = await db
        .update(enquiries)
        .set({ status, adminNotes, updatedAt: new Date() })
        .where(eq(enquiries.id, id))
        .returning()

      if (!enquiry) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Enquiry not found' })
      }

      // Auto-update availability for rental items
      const isSendingToRental = status === 'reserved' || status === 'fulfilled'
      const isReleasingRental = (oldStatus === 'reserved' || oldStatus === 'fulfilled') && (status === 'cancelled' || status === 'rejected')

      if (isSendingToRental || isReleasingRental) {
        const enqItems = await db
          .select({ productId: enquiryItems.productId })
          .from(enquiryItems)
          .where(eq(enquiryItems.enquiryId, id))

        const targetProductIds = enqItems.map(i => i.productId).filter(Boolean) as string[]

        if (targetProductIds.length > 0) {
          const newAvailability = isSendingToRental ? 'out_of_stock' : 'available'
          await db
            .update(products)
            .set({ availability: newAvailability, updatedAt: new Date() })
            .where(inArray(products.id, targetProductIds))

          for (const pid of targetProductIds) {
            await audit.productUpdated(ctx, pid, {}, { availability: newAvailability, reason: `Enquiry ${id} status set to ${status}` })
          }
        }
      }

      // Audit log
      await audit.enquiryStatusUpdated(ctx, id, oldStatus, status, adminNotes)

      return enquiry
    }),

  // Admin/Shop Order Receiver: Explicitly mark all items in an enquiry Out of Stock
  markItemsOutOfStock: shopOrderReceiverProcedure
    .input(z.object({ enquiryId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await canAccessEnquiry(ctx, input.enquiryId)
      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to manage this enquiry' })
      }

      const enqItems = await db
        .select({ productId: enquiryItems.productId })
        .from(enquiryItems)
        .where(eq(enquiryItems.enquiryId, input.enquiryId))

      const targetProductIds = enqItems.map(i => i.productId).filter(Boolean) as string[]
      if (targetProductIds.length > 0) {
        await db
          .update(products)
          .set({ availability: 'out_of_stock', updatedAt: new Date() })
          .where(inArray(products.id, targetProductIds))

        for (const pid of targetProductIds) {
          await audit.productUpdated(ctx, pid, {}, { availability: 'out_of_stock', reason: `Manual admin override from enquiry ${input.enquiryId}` })
        }
      }

      return { count: targetProductIds.length }
    }),

  // Admin/Shop Order Receiver: Explicitly mark all items in an enquiry Available (Returned)
  markItemsAvailable: shopOrderReceiverProcedure
    .input(z.object({ enquiryId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const hasAccess = await canAccessEnquiry(ctx, input.enquiryId)
      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to manage this enquiry' })
      }

      const enqItems = await db
        .select({ productId: enquiryItems.productId })
        .from(enquiryItems)
        .where(eq(enquiryItems.enquiryId, input.enquiryId))

      const targetProductIds = enqItems.map(i => i.productId).filter(Boolean) as string[]
      if (targetProductIds.length > 0) {
        await db
          .update(products)
          .set({ availability: 'available', updatedAt: new Date() })
          .where(inArray(products.id, targetProductIds))

        for (const pid of targetProductIds) {
          await audit.productUpdated(ctx, pid, {}, { availability: 'available', reason: `Manual admin override from enquiry ${input.enquiryId}` })
        }
      }

      return { count: targetProductIds.length }
    }),

  // Admin: Assign enquiry to shop order receiver
  assignEnquiry: adminProcedure
    .input(assignEnquirySchema)
    .mutation(async ({ input, ctx }) => {
      const { id, assignedTo } = input

      const [enquiry] = await db
        .update(enquiries)
        .set({ assignedTo, updatedAt: new Date() })
        .where(eq(enquiries.id, id))
        .returning()

      if (!enquiry) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Enquiry not found' })
      }

      // Audit log
      await audit.enquiryAssigned(ctx, id, assignedTo)

      return enquiry
    }),

  // Admin/Shop Order Receiver: Get dashboard stats
  getStats: shopOrderReceiverProcedure
    .query(async ({ ctx }) => {
      const whereClause = ctx.user.role === 'shop_order_receiver' ? eq(enquiries.assignedTo, ctx.user.id) : undefined

      const [
        totalProducts,
        publishedProducts,
        featuredProducts,
        newEnquiries,
        activeEnquiries,
        lowStockProducts,
      ] = await Promise.all([
        db.select({ count: count() }).from(products),
        db.select({ count: count() }).from(products).where(eq(products.isPublished, true)),
        db.select({ count: count() }).from(products).where(and(eq(products.isPublished, true), eq(products.isFeatured, true))),
        db.select({ count: count() }).from(enquiries).where(and(whereClause, eq(enquiries.status, 'new'))),
        db.select({ count: count() }).from(enquiries).where(and(whereClause, inArray(enquiries.status, ['new', 'contacted', 'reserved']))),
        db.select({ count: count() }).from(products).where(inArray(products.availability, ['low_stock', 'out_of_stock'])),
      ])

      return {
        totalProducts: totalProducts[0].count,
        publishedProducts: publishedProducts[0].count,
        featuredProducts: featuredProducts[0].count,
        newEnquiries: newEnquiries[0].count,
        activeEnquiries: activeEnquiries[0].count,
        lowStockProducts: lowStockProducts[0].count,
      }
    }),

  // Admin: Delete an enquiry
  deleteEnquiry: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await db.delete(enquiryItems).where(eq(enquiryItems.enquiryId, input.id))
      const [deleted] = await db.delete(enquiries).where(eq(enquiries.id, input.id)).returning()

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Enquiry not found' })
      }

      await audit.enquiryDeleted(ctx, input.id, deleted.name)
      return { success: true, id: input.id }
    }),

  // Admin: Bulk delete enquiries
  bulkDeleteEnquiries: adminProcedure
    .input(z.object({ ids: z.array(z.string().uuid()) }))
    .mutation(async ({ input, ctx }) => {
      if (!input.ids.length) return { success: true, count: 0 }

      await db.delete(enquiryItems).where(inArray(enquiryItems.enquiryId, input.ids))
      const deleted = await db.delete(enquiries).where(inArray(enquiries.id, input.ids)).returning()

      for (const item of deleted) {
        await audit.enquiryDeleted(ctx, item.id, item.name)
      }

      return { success: true, count: deleted.length }
    }),

  // Admin: Clear fake or automated test enquiries
  clearTestEnquiries: adminProcedure
    .mutation(async ({ ctx }) => {
      const testEnquiries = await db
        .select({ id: enquiries.id, name: enquiries.name })
        .from(enquiries)
        .where(
          or(
            ilike(enquiries.email, '%example.com%'),
            ilike(enquiries.name, '%Valid Customer%'),
            ilike(enquiries.name, '%Priya Guest%'),
            ilike(enquiries.name, '%Test User%')
          )
        )

      const ids = testEnquiries.map(e => e.id)
      if (!ids.length) return { success: true, count: 0 }

      await db.delete(enquiryItems).where(inArray(enquiryItems.enquiryId, ids))
      const deleted = await db.delete(enquiries).where(inArray(enquiries.id, ids)).returning()

      for (const item of deleted) {
        await audit.enquiryDeleted(ctx, item.id, item.name)
      }

      return { success: true, count: deleted.length }
    }),
})