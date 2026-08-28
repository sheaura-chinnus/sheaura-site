import { z } from 'zod'
import { router, publicProcedure, adminProcedure } from '../index.js'
import { db, checkHasItemCodeColumn } from '../../db/index.js'
import { products, productImages, categories, enquiryItems } from '../../db/schema.js'
import { eq, and, or, ilike, desc, asc, count, sql, inArray } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { audit } from '../audit.js'

const productFilterSchema = z.object({
  category: z.string().optional(),
  mode: z.preprocess((v) => (v === '' ? undefined : v), z.enum(['sale', 'rental', 'both']).optional()),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  availability: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.enum(['available', 'low_stock', 'out_of_stock', 'discontinued']).optional()
  ),
  featured: z.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['featured', 'newest', 'price_asc', 'price_desc']).default('featured'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(12),
}).optional().default({})

const createProductSchema = z.object({
  itemCode: z.string().min(2).max(50).regex(/^[A-Za-z0-9-_]+$/, 'Item code must contain only letters, numbers, hyphens, or underscores').optional(),
  name: z.string().min(1).max(255),
  slug: z.string().max(255).optional(),
  categoryId: z.string().uuid(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  tags: z.array(z.string()).default([]),
  mode: z.enum(['sale', 'rental', 'both']).default('rental'),
  salePrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(), // decimal as string
  rentalPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  rentalDurationDays: z.number().int().positive().optional(),
  depositAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  stockQuantity: z.number().int().min(0).default(0),
  availability: z.enum(['available', 'low_stock', 'out_of_stock', 'discontinued']).default('available'),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  careInstructions: z.string().optional(),
})

const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid(),
})

async function getItemCodeSql() {
  const hasCol = await checkHasItemCodeColumn()
  return hasCol
    ? sql<string>`coalesce(${products.itemCode}, 'SH-' || upper(substring(replace(${products.id}::text, '-', ''), 1, 6)))`
    : sql<string>`'SH-' || upper(substring(replace(${products.id}::text, '-', ''), 1, 6))`
}

