import { z } from 'zod'
import { publicProcedure, protectedProcedure, adminProcedure } from '../index.js'
import { db } from '../../db/index.js'
import { enquiries, enquiryItems, products, users, productImages } from '../../db/schema.js'
import { eq, desc, asc, count, and, or, ilike, sql, inArray } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

const createEnquirySchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional(),
  preferredContact: z.enum(['email', 'phone', 'whatsapp']).optional(),
  eventDate: z.date().optional(),
  returnDate: z.date().optional(),
  deliveryPickup: z.enum(['delivery', 'pickup']).optional(),
  message: z.string().max(2000).optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).default(1),
    mode: z.enum(['sale', 'rental']),
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

export const enquiriesRouter = {
  // Public: Create enquiry
  create: publicProcedure
    .input(createEnquirySchema)
    .mutation(async ({ input }) => {
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

        if (item.mode === 'sale' && !['sale', 'both'].includes(product.mode)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Product ${product.id} is not for sale` })
        }

        if (item.mode === 'rental' && !['rental', 'both'].includes(product.mode)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Product ${product.id} is not for rental` })
        }
      }

      // Calculate prices for items
      const itemsWithPrices = input.items.map(item => {
        const product = productData.find(p => p.id === item.productId)!
        const unitPrice = item.mode === 'sale' ? product.salePrice : product.rentalPrice
        return {
          ...item,
          unitPrice,
        }
      })

      // Create enquiry
      const [enquiry] = await db.insert(enquiries).values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        preferredContact: input.preferredContact,
        eventDate: input.eventDate,
        returnDate: input.returnDate,
        deliveryPickup: input.deliveryPickup,
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
  myEnquiries: protectedProcedure
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
            items: {
              id: enquiryItems.id,
              productId: enquiryItems.productId,
              quantity: enquiryItems.quantity,
              mode: enquiryItems.mode,
              unitPrice: enquiryItems.unitPrice,
              product: {
                id: products.id,
                name: products.name,
                slug: products.slug,
                mode: products.mode,
                salePrice: products.salePrice,
                rentalPrice: products.rentalPrice,
              },
            },
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
        if (row.items.id) {
          enquiryMap.get(row.id).items.push(row.items)
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

  // Admin: List all enquiries with filters
  adminList: adminProcedure
    .input(enquiryFilterSchema)
    .query(async ({ input }) => {
      const { status, search, dateFrom, dateTo, page, limit, sortBy } = input
      const offset = (page - 1) * limit

      const conditions = []

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

  // Admin: Get enquiry details with items
  adminGet: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
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
          product: {
            id: products.id,
            name: products.name,
            slug: products.slug,
            mode: products.mode,
            salePrice: products.salePrice,
            rentalPrice: products.rentalPrice,
            images: {
              url: productImages.url,
              altText: productImages.altText,
            },
          },
        })
        .from(enquiryItems)
        .leftJoin(products, eq(enquiryItems.productId, products.id))
        .leftJoin(
          productImages,
          and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true))
        )
        .where(eq(enquiryItems.enquiryId, input.id))

      return {
        ...enquiry[0],
        items,
      }
    }),

  // Admin: Update enquiry status
  updateStatus: adminProcedure
    .input(updateEnquiryStatusSchema)
    .mutation(async ({ input }) => {
      const { id, status, adminNotes } = input

      const [enquiry] = await db
        .update(enquiries)
        .set({ status, adminNotes, updatedAt: new Date() })
        .where(eq(enquiries.id, id))
        .returning()

      if (!enquiry) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Enquiry not found' })
      }

      return enquiry
    }),

  // Admin: Get dashboard stats
  stats: adminProcedure
    .query(async () => {
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
        db.select({ count: count() }).from(enquiries).where(eq(enquiries.status, 'new')),
        db.select({ count: count() }).from(enquiries).where(inArray(enquiries.status, ['new', 'contacted', 'reserved'])),
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
}