import { router } from './index.js'
import { productsRouter } from './routers/products.js'
import { categoriesRouter } from './routers/categories.js'
import { enquiriesRouter } from './routers/enquiries.js'
import { siteSettingsRouter } from './routers/siteSettings.js'
import { authRouter } from './routers/auth.js'
import { auditLogsRouter } from './routers/auditLogs.js'

export const appRouter = router({
  products: productsRouter,
  categories: categoriesRouter,
  enquiries: enquiriesRouter,
  siteSettings: siteSettingsRouter,
  auth: authRouter,
  auditLogs: auditLogsRouter,
})

export type AppRouter = typeof appRouter