/**
 * Sheaura Platform Extension & Service Architecture
 * Modular interfaces and adapters for future production scaling.
 */

// 1. PAYMENT GATEWAY EXTENSION
export type PaymentMethodType = 'prepaid_upi' | 'razorpay' | 'stripe' | 'cod' | 'whatsapp'

export interface PaymentIntentPayload {
  orderId: string
  amount: number
  currency: string
  customerEmail: string
  customerPhone?: string
  description?: string
}

export interface PaymentIntentResult {
  id: string
  clientSecret?: string
  paymentUrl?: string
  provider: PaymentMethodType
  status: 'created' | 'pending' | 'succeeded' | 'failed'
}

export interface IPaymentProvider {
  createPaymentIntent(payload: PaymentIntentPayload): Promise<PaymentIntentResult>
  verifyWebhookSignature(payload: string, signature: string): Promise<boolean>
  refundPayment(paymentId: string, amount?: number): Promise<boolean>
}

// 2. SHIPPING & LOGISTICS EXTENSION
export interface ShippingRateRequest {
  pincode: string
  weightKg: number
  declaredValue: number
}

export interface ShippingRateQuote {
  provider: string
  serviceName: string
  rate: number
  estimatedDeliveryDays: number
}

export interface IShippingProvider {
  getRates(request: ShippingRateRequest): Promise<ShippingRateQuote[]>
  createShipment(orderId: string, address: Record<string, any>): Promise<{ trackingNumber: string; labelUrl?: string }>
  trackShipment(trackingNumber: string): Promise<{ status: string; history: Array<{ date: Date; location: string; activity: string }> }>
}

// 3. OMNICHANNEL NOTIFICATIONS EXTENSION
export interface NotificationPayload {
  recipient: {
    email?: string
    phone?: string
    name?: string
  }
  template: 'order_confirmed' | 'order_shipped' | 'otp_verification' | 'abandoned_cart'
  variables: Record<string, string | number>
}

export interface INotificationProvider {
  sendEmail(payload: NotificationPayload): Promise<boolean>
  sendSms(phone: string, text: string): Promise<boolean>
  sendWhatsAppMessage(phone: string, template: string, params: Record<string, string>): Promise<boolean>
}

// 4. COUPONS & INCENTIVE ENGINE
export interface CouponValidationResult {
  valid: boolean
  code: string
  discountAmount: number
  reason?: string
}

export interface ICouponEngine {
  validateCoupon(code: string, subtotal: number, userId?: string): Promise<CouponValidationResult>
  markCouponUsed(code: string, userId: string, orderId: string): Promise<void>
}

// Default No-op / WhatsApp-first Providers
export const defaultPaymentProvider: IPaymentProvider = {
  async createPaymentIntent(payload) {
    return {
      id: `pay_${payload.orderId}`,
      provider: 'whatsapp',
      status: 'pending',
    }
  },
  async verifyWebhookSignature() {
    return true
  },
  async refundPayment() {
    return true
  },
}
