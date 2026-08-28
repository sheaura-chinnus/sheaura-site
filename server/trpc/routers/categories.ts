import { z } from 'zod'
import { router, publicProcedure, adminProcedure } from '../index.js'
import { db } from '../../db/index.js'
import { categories, products } from '../../db/schema.js'
import { eq, asc, count, and, sql, or, ilike } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { audit } from '../audit.js'

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().max(100).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

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

const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().uuid(),
})

export const categoriesRouter = router({
  // Public: Get all active categories
  getList: publicProcedure
    .query(async () => {
      const items = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
          imageUrl: categories.imageUrl,
          displayOrder: categories.displayOrder,
          isActive: categories.isActive,
          productCount: count(products.id),
        })
        .from(categories)
        .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isPublished, true)))
        .where(eq(categories.isActive, true))
        .groupBy(categories.id)
        .orderBy(asc(categories.displayOrder), asc(categories.name))

      return items
    }),

  // Public: Get category by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const category = await db
        .select()
        .from(categories)
        .where(and(eq(categories.slug, input.slug), eq(categories.isActive, true)))
        .limit(1)

      if (category.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' })
      }

      return category[0]
    }),

  // Admin: Get all categories (including inactive)
  adminGetList: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(50),
      search: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const { page, limit, search, isActive } = input
      const offset = (page - 1) * limit

      const conditions = []
      if (search) {
        conditions.push(
          or(
            ilike(categories.name, `%${search}%`),
            ilike(categories.slug, `%${search}%`)
          )!
        )
      }
      if (isActive !== undefined) {
        conditions.push(eq(categories.isActive, isActive))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const [items, totalResult] = await Promise.all([
        db
          .select({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
            description: categories.description,
            imageUrl: categories.imageUrl,
            displayOrder: categories.displayOrder,
            isActive: categories.isActive,
            createdAt: categories.createdAt,
            updatedAt: categories.updatedAt,
            productCount: count(products.id),
          })
          .from(categories)
          .leftJoin(products, eq(products.categoryId, categories.id))
          .where(whereClause)
          .groupBy(categories.id)
          .orderBy(asc(categories.displayOrder), asc(categories.name))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(categories).where(whereClause),
      ])

      return {
        items,
        total: totalResult[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalResult[0].count / limit),
      }
    }),

  // Admin: Create category
  createCategory: adminProcedure
    .input(createCategorySchema)
    .mutation(async ({ input, ctx }) => {
      let finalSlug = serverSlugify(input.slug || input.name) || `category-${Date.now()}`
      let candidateSlug = finalSlug
      let suffix = 1
      while (true) {
        const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, candidateSlug)).limit(1)
        if (existing.length === 0) {
          break
        }
        suffix++
        candidateSlug = `${finalSlug}-${suffix}`
      }
      finalSlug = candidateSlug

      const [category] = await db.insert(categories).values({ ...input, slug: finalSlug }).returning()

      // Audit log
      await audit.categoryCreated(ctx, category.id, { ...input, slug: finalSlug })

      return category
    }),

  // Admin: Update category
  updateCategory: adminProcedure
    .input(updateCategorySchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input

      // Get old data for audit
      const oldCategory = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
      if (oldCategory.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' })
      }

      if (data.slug !== undefined) {
        const targetSlug = serverSlugify(data.slug || (data.name ? data.name : oldCategory[0].name))
        if (targetSlug && targetSlug !== oldCategory[0].slug) {
          const existing = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.slug, targetSlug), sql`${categories.id} != ${id}`)).limit(1)
          if (existing.length > 0) {
            throw new TRPCError({ code: 'CONFLICT', message: 'Slug already exists' })
          }
          data.slug = targetSlug
        }
      }

      const [category] = await db
        .update(categories)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(categories.id, id))
        .returning()

      // Audit log
      await audit.categoryUpdated(ctx, id, oldCategory[0], category)

      return category
    }),

  // Admin: Toggle active status
  toggleActiveStatus: adminProcedure
    .input(z.object({ id: z.string().uuid(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const [category] = await db
        .update(categories)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(categories.id, input.id))
        .returning()

      if (!category) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' })
      }

      // Audit log
      await audit.categoryActiveToggled(ctx, input.id, input.isActive)

      return category
    }),

  // Admin: Delete category (only if no products)
  deleteCategory: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const productCount = await db.select({ count: count() }).from(products).where(eq(products.categoryId, input.id))
      if (productCount[0].count > 0) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Cannot delete category with products. Archive products first.' })
      }

      // Get old data for audit
      const oldCategory = await db.select().from(categories).where(eq(categories.id, input.id)).limit(1)
      if (oldCategory.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' })
      }

      await db.delete(categories).where(eq(categories.id, input.id))

      // Audit log
      await audit.categoryDeleted(ctx, input.id, oldCategory[0])

      return { success: true }
    }),

  // Admin: Reorder categories
  reorderCategories: adminProcedure
    .input(z.object({
      categoryIds: z.array(z.string().uuid()),
    }))
    .mutation(async ({ input }) => {
      for (let i = 0; i < input.categoryIds.length; i++) {
        await db
          .update(categories)
          .set({ displayOrder: i, updatedAt: new Date() })
          .where(eq(categories.id, input.categoryIds[i]))
      }
      // Note: Reorder doesn't have a specific audit function, but could be added
      return { success: true }
    }),
})