function serverSlugify(text: string): string {
  if (!text) return ''
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const productsRouter = router({
  // Public: Get all products with filters
  getList: publicProcedure
    .input(productFilterSchema)
    .query(async ({ input }) => {
      const { category, mode, minPrice, maxPrice, availability, featured, search, sortBy, page, limit } = input
      const offset = (page - 1) * limit

      const conditions = [
        eq(products.isPublished, true),
        eq(products.availability, 'available'),
      ]

      if (category) {
        const cat = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, category)).limit(1)
        if (cat.length > 0) {
          conditions.push(eq(products.categoryId, cat[0].id))
        }
      }

      if (mode) {
        conditions.push(
          or(
            eq(products.mode, mode),
            eq(products.mode, 'both')
          )!
        )
      }

      if (minPrice !== undefined) {
        conditions.push(
          or(
            and(eq(products.mode, 'sale'), sql`${products.salePrice} >= ${minPrice}`),
            and(eq(products.mode, 'rental'), sql`${products.rentalPrice} >= ${minPrice}`),
            and(eq(products.mode, 'both'), sql`${products.salePrice} >= ${minPrice}`),
            and(eq(products.mode, 'both'), sql`${products.rentalPrice} >= ${minPrice}`)
          )!
        )
      }

      if (maxPrice !== undefined) {
        conditions.push(
          or(
            and(eq(products.mode, 'sale'), sql`${products.salePrice} <= ${maxPrice}`),
            and(eq(products.mode, 'rental'), sql`${products.rentalPrice} <= ${maxPrice}`),
            and(eq(products.mode, 'both'), sql`${products.salePrice} <= ${maxPrice}`),
            and(eq(products.mode, 'both'), sql`${products.rentalPrice} <= ${maxPrice}`)
          )!
        )
      }

      if (availability) {
        conditions.push(eq(products.availability, availability))
      }

      if (featured !== undefined) {
        conditions.push(eq(products.isFeatured, featured))
      }

      // Fix: change featured to getFeatured for consistency with schema

      if (search) {
        conditions.push(
          or(
            ilike(products.name, `%${search}%`),
            ilike(products.description, `%${search}%`),
            ilike(products.shortDescription, `%${search}%`)
          )!
        )
      }

      const whereClause = and(...conditions)

      // Sorting
      let orderBy: ReturnType<typeof asc> | ReturnType<typeof desc> | ReturnType<typeof sql>
      switch (sortBy) {
        case 'newest':
          orderBy = desc(products.createdAt)
          break
        case 'price_asc':
          orderBy = asc(sql`coalesce(${products.salePrice}, ${products.rentalPrice})`)
          break
        case 'price_desc':
          orderBy = desc(sql`coalesce(${products.salePrice}, ${products.rentalPrice})`)
          break
        case 'featured':
        default:
          // Use a single orderBy with CASE for featured sorting
          orderBy = sql`${products.isFeatured} desc, ${products.createdAt} desc`
          break
      }

      const itemCodeSql = await getItemCodeSql()

      const [items, totalResult] = await Promise.all([
        db
          .select({
            id: products.id,
            itemCode: itemCodeSql,
            name: products.name,
            slug: products.slug,
            categoryId: products.categoryId,
            shortDescription: products.shortDescription,
            tags: products.tags,
            mode: products.mode,
            salePrice: products.salePrice,
            rentalPrice: products.rentalPrice,
            rentalDurationDays: products.rentalDurationDays,
            depositAmount: products.depositAmount,
            availability: products.availability,
            isFeatured: products.isFeatured,
            createdAt: products.createdAt,
            category: {
              id: categories.id,
              name: categories.name,
              slug: categories.slug,
            },
            primaryImage: {
              url: productImages.url,
              altText: productImages.altText,
            },
          })
          .from(products)
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .leftJoin(
            productImages,
            and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true))
          )
          .where(whereClause)
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(products).where(whereClause),
      ])

      return {
        items,
        total: totalResult[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalResult[0].count / limit),
      }
    }),

  // Public: Get featured products
  getFeatured: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(8), categoryId: z.string().uuid().optional() }))
    .query(async ({ input }) => {
      const itemCodeSql = await getItemCodeSql()
      const conditions = [
        eq(products.isPublished, true),
        eq(products.isFeatured, true),
        eq(products.availability, 'available'),
      ]
      if (input.categoryId) {
        conditions.push(eq(products.categoryId, input.categoryId))
      }

      const items = await db
        .select({
          id: products.id,
          itemCode: itemCodeSql,
          name: products.name,
          slug: products.slug,
          shortDescription: products.shortDescription,
          tags: products.tags,
          mode: products.mode,
          salePrice: products.salePrice,
          rentalPrice: products.rentalPrice,
          rentalDurationDays: products.rentalDurationDays,
          depositAmount: products.depositAmount,
          category: {
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          },
          primaryImage: {
            url: productImages.url,
            altText: productImages.altText,
          },
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(
          productImages,
          and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true))
        )
        .where(and(...conditions))
        .orderBy(desc(products.createdAt))
        .limit(input.limit)

      return items
    }),

  // Public: Get product by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const itemCodeSql = await getItemCodeSql()
      const product = await db
        .select({
          id: products.id,
          itemCode: itemCodeSql,
          name: products.name,
          slug: products.slug,
          categoryId: products.categoryId,
          description: products.description,
          shortDescription: products.shortDescription,
          tags: products.tags,
          mode: products.mode,
          salePrice: products.salePrice,
          rentalPrice: products.rentalPrice,
          rentalDurationDays: products.rentalDurationDays,
          depositAmount: products.depositAmount,
          stockQuantity: products.stockQuantity,
          availability: products.availability,
          isFeatured: products.isFeatured,
          careInstructions: products.careInstructions,
          createdAt: products.createdAt,
          category: {
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          },
          images: {
            id: productImages.id,
            url: productImages.url,
            altText: productImages.altText,
            displayOrder: productImages.displayOrder,
            isPrimary: productImages.isPrimary,
          },
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(productImages, eq(productImages.productId, products.id))
        .where(and(eq(products.slug, input.slug), eq(products.isPublished, true)))
        .orderBy(productImages.displayOrder)

      if (product.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' })
      }

      // Group images by product
      const productData = product[0]
      const images = product
        .filter((p) => p.images?.id)
        .map((p) => p.images)

      return {
        ...productData,
        images,
      }
    }),

  // Public: Get related products
  getRelated: publicProcedure
    .input(z.object({ productId: z.string().uuid(), categoryId: z.string().uuid().optional(), limit: z.number().min(1).max(10).default(4) }))
    .query(async ({ input }) => {
      const itemCodeSql = await getItemCodeSql()
      const items = await db
        .select({
          id: products.id,
          itemCode: itemCodeSql,
          name: products.name,
          slug: products.slug,
          shortDescription: products.shortDescription,
          tags: products.tags,
          mode: products.mode,
          salePrice: products.salePrice,
          rentalPrice: products.rentalPrice,
          rentalDurationDays: products.rentalDurationDays,
          depositAmount: products.depositAmount,
          category: {
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          },
          primaryImage: {
            url: productImages.url,
            altText: productImages.altText,
          },
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(
          productImages,
          and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true))
        )
        .where(
          and(
            eq(products.isPublished, true),
            eq(products.availability, 'available'),
            input.categoryId ? eq(products.categoryId, input.categoryId) : undefined,
            sql`${products.id} != ${input.productId}`
          )
        )
        .orderBy(desc(products.isFeatured), desc(products.createdAt))
        .limit(input.limit)

      return items
    }),

  // Admin: Get all products (including unpublished)
  adminGetList: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      categoryId: z.string().uuid().optional(),
      mode: z.enum(['sale', 'rental', 'both']).optional(),
      availability: z.enum(['available', 'low_stock', 'out_of_stock', 'discontinued']).optional(),
      isPublished: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      sortBy: z.enum(['newest', 'oldest', 'name_asc', 'name_desc']).default('newest'),
    }))
    .query(async ({ input }) => {
      const { page, limit, search, categoryId, mode, availability, isPublished, isFeatured, sortBy } = input
      const offset = (page - 1) * limit

      const conditions = []

      if (search) {
        conditions.push(
          or(
            ilike(products.name, `%${search}%`),
            ilike(products.slug, `%${search}%`)
          )!
        )
      }

      if (categoryId) {
        conditions.push(eq(products.categoryId, categoryId))
      }

      if (mode) {
        conditions.push(
          or(
            eq(products.mode, mode),
            eq(products.mode, 'both')
          )!
        )
      }

      if (availability) {
        conditions.push(eq(products.availability, availability))
      }

      if (isPublished !== undefined) {
        conditions.push(eq(products.isPublished, isPublished))
      }

      if (isFeatured !== undefined) {
        conditions.push(eq(products.isFeatured, isFeatured))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      let orderBy: ReturnType<typeof asc> | ReturnType<typeof desc>
      switch (sortBy) {
        case 'oldest':
          orderBy = asc(products.createdAt)
          break
        case 'name_asc':
          orderBy = asc(products.name)
          break
        case 'name_desc':
          orderBy = desc(products.name)
          break
        case 'newest':
        default:
          orderBy = desc(products.createdAt)
          break
      }

      const itemCodeSql = await getItemCodeSql()

      const [items, totalResult] = await Promise.all([
        db
          .select({
            id: products.id,
            itemCode: itemCodeSql,
            name: products.name,
            slug: products.slug,
            categoryId: products.categoryId,
            mode: products.mode,
            salePrice: products.salePrice,
            rentalPrice: products.rentalPrice,
            rentalDurationDays: products.rentalDurationDays,
            depositAmount: products.depositAmount,
            stockQuantity: products.stockQuantity,
            availability: products.availability,
            isFeatured: products.isFeatured,
            isPublished: products.isPublished,
            createdAt: products.createdAt,
            category: {
              id: categories.id,
              name: categories.name,
              slug: categories.slug,
            },
            primaryImage: {
              url: productImages.url,
            },
          })
          .from(products)
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .leftJoin(
            productImages,
            and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true))
          )
          .where(whereClause)
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(products).where(whereClause),
      ])

      return {
        items,
        total: totalResult[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalResult[0].count / limit),
      }
    }),

  // Admin: Get product by ID (full details)
  adminGetById: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const itemCodeSql = await getItemCodeSql()
      const product = await db
        .select({
          id: products.id,
          itemCode: itemCodeSql,
          name: products.name,
          slug: products.slug,
          categoryId: products.categoryId,
          description: products.description,
          shortDescription: products.shortDescription,
          tags: products.tags,
          mode: products.mode,
          salePrice: products.salePrice,
          rentalPrice: products.rentalPrice,
          rentalDurationDays: products.rentalDurationDays,
          depositAmount: products.depositAmount,
          stockQuantity: products.stockQuantity,
          availability: products.availability,
          isFeatured: products.isFeatured,
          isPublished: products.isPublished,
          careInstructions: products.careInstructions,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          category: {
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          },
          images: {
            id: productImages.id,
            url: productImages.url,
            altText: productImages.altText,
            displayOrder: productImages.displayOrder,
            isPrimary: productImages.isPrimary,
          },
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(productImages, eq(productImages.productId, products.id))
        .where(eq(products.id, input.id))
        .orderBy(productImages.displayOrder)

      if (product.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' })
      }

      const productData = product[0]
      const images = product
        .filter((p) => p.images?.id)
        .map((p) => p.images)

      return {
        ...productData,
        images,
      }
    }),

  // Admin: Create product
  createProduct: adminProcedure
    .input(createProductSchema)
    .mutation(async ({ input, ctx }) => {
      // Sanitize or auto-generate slug
      let finalSlug = serverSlugify(input.slug || input.name) || `ornament-${Date.now()}`

      // Check slug uniqueness & auto-resolve collisions
      let candidateSlug = finalSlug
      let suffix = 1
      while (true) {
        const existing = await db.select({ id: products.id }).from(products).where(eq(products.slug, candidateSlug)).limit(1)
        if (existing.length === 0) {
          break
        }
        suffix++
        candidateSlug = `${finalSlug}-${suffix}`
      }
      finalSlug = candidateSlug

      const hasCol = await checkHasItemCodeColumn()

      // Normalize or generate itemCode
      let itemCode = input.itemCode?.trim().toUpperCase()
      if (!itemCode) {
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
        itemCode = `SH-${randomSuffix}`
      }

      // Check itemCode uniqueness
      if (hasCol) {
        const existingCode = await db
          .select({ id: products.id })
          .from(products)
          .where(sql`upper(${products.itemCode}) = ${itemCode}`)
          .limit(1)
        if (existingCode.length > 0) {
          throw new TRPCError({ code: 'CONFLICT', message: `Item code "${itemCode}" is already in use. Please enter a unique item code.` })
        }
      }

      const insertValues: any = { ...input, slug: finalSlug }
      if (hasCol) {
        insertValues.itemCode = itemCode
      } else {
        delete insertValues.itemCode
      }

      const [product] = await db.insert(products).values(insertValues).returning()

      // Audit log
      await audit.productCreated(ctx, product.id, { ...input, slug: finalSlug, itemCode })

      return product
    }),

  // Admin: Update product
  updateProduct: adminProcedure
    .input(updateProductSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input

      // Get old data for audit
      const oldProduct = await db.select().from(products).where(eq(products.id, id)).limit(1)
      if (oldProduct.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' })
      }

      // Sanitize and check slug uniqueness if provided or if name changed
      if (data.slug !== undefined) {
        const targetSlug = serverSlugify(data.slug || (data.name ? data.name : oldProduct[0].name))
        if (targetSlug && targetSlug !== oldProduct[0].slug) {
          const existing = await db.select({ id: products.id }).from(products).where(and(eq(products.slug, targetSlug), sql`${products.id} != ${id}`)).limit(1)
          if (existing.length > 0) {
            throw new TRPCError({ code: 'CONFLICT', message: 'Slug already exists' })
          }
          data.slug = targetSlug
        }
      }

      const hasCol = await checkHasItemCodeColumn()

      // Check itemCode uniqueness if changing
      if (data.itemCode) {
        const itemCode = data.itemCode.trim().toUpperCase()
        if (hasCol) {
          const existingCode = await db
            .select({ id: products.id })
            .from(products)
            .where(and(sql`upper(${products.itemCode}) = ${itemCode}`, sql`${products.id} != ${id}`))
            .limit(1)
          if (existingCode.length > 0) {
            throw new TRPCError({ code: 'CONFLICT', message: `Item code "${itemCode}" is already in use. Please enter a unique item code.` })
          }
          data.itemCode = itemCode
        } else {
          delete data.itemCode
        }
      }

      const [product] = await db
        .update(products)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning()

      // Audit log
      await audit.productUpdated(ctx, id, oldProduct[0], product)

      return product
    }),

  // Admin: Toggle publish status
  togglePublishStatus: adminProcedure
    .input(z.object({ id: z.string().uuid(), isPublished: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const [product] = await db
        .update(products)
        .set({ isPublished: input.isPublished, updatedAt: new Date() })
        .where(eq(products.id, input.id))
        .returning()

      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' })
      }

      // Audit log
      await audit.productPublishToggled(ctx, input.id, input.isPublished)

      return product
    }),

  // Admin: Toggle featured status
  toggleFeaturedStatus: adminProcedure
    .input(z.object({ id: z.string().uuid(), isFeatured: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const [product] = await db
        .update(products)
        .set({ isFeatured: input.isFeatured, updatedAt: new Date() })
        .where(eq(products.id, input.id))
        .returning()

      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' })
      }

      // Audit log
      await audit.productFeaturedToggled(ctx, input.id, input.isFeatured)

      return product
    }),

  // Admin: Remove featured status from all products in a category (or all categories)
  removeFeaturedFromCategory: adminProcedure
    .input(z.object({ categoryId: z.string().uuid().optional() }))
    .mutation(async ({ input, ctx }) => {
      const conditions = [eq(products.isFeatured, true)]
      if (input.categoryId) {
        conditions.push(eq(products.categoryId, input.categoryId))
      }

      const updated = await db
        .update(products)
        .set({ isFeatured: false, updatedAt: new Date() })
        .where(and(...conditions))
        .returning({ id: products.id, name: products.name })

      for (const item of updated) {
        await audit.productFeaturedToggled(ctx, item.id, false)
      }

      return { success: true, count: updated.length }
    }),

  // Admin: Archive product (soft delete)
  archiveProduct: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Get product for audit
      const oldProduct = await db.select().from(products).where(eq(products.id, input.id)).limit(1)
      if (oldProduct.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' })
      }

      // Check if product has enquiry items
      const enquiryItemsCount = await db
        .select({ count: count() })
        .from(enquiryItems)
        .where(eq(enquiryItems.productId, input.id))

      if (enquiryItemsCount[0].count > 0) {
        // Soft archive - just mark as discontinued
        const [product] = await db
          .update(products)
          .set({ availability: 'discontinued', isPublished: false, updatedAt: new Date() })
          .where(eq(products.id, input.id))
          .returning()

        // Audit log
        await audit.productDeleted(ctx, input.id, oldProduct[0])

        return { ...product, archived: true }
      } else {
        // Hard delete if no enquiries
        await db.delete(productImages).where(eq(productImages.productId, input.id))
        await db.delete(products).where(eq(products.id, input.id))

        // Audit log
        await audit.productDeleted(ctx, input.id, oldProduct[0])

        return { success: true, deleted: true }
      }
    }),

  // Admin: Manage product images
  addImage: adminProcedure
    .input(z.object({
      productId: z.string().uuid(),
      url: z.string().url(),
      altText: z.string().max(255).optional(),
      displayOrder: z.number().int().min(0).default(0),
      isPrimary: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      // If setting as primary, unset other primary images
      if (input.isPrimary) {
        await db
          .update(productImages)
          .set({ isPrimary: false })
          .where(and(eq(productImages.productId, input.productId), eq(productImages.isPrimary, true)))
      }

      const [image] = await db.insert(productImages).values(input).returning()

      // Audit log
      await audit.imageAdded(ctx, input.productId, image.id, input)

      return image
    }),

  updateImage: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      url: z.string().url().optional(),
      altText: z.string().max(255).optional(),
      displayOrder: z.number().int().min(0).optional(),
      isPrimary: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input

      // Get old data for audit
      const oldImage = await db.select().from(productImages).where(eq(productImages.id, id)).limit(1)
      if (oldImage.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Image not found' })
      }

      // If setting as primary, unset other primary images for this product
      if (data.isPrimary) {
        const image = await db.select({ productId: productImages.productId }).from(productImages).where(eq(productImages.id, id)).limit(1)
        if (image.length > 0) {
          await db
            .update(productImages)
            .set({ isPrimary: false })
            .where(and(eq(productImages.productId, image[0].productId), eq(productImages.isPrimary, true), sql`${productImages.id} != ${id}`))
        }
      }

      const [updated] = await db.update(productImages).set(data).where(eq(productImages.id, id)).returning()

      // Audit log
      await audit.imageUpdated(ctx, id, oldImage[0], updated)

      return updated
    }),

  deleteImage: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Get old data for audit
      const oldImage = await db.select().from(productImages).where(eq(productImages.id, input.id)).limit(1)
      if (oldImage.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Image not found' })
      }

      await db.delete(productImages).where(eq(productImages.id, input.id))

      // Audit log
      await audit.imageDeleted(ctx, input.id, oldImage[0])

      return { success: true }
    }),

  reorderImages: adminProcedure
    .input(z.object({
      productId: z.string().uuid(),
      imageIds: z.array(z.string().uuid()),
    }))
    .mutation(async ({ input, ctx }) => {
      for (let i = 0; i < input.imageIds.length; i++) {
        await db
          .update(productImages)
          .set({ displayOrder: i })
          .where(and(eq(productImages.id, input.imageIds[i]), eq(productImages.productId, input.productId)))
      }

      // Audit log
      await audit.imagesReordered(ctx, input.productId, input.imageIds)

      return { success: true }
    }),

  // Admin: Bulk update products (catalogue category, availability, isFeatured, isPublished)
  bulkUpdateProducts: adminProcedure
    .input(z.object({
      ids: z.array(z.string().uuid()).min(1),
      categoryId: z.string().uuid().optional(),
      availability: z.enum(['available', 'low_stock', 'out_of_stock', 'discontinued']).optional(),
      isFeatured: z.boolean().optional(),
      isPublished: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { ids, ...updates } = input
      const updateData: Record<string, unknown> = { updatedAt: new Date() }
      if (updates.categoryId !== undefined) updateData.categoryId = updates.categoryId
      if (updates.availability !== undefined) updateData.availability = updates.availability
      if (updates.isFeatured !== undefined) updateData.isFeatured = updates.isFeatured
      if (updates.isPublished !== undefined) updateData.isPublished = updates.isPublished

      const updated = await db
        .update(products)
        .set(updateData)
        .where(inArray(products.id, ids))
        .returning()

      for (const item of updated) {
        await audit.productUpdated(ctx, item.id, {}, updateData)
      }

      return { count: updated.length, items: updated }
    }),

  // Admin: Bulk delete products
  bulkDeleteProducts: adminProcedure
    .input(z.object({
      ids: z.array(z.string().uuid()).min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const { ids } = input
      // Delete images first
      await db.delete(productImages).where(inArray(productImages.productId, ids))
      const deleted = await db
        .delete(products)
        .where(inArray(products.id, ids))
        .returning({ id: products.id, name: products.name })

      for (const item of deleted) {
        await audit.productDeleted(ctx, item.id, { name: item.name })
      }

      return { count: deleted.length }
    }),

  // Admin: Clear all demo / existing products from catalogue
  clearAllProducts: adminProcedure
    .mutation(async ({ ctx }) => {
      // 1. Delete all images
      await db.delete(productImages)
      // 2. Clear enquiry items to prevent FK constraints
      await db.delete(enquiryItems)
      // 3. Delete all products
      const deleted = await db
        .delete(products)
        .returning({ id: products.id, name: products.name })

      for (const item of deleted) {
        await audit.productDeleted(ctx, item.id, { name: item.name })
      }

      return { count: deleted.length }
    }),
})