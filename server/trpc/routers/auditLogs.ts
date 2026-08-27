import { z } from 'zod'
import { router, adminProcedure } from '../index.js'
import { db } from '../../db/index.js'
import { auditLogs, users } from '../../db/schema.js'
import { desc, count, eq, and } from 'drizzle-orm'

const auditFilterSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(25),
  entityType: z.string().optional(),
  action: z.string().optional(),
})

export const auditLogsRouter = router({
  // Admin: Get paginated audit logs
  adminGetList: adminProcedure
    .input(auditFilterSchema)
    .query(async ({ input }) => {
      const { page, limit, entityType, action } = input
      const offset = (page - 1) * limit

      const conditions = []
      if (entityType) {
        conditions.push(eq(auditLogs.entityType, entityType))
      }
      if (action) {
        conditions.push(eq(auditLogs.action, action))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const [items, totalResult] = await Promise.all([
        db
          .select({
            id: auditLogs.id,
            action: auditLogs.action,
            entityType: auditLogs.entityType,
            entityId: auditLogs.entityId,
            oldData: auditLogs.oldData,
            newData: auditLogs.newData,
            ipAddress: auditLogs.ipAddress,
            userAgent: auditLogs.userAgent,
            createdAt: auditLogs.createdAt,
            user: {
              id: users.id,
              name: users.name,
              email: users.email,
              role: users.role,
            },
          })
          .from(auditLogs)
          .leftJoin(users, eq(auditLogs.userId, users.id))
          .where(whereClause)
          .orderBy(desc(auditLogs.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(auditLogs).where(whereClause),
      ])

      return {
        items,
        total: totalResult[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalResult[0].count / limit),
      }
    }),
})
