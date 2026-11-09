import 'dotenv/config'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startTestServer, stopTestServer, makeRequest } from './testHelper.js'
import { db } from '../db/index.js'
import { categories, products, productImages, enquiries, users } from '../db/schema.js'
import { eq, like } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

describe('Stage 10 — Sales-Only E-Commerce, Inventory Lifecycle & Admin Users Tests', () => {
  let testCategoryId: string
  let adminUserId: string
  let testAdminSessionCookie = ''
  let testCsrfToken = ''

  beforeAll(async () => {
    await startTestServer()

    // 1. Ensure a test category exists
    const [cat] = await db.insert(categories).values({
      name: 'Sales Verification Cat',
      slug: `sales-cat-${Date.now()}`,
    }).returning({ id: categories.id })
    testCategoryId = cat.id

    // 2. Fetch public CSRF token
    const publicRes = await makeRequest('/trpc/siteSettings.getPublic?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D')
    const cookies = publicRes.headers['set-cookie'] || []
    let sessionCookie = ''
    cookies.forEach((c) => {
      const m = c.match(/csrf_token=([^;]+)/)
      if (m) testCsrfToken = m[1]
      const s = c.match(/connect\.sid=([^;]+)/)
      if (s) sessionCookie = s[0]
    })

    // 3. Authenticate as Admin via adminLogin
    process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-admin-password'
    const loginRes = await makeRequest('/trpc/auth.adminLogin?batch=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': testCsrfToken,
        Cookie: `${sessionCookie}; csrf_token=${testCsrfToken}`,
      },
      body: JSON.stringify({
        '0': { json: { password: process.env.ADMIN_PASSWORD } },
      }),
    })

    const loginCookies = loginRes.headers['set-cookie'] || []
    loginCookies.forEach((c) => {
      const s = c.match(/connect\.sid=([^;]+)/)
      if (s) testAdminSessionCookie = s[0]
    })
    if (!testAdminSessionCookie) testAdminSessionCookie = sessionCookie

    const loginData = JSON.parse(loginRes.body)
    adminUserId = loginData[0]?.result?.data?.json?.id
  })

  afterAll(async () => {
    // Clean up test records in proper foreign key order
    await db.delete(enquiries).where(like(enquiries.email, 'cust%@sheaura.com'))
    await db.delete(products).where(like(products.slug, 'sales-test-%'))
    await db.delete(categories).where(eq(categories.id, testCategoryId))
    await stopTestServer()
  })

  describe('1. Product CRUD with Image Persistence', () => {
    it('should create product with multiple images and persist them in productImages table', async () => {
      const prodSlug = `sales-test-prod-${Date.now()}`
      const createRes = await makeRequest('/trpc/products.createProduct?batch=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': testCsrfToken,
          Cookie: `${testAdminSessionCookie}; csrf_token=${testCsrfToken}`,
        },
        body: JSON.stringify({
          '0': {
            json: {
              name: 'Royal Kundan Choker',
              slug: prodSlug,
              categoryId: testCategoryId,
              salePrice: '2499',
              mode: 'sale',
              stockQuantity: 10,
              isPublished: true,
              availability: 'available',
              images: [
                { url: 'https://images.sheaura.com/p1.jpg', altText: 'Front View', isPrimary: true, displayOrder: 0 },
                { url: 'https://images.sheaura.com/p2.jpg', altText: 'Side View', isPrimary: false, displayOrder: 1 },
              ],
            },
          },
        }),
      })

      expect(createRes.statusCode).toBe(200)
      const resJson = JSON.parse(createRes.body)
      const createdProd = resJson[0]?.result?.data?.json
      expect(createdProd.id).toBeDefined()
      expect(createdProd.name).toBe('Royal Kundan Choker')

      // Query product by slug to verify images are properly attached
      const getRes = await makeRequest(`/trpc/products.getBySlug?batch=1&input=${encodeURIComponent(JSON.stringify({ '0': { json: { slug: prodSlug } } }))}`)
      expect(getRes.statusCode).toBe(200)
      const getJson = JSON.parse(getRes.body)
      const fetchedProd = getJson[0]?.result?.data?.json
      expect(fetchedProd.images).toBeDefined()
      expect(fetchedProd.images.length).toBe(2)
      expect(fetchedProd.images[0].url).toBe('https://images.sheaura.com/p1.jpg')
      expect(fetchedProd.images[0].isPrimary).toBe(true)
    })

    it('should update product images and synchronize productImages records', async () => {
      const prodSlug = `sales-test-update-${Date.now()}`
      const [newProd] = await db.insert(products).values({
        name: 'Initial Product',
        slug: prodSlug,
        categoryId: testCategoryId,
        salePrice: '1999',
        mode: 'sale',
        stockQuantity: 5,
        isPublished: true,
        availability: 'available',
      }).returning({ id: products.id })

      // Update with new image
      const updateRes = await makeRequest('/trpc/products.updateProduct?batch=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': testCsrfToken,
          Cookie: `${testAdminSessionCookie}; csrf_token=${testCsrfToken}`,
        },
        body: JSON.stringify({
          '0': {
            json: {
              id: newProd.id,
              name: 'Updated Kundan Choker',
              images: [
                { url: 'https://images.sheaura.com/updated.jpg', altText: 'Updated View', isPrimary: true, displayOrder: 0 },
              ],
            },
          },
        }),
      })

      expect(updateRes.statusCode).toBe(200)

      // Verify images table
      const storedImages = await db.select().from(productImages).where(eq(productImages.productId, newProd.id))
      expect(storedImages.length).toBe(1)
      expect(storedImages[0].url).toBe('https://images.sheaura.com/updated.jpg')
    })
  })

  describe('2. Inventory Deduction & Restoration Lifecycle', () => {
    it('should accurately deduct stockQuantity and set low_stock when stock drops to <= 3', async () => {
      const prodSlug = `sales-test-stock-${Date.now()}`
      const [prod] = await db.insert(products).values({
        name: 'Limited Stock Choker',
        slug: prodSlug,
        categoryId: testCategoryId,
        salePrice: '3200',
        mode: 'sale',
        stockQuantity: 5,
        isPublished: true,
        availability: 'available',
      }).returning({ id: products.id })

      // Create an order purchasing 3 items (remaining stock = 2 <= 3 -> low_stock)
      const orderRes = await makeRequest('/trpc/enquiries.createEnquiry?batch=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': testCsrfToken,
          Cookie: `${testAdminSessionCookie}; csrf_token=${testCsrfToken}`,
        },
        body: JSON.stringify({
          '0': {
            json: {
              name: 'Customer One',
              email: 'cust1@sheaura.com',
              phone: '9876543210',
              preferredContact: 'whatsapp',
              shippingAddress: '42 Marine Drive, Mumbai',
              pincode: '400020',
              items: [{ productId: prod.id, quantity: 3, mode: 'sale' }],
            },
          },
        }),
      })

      expect(orderRes.statusCode).toBe(200)

      // Verify inventory updated
      const updated = await db.select().from(products).where(eq(products.id, prod.id)).limit(1)
      expect(updated[0].stockQuantity).toBe(2)
      expect(updated[0].availability).toBe('low_stock')
    })

    it('should restore inventory when an order is cancelled or rejected', async () => {
      const prodSlug = `sales-test-restore-${Date.now()}`
      const [prod] = await db.insert(products).values({
        name: 'Restorable Choker',
        slug: prodSlug,
        categoryId: testCategoryId,
        salePrice: '2800',
        mode: 'sale',
        stockQuantity: 1,
        isPublished: true,
        availability: 'low_stock',
      }).returning({ id: products.id })

      // Order the last item (stock drops to 0 -> out_of_stock)
      const orderRes = await makeRequest('/trpc/enquiries.createEnquiry?batch=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': testCsrfToken,
          Cookie: `${testAdminSessionCookie}; csrf_token=${testCsrfToken}`,
        },
        body: JSON.stringify({
          '0': {
            json: {
              name: 'Customer Two',
              email: 'cust2@sheaura.com',
              phone: '9876543211',
              preferredContact: 'phone',
              shippingAddress: '15 Linking Rd, Mumbai',
              pincode: '400050',
              items: [{ productId: prod.id, quantity: 1, mode: 'sale' }],
            },
          },
        }),
      })

      const orderData = JSON.parse(orderRes.body)
      const orderId = orderData[0]?.result?.data?.json?.enquiryId

      const afterOrder = await db.select().from(products).where(eq(products.id, prod.id)).limit(1)
      expect(afterOrder[0].stockQuantity).toBe(0)
      expect(afterOrder[0].availability).toBe('out_of_stock')

      // Admin cancels the order -> should restore stock back to 1
      const cancelRes = await makeRequest('/trpc/enquiries.updateEnquiryStatus?batch=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': testCsrfToken,
          Cookie: `${testAdminSessionCookie}; csrf_token=${testCsrfToken}`,
        },
        body: JSON.stringify({
          '0': {
            json: {
              id: orderId,
              status: 'cancelled',
              adminNotes: 'Customer requested cancellation before dispatch',
            },
          },
        }),
      })

      expect(cancelRes.statusCode).toBe(200)

      const restored = await db.select().from(products).where(eq(products.id, prod.id)).limit(1)
      expect(restored[0].stockQuantity).toBe(1)
      expect(restored[0].availability).toBe('low_stock')
    })
  })

  describe('3. Admin User & Role Management', () => {
    it('should allow admin to list users with pagination and search', async () => {
      const res = await makeRequest(`/trpc/auth.adminGetUsers?batch=1&input=${encodeURIComponent(JSON.stringify({ '0': { json: { page: 1, limit: 10 } } }))}`, {
        headers: {
          Cookie: `${testAdminSessionCookie}; csrf_token=${testCsrfToken}`,
        },
      })

      expect(res.statusCode).toBe(200)
      const data = JSON.parse(res.body)
      const result = data[0]?.result?.data?.json
      expect(result.items).toBeDefined()
      expect(Array.isArray(result.items)).toBe(true)
      expect(typeof result.total).toBe('number')
    })

    it('should update user role to shop_order_receiver', async () => {
      // Create a test user
      const [testUser] = await db.insert(users).values({
        id: uuidv4(),
        email: `role-test-${Date.now()}@sheaura.com`,
        name: 'Role Test User',
        role: 'user',
      }).returning()

      const res = await makeRequest('/trpc/auth.adminUpdateUserRole?batch=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': testCsrfToken,
          Cookie: `${testAdminSessionCookie}; csrf_token=${testCsrfToken}`,
        },
        body: JSON.stringify({
          '0': {
            json: {
              userId: testUser.id,
              role: 'shop_order_receiver',
            },
          },
        }),
      })

      expect(res.statusCode).toBe(200)
      const updated = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1)
      expect(updated[0].role).toBe('shop_order_receiver')

      // Clean up
      await db.delete(users).where(eq(users.id, testUser.id))
    })

    it('should prevent admin from demoting their own role (self-demotion protection)', async () => {
      if (!adminUserId) return

      const res = await makeRequest('/trpc/auth.adminUpdateUserRole?batch=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': testCsrfToken,
          Cookie: `${testAdminSessionCookie}; csrf_token=${testCsrfToken}`,
        },
        body: JSON.stringify({
          '0': {
            json: {
              userId: adminUserId,
              role: 'user',
            },
          },
        }),
      })

      expect(res.statusCode).toBe(400)
      expect(res.body).toContain('Cannot change your own role')
    })
  })

  describe('4. Dashboard Analytics & Revenue Statistics', () => {
    it('should return totalEnquiries and estimatedRevenue in getStats', async () => {
      const res = await makeRequest('/trpc/enquiries.getStats?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D', {
        headers: {
          Cookie: `${testAdminSessionCookie}; csrf_token=${testCsrfToken}`,
        },
      })

      expect(res.statusCode).toBe(200)
      const data = JSON.parse(res.body)
      const stats = data[0]?.result?.data?.json
      expect(stats.totalProducts).toBeDefined()
      expect(stats.totalEnquiries).toBeDefined()
      expect(typeof stats.totalEnquiries).toBe('number')
      expect(stats.estimatedRevenue).toBeDefined()
      expect(typeof stats.estimatedRevenue).toBe('number')
    })
  })
})
