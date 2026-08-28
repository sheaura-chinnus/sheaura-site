import { pgTable, uuid, varchar, text, integer, boolean, timestamp, decimal, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const productCategoryEnum = pgEnum('product_category', ['jewellery', 'cosmetics', 'ornaments'])
export const productModeEnum = pgEnum('product_mode', ['sale', 'rental', 'both'])
export const productAvailabilityEnum = pgEnum('product_availability', ['available', 'low_stock', 'out_of_stock', 'discontinued'])
export const enquiryStatusEnum = pgEnum('enquiry_status', ['new', 'contacted', 'reserved', 'fulfilled', 'cancelled', 'rejected'])
export const userRoleEnum = pgEnum('user_role', ['user', 'shop_order_receiver', 'admin'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  passwordHash: varchar('password_hash', { length: 500 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  googleId: varchar('google_id', { length: 255 }),
  deliveryAddress: text('delivery_address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  pincode: varchar('pincode', { length: 20 }),
  role: userRoleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}))

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 500 }),
  displayOrder: integer('display_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex('categories_slug_idx').on(table.slug),
  displayOrderIdx: index('categories_display_order_idx').on(table.displayOrder),
}))

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemCode: varchar('item_code', { length: 50 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 500 }),
  tags: text('tags').array().notNull().default([]),
  mode: productModeEnum('mode').notNull().default('rental'),
  salePrice: decimal('sale_price', { precision: 10, scale: 2 }),
  rentalPrice: decimal('rental_price', { precision: 10, scale: 2 }),
  rentalDurationDays: integer('rental_duration_days'),
  depositAmount: decimal('deposit_amount', { precision: 10, scale: 2 }),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  availability: productAvailabilityEnum('availability').notNull().default('available'),
  isFeatured: boolean('is_featured').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(false),
  careInstructions: text('care_instructions'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex('products_slug_idx').on(table.slug),
  itemCodeIdx: uniqueIndex('products_item_code_idx').on(table.itemCode),
  categoryIdx: index('products_category_idx').on(table.categoryId),
  publishedIdx: index('products_published_idx').on(table.isPublished),
  featuredIdx: index('products_featured_idx').on(table.isFeatured),
  availabilityIdx: index('products_availability_idx').on(table.availability),
}))

export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 500 }).notNull(),
  altText: varchar('alt_text', { length: 255 }),
  displayOrder: integer('display_order').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  productIdx: index('product_images_product_idx').on(table.productId),
  displayOrderIdx: index('product_images_display_order_idx').on(table.productId, table.displayOrder),
}))

export const enquiries = pgTable('enquiries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  preferredContact: varchar('preferred_contact', { length: 50 }),
  eventDate: timestamp('event_date', { withTimezone: true }),
  returnDate: timestamp('return_date', { withTimezone: true }),
  deliveryPickup: varchar('delivery_pickup', { length: 50 }),
  shippingAddress: text('shipping_address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  pincode: varchar('pincode', { length: 20 }),
  paymentMethod: varchar('payment_method', { length: 50 }), // 'prepaid_upi' | 'cards' | 'cod' | 'stripe' | 'whatsapp'
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending'), // 'pending' | 'completed' | 'cash_on_delivery'
  prepaidDiscount: decimal('prepaid_discount', { precision: 10, scale: 2 }).default('0.00'),
  message: text('message'),
  status: enquiryStatusEnum('status').notNull().default('new'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailIdx: index('enquiries_email_idx').on(table.email),
  statusIdx: index('enquiries_status_idx').on(table.status),
  createdAtIdx: index('enquiries_created_at_idx').on(table.createdAt),
  assignedToIdx: index('enquiries_assigned_to_idx').on(table.assignedTo),
}))

export const enquiryItems = pgTable('enquiry_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  enquiryId: uuid('enquiry_id').notNull().references(() => enquiries.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull().default(1),
  mode: productModeEnum('mode').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  enquiryIdx: index('enquiry_items_enquiry_idx').on(table.enquiryId),
  productIdx: index('enquiry_items_product_idx').on(table.productId),
}))

export const siteSettings = pgTable('site_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  keyIdx: uniqueIndex('site_settings_key_idx').on(table.key),
}))

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id'),
  oldData: text('old_data'),
  newData: text('new_data'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('audit_logs_user_idx').on(table.userId),
  entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}))

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: varchar('filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(),
  width: integer('width'),
  height: integer('height'),
  altText: varchar('alt_text', { length: 255 }),
  storageType: varchar('storage_type', { length: 50 }).notNull().default('db'), // 's3' | 'supabase' | 'db'
  storageKey: varchar('storage_key', { length: 500 }),
  data: text('data'), // Base64 data for 'db' storage
  checksum: varchar('checksum', { length: 64 }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  createdAtIdx: index('media_assets_created_at_idx').on(table.createdAt),
  storageKeyIdx: index('media_assets_storage_key_idx').on(table.storageKey),
}))

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  enquiries: many(enquiries),
  assignedEnquiries: many(enquiries, { relationName: 'assignedEnquiries' }),
  auditLogs: many(auditLogs),
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
  enquiryItems: many(enquiryItems),
}))

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}))

export const enquiriesRelations = relations(enquiries, ({ one, many }) => ({
  user: one(users, { fields: [enquiries.userId], references: [users.id] }),
  assignee: one(users, { fields: [enquiries.assignedTo], references: [users.id], relationName: 'assignedEnquiries' }),
  items: many(enquiryItems),
}))

export const enquiryItemsRelations = relations(enquiryItems, ({ one }) => ({
  enquiry: one(enquiries, { fields: [enquiryItems.enquiryId], references: [enquiries.id] }),
  product: one(products, { fields: [enquiryItems.productId], references: [products.id] }),
}))

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type ProductImage = typeof productImages.$inferSelect
export type NewProductImage = typeof productImages.$inferInsert
export type Enquiry = typeof enquiries.$inferSelect
export type NewEnquiry = typeof enquiries.$inferInsert
export type EnquiryItem = typeof enquiryItems.$inferSelect
export type NewEnquiryItem = typeof enquiryItems.$inferInsert
export type SiteSetting = typeof siteSettings.$inferSelect
export type NewSiteSetting = typeof siteSettings.$inferInsert
export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
export type MediaAsset = typeof mediaAssets.$inferSelect
export type NewMediaAsset = typeof mediaAssets.$inferInsert