import 'dotenv/config'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startTestServer, stopTestServer, makeRequest } from './testHelper.js'
import { validateSetting, sanitizePlainText, DEFAULT_SITE_SETTINGS } from '../config/siteSettingsSchema.js'
import { validateImageBuffer } from '../media/storage.js'

describe('Stage 7 — Sheaura Admin Editor, Media, Navigation & Security Tests', () => {
  beforeAll(async () => {
    await startTestServer()
  })

  afterAll(async () => {
    await stopTestServer()
  })

  describe('1. Site Settings Allowlist & Validation', () => {
    it('should provide safe public defaults for all required keys', () => {
      expect(DEFAULT_SITE_SETTINGS.brandName).toBe('Sheaura')
      expect(DEFAULT_SITE_SETTINGS.navRentalOrnamentsLabel).toBe('Rental Ornaments')
      expect(DEFAULT_SITE_SETTINGS.heroHeading).toContain('Imitation Jewellery')
      expect(DEFAULT_SITE_SETTINGS.heroHeading).toContain('Rental Ornaments')
      expect(DEFAULT_SITE_SETTINGS.rentalPolicyContent).toContain('rental service')
      expect(DEFAULT_SITE_SETTINGS.rentalPolicyContent).toContain('security deposit')
    })

    it('should validate allowed setting keys and sanitize plain text', () => {
      // Valid key
      const result = validateSetting('brandName', 'Sheaura Jewels')
      expect(result.valid).toBe(true)

      // HTML should be sanitized by sanitizePlainText
      const sanitized = sanitizePlainText('<script>alert("hack")</script>Sheaura Jewels')
      expect(sanitized).toBe('Sheaura Jewels')
      expect(sanitized).not.toContain('<script>')
    })

    it('should reject disallowed keys', () => {
      const result = validateSetting('maliciousKey', 'val')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Disallowed setting key')
    })

    it('should reject values exceeding max character length', () => {
      const hugeValue = 'a'.repeat(300)
      const result = validateSetting('brandName', hugeValue)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('exceeds 255 characters')
    })

    it('should reject invalid JSON in homepageSectionVisibility', () => {
      const result = validateSetting('homepageSectionVisibility', '{notValidJson')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('valid JSON')
    })
  })

  describe('2. Logo & Media Binary Validation', () => {
    it('should accept valid PNG buffers with correct magic bytes', () => {
      // PNG header: 89 50 4E 47 0D 0A 1A 0A
      const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D])
      const validated = validateImageBuffer(pngHeader)
      expect(validated.mimeType).toBe('image/png')
      expect(validated.extension).toBe('png')
    })

    it('should accept valid JPEG buffers with correct magic bytes', () => {
      // JPEG header: FF D8 FF + padding to >= 12 bytes
      const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01])
      const validated = validateImageBuffer(jpegHeader)
      expect(validated.mimeType).toBe('image/jpeg')
      expect(validated.extension).toBe('jpg')
    })

    it('should accept valid WebP buffers with RIFF...WEBP magic bytes', () => {
      // WebP header: 'RIFF' + 4 bytes + 'WEBP'
      const webpHeader = Buffer.from([
        0x52, 0x49, 0x46, 0x46,
        0x00, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50
      ])
      const validated = validateImageBuffer(webpHeader)
      expect(validated.mimeType).toBe('image/webp')
      expect(validated.extension).toBe('webp')
    })

    it('should strictly reject SVG files to prevent XSS execution', () => {
      const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
      expect(() => validateImageBuffer(svgBuffer)).toThrow(/Unsupported or unsafe file format/)
    })

    it('should strictly reject HTML/script and executable files', () => {
      const exeBuffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]) // MZ header
      expect(() => validateImageBuffer(exeBuffer)).toThrow(/Unsupported or unsafe file format/)
    })

    it('should reject files exceeding the 2MB size limit', () => {
      const oversizedPng = Buffer.alloc(2.5 * 1024 * 1024)
      oversizedPng[0] = 0x89
      oversizedPng[1] = 0x50
      oversizedPng[2] = 0x4E
      oversizedPng[3] = 0x47
      oversizedPng[4] = 0x0D
      oversizedPng[5] = 0x0A
      oversizedPng[6] = 0x1A
      oversizedPng[7] = 0x0A
      expect(() => validateImageBuffer(oversizedPng, 2 * 1024 * 1024)).toThrow(/exceeds the maximum allowed limit/)
    })
  })

  describe('3. Route Protection & Role-Based Authorization', () => {
    it('should reject unauthenticated access to /admin with 401', async () => {
      const res = await makeRequest('/admin/settings')
      expect(res.statusCode).toBe(401)
      expect(res.body).toContain('Not authenticated')
    })

    it('should reject unauthenticated calls to siteSettings.adminGetList with 401 UNAUTHORIZED', async () => {
      const res = await makeRequest('/trpc/siteSettings.adminGetList')
      expect(res.statusCode).toBe(401)
      expect(res.body).toContain('UNAUTHORIZED')
    })

    it('should reject unauthenticated calls to auditLogs.adminGetList with 401 UNAUTHORIZED', async () => {
      const res = await makeRequest('/trpc/auditLogs.adminGetList')
      expect(res.statusCode).toBe(401)
      expect(res.body).toContain('UNAUTHORIZED')
    })

    it('should reject unauthenticated POST to /api/admin/media/upload-logo with 401 or 403', async () => {
      const res = await makeRequest('/api/admin/media/upload-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: 'test' }),
      })
      expect([401, 403]).toContain(res.statusCode)
    })
  })

  describe('4. CSRF Protection on State-Changing Endpoints', () => {
    it('should reject state-changing POST requests without CSRF token with 403', async () => {
      const res = await makeRequest('/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      expect(res.statusCode).toBe(403)
      expect(res.body).toContain('Invalid CSRF token')
    })
  })

  describe('5. Security Headers & Correlation IDs', () => {
    it('should send X-Content-Type-Options: nosniff on all responses', async () => {
      const res = await makeRequest('/health')
      expect(res.headers['x-content-type-options']).toBe('nosniff')
    })

    it('should send X-Frame-Options: SAMEORIGIN on all responses', async () => {
      const res = await makeRequest('/health')
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN')
    })

    it('should assign a correlation ID (x-request-id) to every response', async () => {
      const res = await makeRequest('/health')
      expect(res.headers['x-request-id']).toBeTruthy()
    })
  })

  describe('6. Accuracy of Product Language & Non-Claim of Precious Materials', () => {
    it('should never claim to sell real gold or diamonds in schema or defaults', () => {
      const defaultText = JSON.stringify(DEFAULT_SITE_SETTINGS)
      expect(defaultText.toLowerCase()).not.toContain('solid gold')
      expect(defaultText.toLowerCase()).not.toContain('real gold')
      expect(defaultText.toLowerCase()).not.toContain('real diamond')

      expect(defaultText.toLowerCase()).toContain('imitation')
      expect(defaultText.toLowerCase()).toContain('rental ornaments')
      expect(defaultText.toLowerCase()).toContain('cosmetics')
    })
  })
})
