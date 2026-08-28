import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'

export interface AbandonedCartItem {
  id: string
  name: string
  price: number
  imageUrl?: string
  itemCode?: string
}

export function useCrmWebhook(items: AbandonedCartItem[], isCheckingOut: boolean = false) {
  const { user } = useAuth()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    // If cart is empty or user is checking out or already triggered, clear timer
    if (!items || items.length === 0 || isCheckingOut || hasTriggeredRef.current) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      return
    }

    // Set 15-second abandonment timer
    timeoutRef.current = setTimeout(() => {
      if (items.length > 0 && !isCheckingOut && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true

        const userPhone = (user as any)?.phone || 'Guest Visitor'
        const userName = user?.name || 'Shopper'
        const totalValue = items.reduce((sum, item) => sum + (item.price || 0), 0)
        const discountedTotal = Math.round(totalValue * 0.95) // 5% prepaid discount pre-applied
        const recoveryUrl = `${window.location.origin}/enquiry?coupon=WELCOME10&prepaid=5`

        const webhookPayload = {
          event: 'cart.abandoned.15s_inactivity',
          timestamp: new Date().toISOString(),
          customer: {
            name: userName,
            phone: userPhone,
            email: user?.email || null,
          },
          items: items.map(i => ({
            name: i.name,
            code: i.itemCode || 'SH-JEWEL',
            price: i.price,
            image: i.imageUrl || null,
          })),
          summary: {
            originalTotal: totalValue,
            discountedTotal,
            preAppliedDiscount: '5% Instant Prepaid Discount + WELCOME10',
            recoveryCheckoutUrl: recoveryUrl,
          },
          whatsappDispatch: {
            destination: userPhone,
            message: `Hi ${userName}, you left something precious in your Sheaura bag! Complete your order now with an extra 5% prepaid discount: ${recoveryUrl}`,
            status: 'simulated_dispatched',
          },
        }

        console.info('[CRM WhatsApp Webhook Simulator] Abandoned Cart Triggered:', webhookPayload)

        // Store in sessionStorage so it can be inspected or used for recovery banner
        try {
          sessionStorage.setItem('sheaura_crm_abandoned_event', JSON.stringify(webhookPayload))
        } catch {}
      }
    }, 15000)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [items, user, isCheckingOut])

  return {
    resetTrigger: () => {
      hasTriggeredRef.current = false
    },
  }
}
