import 'dotenv/config'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startTestServer, stopTestServer } from './testHelper.js'
import { getPincodeDetails } from '../trpc/routers/pincode.js'
import { appRouter } from '../trpc/router.js'
import { db } from '../db/index.js'

describe('Frictionless Mobile OTP Auth, Smart Address & Onboarding Test Suite', () => {
  beforeAll(async () => {
    await startTestServer()
  })

  afterAll(async () => {
    await stopTestServer()
  })

  // 1. PIN Code Resolution & Delivery Intelligence Tests
  describe('1. Indian PIN Code Directory & Geolocation Intelligence', () => {
    it('should accurately resolve exact Indian pincodes with city, state and COD availability', () => {
      // Kerala
      const kochi = getPincodeDetails('682001')
      expect(kochi.city).toBe('Kochi')
      expect(kochi.state).toBe('Kerala')
      expect(kochi.isCodAvailable).toBe(true)
      expect(kochi.estimatedDeliveryDays).toBe('2-3')

      // Tamil Nadu
      const chennai = getPincodeDetails('600001')
      expect(chennai.city).toContain('Chennai')
      expect(chennai.state).toBe('Tamil Nadu')
      expect(chennai.isCodAvailable).toBe(true)

      // Karnataka
      const bangalore = getPincodeDetails('560001')
      expect(bangalore.city).toContain('Bengaluru')
      expect(bangalore.state).toBe('Karnataka')

      // Maharashtra
      const mumbai = getPincodeDetails('400001')
      expect(mumbai.city).toContain('Mumbai')
      expect(mumbai.state).toBe('Maharashtra')

      // Delhi NCR
      const delhi = getPincodeDetails('110001')
      expect(delhi.city).toContain('New Delhi')
      expect(delhi.state).toBe('Delhi')
    })

    it('should intelligently fall back to regional state circle for unregistered 6-digit codes', () => {
      // 67xxxx -> Kerala Circle fallback
      const randomKerala = getPincodeDetails('679999')
      expect(randomKerala.state).toBe('Kerala')
      expect(randomKerala.isCodAvailable).toBe(true)

      // 41xxxx -> Maharashtra Circle fallback
      const randomMaha = getPincodeDetails('419999')
      expect(randomMaha.state).toBe('Maharashtra')
    })
  })

  // 2. Mobile OTP Flow & Headless Account Creation
  describe('2. Headless Mobile OTP Authentication & Account Auto-Provisioning', () => {
    it('should generate and return 4-digit demo OTP in test environment', async () => {
      const caller = appRouter.createCaller({
        req: { session: {} } as any,
        user: null,
        db,
      } as any)

      const testPhone = '9995098294'
      const sendRes = await caller.auth.sendOtp({
        phone: testPhone,
        countryCode: '+91',
      })

      expect(sendRes.success).toBe(true)
      expect(sendRes.phone).toBe('+919995098294')
      expect(sendRes.demoOtp).toBe('1234')
    })

    it('should reject incorrect OTP codes', async () => {
      const caller = appRouter.createCaller({
        req: { session: {} } as any,
        user: null,
        db,
      } as any)

      await expect(
        caller.auth.verifyOtp({
          phone: '9995098294',
          countryCode: '+91',
          code: '9999', // Incorrect code
        })
      ).rejects.toThrow('Invalid OTP code')
    })

    it('should successfully verify valid OTP and return authenticated user with first-order welcome state', async () => {
      const sessionObj: any = {}
      const caller = appRouter.createCaller({
        req: { session: sessionObj } as any,
        user: null,
        db,
      } as any)

      const testPhone = '9995098294'
      await caller.auth.sendOtp({
        phone: testPhone,
        countryCode: '+91',
      })

      const verifyRes = await caller.auth.verifyOtp({
        phone: testPhone,
        countryCode: '+91',
        code: '1234',
        fullName: 'Aishwarya Lakshmi',
      })

      expect(verifyRes.success).toBe(true)
      expect(verifyRes.user).toBeDefined()
      expect(verifyRes.user.phone).toBe('+919995098294')
      expect(verifyRes.user.name).toBe('Aishwarya Lakshmi')
      expect(sessionObj.userId).toBe(verifyRes.user.id)
    })
  })

  // 3. Silent Guest-to-Account Auto-Conversion on Checkout
  describe('3. Silent Guest-to-Account Auto-Conversion', () => {
    it('should silently convert guest checkout details into member account & saved address', async () => {
      const sessionObj: any = {}
      const caller = appRouter.createCaller({
        req: { session: sessionObj } as any,
        user: null,
        db,
      } as any)

      const guestRes = await caller.auth.guestAutoConvert({
        fullName: 'Priya Raman',
        phone: '9845012345',
        email: 'priya.raman@example.com',
        streetAddress: 'Flat 102, Emerald Heights, MG Road',
        city: 'Kochi',
        state: 'Kerala',
        pincode: '682001',
      })

      expect(guestRes.success).toBe(true)
      expect(guestRes.user.name).toBe('Priya Raman')
      expect(guestRes.user.email).toBe('priya.raman@example.com')
      expect(sessionObj.userId).toBe(guestRes.user.id)
    })
  })

  // 4. Welcome Incentive Coupon Engine
  describe('4. Welcome Incentive Engine', () => {
    it('should allow user to claim welcome coupon', async () => {
      const unauthCaller = appRouter.createCaller({
        req: { session: {} } as any,
        user: null,
        db,
      } as any)

      await unauthCaller.auth.sendOtp({
        phone: '9888877777',
        countryCode: '+91',
      })

      const loginRes = await unauthCaller.auth.verifyOtp({
        phone: '9888877777',
        countryCode: '+91',
        code: '1234',
        fullName: 'Coupon Tester',
      })

      const caller = appRouter.createCaller({
        req: { session: { userId: loginRes.user.id } } as any,
        user: loginRes.user as any,
        db,
      } as any)

      const res = await caller.auth.claimWelcomeCoupon()
      expect(res.success).toBe(true)
      expect(res.couponCode).toBe('WELCOME10')
      expect(res.discountPercent).toBe(10)
    })
  })
})
