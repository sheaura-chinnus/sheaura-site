import 'dotenv/config'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startTestServer, stopTestServer, makeRequest } from './testHelper.js'
import { generateWhatsAppMessage, buildWhatsAppUrl, formatWhatsAppNumber } from '../lib/whatsapp.js'
import { db } from '../db/index.js'
import { enquiries, enquiryItems, categories, products } from '../db/schema.js'
import { eq, like, sql } from 'drizzle-orm'

describe('Stage 9 — Sheaura Rental-Only Catalogue & WhatsApp Flow Tests', () => {
  beforeAll(async () => {
    try {
      await db.execute(sql`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "item_code" varchar(50);`)
    } catch {}
    await startTestServer()
  })

  afterAll(async () => {
    // Clean up test enquiries created during tests
    const testEnquiries = await db.select({ id: enquiries.id }).from(enquiries).where(eq(enquiries.name, 'Priya Guest'))
    for (const e of testEnquiries) {
      await db.delete(enquiryItems).where(eq(enquiryItems.enquiryId, e.id))
      await db.delete(enquiries).where(eq(enquiries.id, e.id))
    }
    await db.delete(products).where(like(products.slug, 'rental-test-prod-%'))
    await stopTestServer()
  })

  // 1 & 2: Public site access and No required login / No Google login requirement
  describe('1 & 2. Public Access & No Required Login', () => {
    it('should allow public access to health check without login or credentials', async () => {
      const res = await makeRequest('/health')
      expect(res.statusCode).toBe(200)
      const data = JSON.parse(res.body)
      expect(data.status).toBe('ok')
    })

    it('should allow unauthenticated access to public site settings via tRPC', async () => {
      const res = await makeRequest('/trpc/siteSettings.getPublic?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D')
      expect(res.statusCode).toBe(200)
      const json = JSON.parse(res.body)
      const data = json[0]?.result?.data?.json || json?.result?.data
      expect(data).toBeDefined()
      expect(data.brandName).toBe('Sheaura')
      expect(data.navRentalOrnamentsLabel).toBe('Rental Ornaments')
    })

    it('should allow unauthenticated visitors to query the rental catalogue', async () => {
      const res = await makeRequest('/trpc/products.getList?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%7D%7D%7D')
      expect(res.statusCode).toBe(200)
      const json = JSON.parse(res.body)
      const data = json[0]?.result?.data?.json || json?.result?.data
      expect(data).toBeDefined()
      expect(Array.isArray(data.items)).toBe(true)
    })
  })

  // 3 & 4: Rental-only records and hiding unpublished records
  describe('3 & 4. Rental-Only Catalogue & Item Codes', () => {
    it('should return rental ornaments with item codes', async () => {
      const res = await makeRequest('/trpc/products.getList?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22mode%22%3A%22rental%22%7D%7D%7D')
      expect(res.statusCode).toBe(200)
      const json = JSON.parse(res.body)
      const items = json[0]?.result?.data?.json?.items || json?.result?.data?.items

      expect(Array.isArray(items)).toBe(true)
      for (const item of items) {
        expect(item.itemCode).toBeDefined()
        expect(typeof item.itemCode).toBe('string')
        expect(item.itemCode.length).toBeGreaterThan(0)
      }
    })
  })

  // 5, 6, 7 & 8: WhatsApp Enquiry Flow & Safe URL Encoding
  describe('5, 6, 7 & 8. WhatsApp Enquiry Message & Safe URL Encoding', () => {
    it('should format phone number to digits only with India (+91) prefix default', () => {
      expect(formatWhatsAppNumber('+91 98765 43210')).toBe('919876543210')
      expect(formatWhatsAppNumber('9876543210')).toBe('919876543210')
      expect(formatWhatsAppNumber('919876543210')).toBe('919876543210')
    })

    it('should correctly encode WhatsApp URLs preventing open redirects', () => {
      const url = buildWhatsAppUrl({
        items: [{ itemCode: 'BRD-001', name: 'Temple Choker' }],
        customerName: 'Priya',
        preferredDate: '2026-11-20',
        note: 'Looking for matching jhumkas',
        whatsappNumber: '+91 98765 43210',
        brandName: 'Sheaura',
      })

      // Must start strictly with https://wa.me/
      expect(url.startsWith('https://wa.me/919876543210?text=')).toBe(true)
      // Must not contain unencoded spaces or newlines
      expect(url).not.toContain('\n')
      expect(url).not.toContain(' ')
      // Must contain encoded components
      expect(url).toContain('BRD-001')
      expect(url).toContain(encodeURIComponent('Temple Choker'))
    })

    it('should include every selected item code in multi-item enquiries', () => {
      const selectedItems = [
        { itemCode: 'BRD-001', name: 'Bridal Choker' },
        { itemCode: 'BNG-042', name: 'Occasion Bangles' },
        { itemCode: 'EBG-108', name: 'Kundan Earrings' },
      ]

      const message = generateWhatsAppMessage({
        items: selectedItems,
        customerName: 'Ananya Verma',
        preferredDate: '2026-12-15',
        brandName: 'Sheaura',
      })

      // Check all 3 item codes and names are included
      expect(message).toContain('BRD-001')
      expect(message).toContain('Bridal Choker')
      expect(message).toContain('BNG-042')
      expect(message).toContain('Occasion Bangles')
      expect(message).toContain('EBG-108')
      expect(message).toContain('Kundan Earrings')
      expect(message).toContain('2026-12-15')
    })

    it('should explicitly request availability and dispatch details from Sheaura concierge', () => {
      const message = generateWhatsAppMessage({
        items: [{ itemCode: 'SH-TEST', name: 'Festive Set' }],
        brandName: 'Sheaura',
      })

      expect(message).toContain(
        'Please confirm product availability, custom sizing, and dispatch timelines. Thank you!'
      )
    })
  })

  // 9, 10 & 12: Admin Authorization & CSRF Protection
  describe('9, 10 & 12. Admin Authorization & CSRF Protection', () => {
    it('should reject mutations without CSRF token with 403', async () => {
      const res = await makeRequest('/trpc/products.createProduct?batch=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          '0': {
            json: {
              name: 'Unauthorized Test Item',
              slug: 'unauthorized-test-item',
              categoryId: '00000000-0000-0000-0000-000000000000',
            },
          },
        }),
      })

      expect(res.statusCode).toBe(403)
      expect(res.body).toContain('Invalid CSRF token')
    })

    it('should reject unauthenticated catalogue create with 401 when CSRF token is provided', async () => {
      // Step A: Acquire CSRF token and cookie from public query
      const getRes = await makeRequest('/trpc/siteSettings.getPublic?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D')
      const setCookies = getRes.headers['set-cookie'] || []
      let csrfToken = ''
      let sessionCookie = ''
      setCookies.forEach((c) => {
        const m = c.match(/csrf_token=([^;]+)/)
        if (m) csrfToken = m[1]
        const s = c.match(/connect\.sid=([^;]+)/)
        if (s) sessionCookie = s[0]
      })

      expect(csrfToken).toBeTruthy()

      // Step B: Send POST with CSRF header but no admin credentials
      const res = await makeRequest('/trpc/products.createProduct?batch=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `${sessionCookie}; csrf_token=${csrfToken}`,
        },
        body: JSON.stringify({
          '0': {
            json: {
              name: 'Unauthorized Test Item',
              slug: 'unauthorized-test-item',
              categoryId: '00000000-0000-0000-0000-000000000000',
            },
          },
        }),
      })

      expect(res.statusCode).toBe(401)
      expect(res.body).toContain('Not authenticated')
    })
  })

  // 11 & 12: Public Enquiry Submission with Valid CSRF
  describe('11 & 12. Frictionless Public Enquiry Logging', () => {
    it('should accept an enquiry submission from public visitors without account login', async () => {
      // Step A: Acquire session & CSRF token
      const getRes = await makeRequest('/trpc/siteSettings.getPublic?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D')
      const setCookies = getRes.headers['set-cookie'] || []
      let csrfToken = ''
      let sessionCookie = ''
      setCookies.forEach((c) => {
        const m = c.match(/csrf_token=([^;]+)/)
        if (m) csrfToken = m[1]
        const s = c.match(/connect\.sid=([^;]+)/)
        if (s) sessionCookie = s[0]
      })

      // Step B: Create a dedicated published product ID
      let cat = await db.select({ id: categories.id }).from(categories).limit(1)
      let catId = cat[0]?.id
      if (!catId) {
        const [newCat] = await db.insert(categories).values({
          name: 'Rental Test Cat',
          slug: `rental-test-${Date.now()}`,
        }).returning({ id: categories.id })
        catId = newCat.id
      }
      const prodSlug = `rental-test-prod-${Date.now()}-${Math.random().toString(36).substring(7)}`
      const [newProd] = await db.insert(products).values({
        name: 'Rental Test Ornament',
        slug: prodSlug,
        categoryId: catId,
        rentalPrice: '1500',
        mode: 'rental',
        stockQuantity: 1,
        isPublished: true,
        availability: 'available',
      }).returning({ id: products.id })
      const productId = newProd.id

      const enquiryRes = await makeRequest('/trpc/enquiries.createEnquiry?batch=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `${sessionCookie}; csrf_token=${csrfToken}`,
        },
        body: JSON.stringify({
          '0': {
            json: {
              name: 'Priya Guest',
              email: 'guest@sheaura.com',
              preferredContact: 'whatsapp',
              items: [{ productId, quantity: 1, mode: 'rental' }],
              message: 'Interested in bridal collection rental',
            },
          },
        }),
      })

      // Should succeed without 401
      expect(enquiryRes.statusCode).toBe(200)
      const enquiryJson = JSON.parse(enquiryRes.body)
      const data = enquiryJson[0]?.result?.data?.json
      expect(data.enquiryId).toBeDefined()
      expect(data.success).toBe(true)
    })
  })

  describe('13. Admin Enquiry Deletion & Fake Enquiry Cleanup', () => {
    it('should reject unauthenticated call to enquiries.deleteEnquiry with 401 UNAUTHORIZED when CSRF is provided', async () => {
      const getRes = await makeRequest('/trpc/siteSettings.getPublic?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D')
      const setCookies = getRes.headers['set-cookie'] || []
      let csrfToken = ''
      let sessionCookie = ''
      setCookies.forEach((c) => {
        const m = c.match(/csrf_token=([^;]+)/)
        if (m) csrfToken = m[1]
        const s = c.match(/connect\.sid=([^;]+)/)
        if (s) sessionCookie = s[0]
      })

      const res = await makeRequest('/trpc/enquiries.deleteEnquiry?batch=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `${sessionCookie}; csrf_token=${csrfToken}`,
        },
        body: JSON.stringify({
          '0': { json: { id: '00000000-0000-0000-0000-000000000000' } }
        }),
      })
      expect(res.statusCode).toBe(401)
      expect(res.body).toContain('Not authenticated')
    })

    it('should reject unauthenticated call to enquiries.clearTestEnquiries with 401 UNAUTHORIZED when CSRF is provided', async () => {
      const getRes = await makeRequest('/trpc/siteSettings.getPublic?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D')
      const setCookies = getRes.headers['set-cookie'] || []
      let csrfToken = ''
      let sessionCookie = ''
      setCookies.forEach((c) => {
        const m = c.match(/csrf_token=([^;]+)/)
        if (m) csrfToken = m[1]
        const s = c.match(/connect\.sid=([^;]+)/)
        if (s) sessionCookie = s[0]
      })

      const res = await makeRequest('/trpc/enquiries.clearTestEnquiries?batch=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          Cookie: `${sessionCookie}; csrf_token=${csrfToken}`,
        },
        body: JSON.stringify({
          '0': { json: null }
        }),
      })
      expect(res.statusCode).toBe(401)
      expect(res.body).toContain('Not authenticated')
    })
  })
})
