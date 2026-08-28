import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Trash2,
  MessageCircle,
  Copy,
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Sparkles,
  Lock,
  CheckCircle2,
  Tag,
  Smartphone
} from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useEnquiryList } from '@/hooks/useEnquiryBasket'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { useAuth, useGuestAutoConvert } from '@/hooks/useAuth'
import { useCrmWebhook } from '@/hooks/useCrmWebhook'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { buildWhatsAppUrl, generateWhatsAppMessage } from '@/lib/whatsapp'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { AddressManager, DeliveryAddressData } from '@/components/checkout/AddressManager'
import { AuthModal } from '@/components/auth/AuthModal'
import { WelcomeIncentive } from '@/components/onboarding/WelcomeIncentive'

export function EnquiryPage() {
  const { data: settings } = useSiteSettings()
  const { user, isAuthenticated } = useAuth()
  const { items, removeItem, clearList, itemCount } = useEnquiryList()
  const guestAutoConvertMutation = useGuestAutoConvert()

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false)

  // Checkout Mode: 'whatsapp' | 'online'
  const [checkoutMode, setCheckoutMode] = useState<'whatsapp' | 'online'>('online')

  // Selected Delivery Address
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddressData | null>(null)
  const [customerName, setCustomerName] = useState(user?.name || '')
  const [customerPhone, setCustomerPhone] = useState((user as any)?.phone || '')
  const [customerEmail, setCustomerEmail] = useState(user?.email || '')
  const [shippingAddress, setShippingAddress] = useState((user as any)?.deliveryAddress || '')
  const [city, setCity] = useState((user as any)?.city || '')
  const [state, setState] = useState((user as any)?.state || '')
  const [pincode, setPincode] = useState((user as any)?.pincode || '')
  const [note, setNote] = useState('')

  // Promo Code State
  const [couponCodeInput, setCouponCodeInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null)

  // Payment Method: 'prepaid_upi' | 'cards' | 'cod' | 'stripe'
  const [paymentMethod, setPaymentMethod] = useState<'prepaid_upi' | 'cards' | 'cod' | 'stripe'>('prepaid_upi')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null)

  // 15s Abandoned Cart Inactivity Trigger Simulator
  useCrmWebhook(
    items.map(i => ({
      id: i.productId,
      name: i.productName,
      price: Number(i.price || i.salePrice || 0),
      imageUrl: i.productImage,
      itemCode: i.itemCode,
    })),
    !!confirmedOrderId
  )

  // Sync user details when auth changes
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name || '')
      if (!customerEmail) setCustomerEmail(user.email || '')
      if (!customerPhone && (user as any).phone) setCustomerPhone((user as any).phone)
      if (!shippingAddress && (user as any).deliveryAddress) setShippingAddress((user as any).deliveryAddress)
      if (!city && (user as any).city) setCity((user as any).city)
      if (!state && (user as any).state) setState((user as any).state)
      if (!pincode && (user as any).pincode) setPincode((user as any).pincode)

      if ((user as any).isFirstOrder && !appliedCoupon) {
        setAppliedCoupon({ code: 'WELCOME10', percent: 10 })
      }
    }
  }, [user])

  // Update form fields when an address is chosen in AddressManager
  const handleSelectAddress = (addr: DeliveryAddressData) => {
    setSelectedAddress(addr)
    setCustomerName(addr.fullName)
    setCustomerPhone(addr.phone)
    setShippingAddress(addr.streetAddress)
    setCity(addr.city)
    setState(addr.state)
    setPincode(addr.pincode)
  }

  const createEnquiryMutation = trpc.enquiries.createEnquiry.useMutation()

  // Calculations
  const subtotal = items.reduce((acc, item) => {
    const val = Number(item.price || item.salePrice || 0)
    return acc + (isNaN(val) ? 0 : val)
  }, 0)

  // 10% coupon discount
  const welcomeDiscount = appliedCoupon && subtotal > 0 ? Math.round(subtotal * (appliedCoupon.percent / 100)) : 0
  const afterCouponSubtotal = Math.max(0, subtotal - welcomeDiscount)

  // 5% instant discount for prepaid UPI / cards
  const isPrepaid = paymentMethod === 'prepaid_upi' || paymentMethod === 'cards' || paymentMethod === 'stripe'
  const prepaidDiscount = isPrepaid && afterCouponSubtotal > 0 ? Math.round(afterCouponSubtotal * 0.05) : 0
  const totalDiscount = welcomeDiscount + prepaidDiscount

  const codFee = paymentMethod === 'cod' ? 50 : 0
  const grandTotal = Math.max(0, afterCouponSubtotal - prepaidDiscount + codFee)

  const handleApplyCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanCode = couponCodeInput.trim().toUpperCase()
    if (cleanCode === 'WELCOME10' || cleanCode === 'SHEAURA10') {
      setAppliedCoupon({ code: 'WELCOME10', percent: 10 })
      toast.success('🎉 WELCOME10 applied: Extra 10% discount unlocked!')
      setCouponCodeInput('')
    } else if (cleanCode) {
      toast.error('Invalid promo code. Try WELCOME10 for first order.')
    }
  }

  // Handle Online Delivery Checkout Submit with Silent Guest-to-Account Auto-Conversion
  const handleOnlineCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      toast.error('Your order list is empty')
      return
    }
    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim() || !pincode.trim()) {
      toast.error('Please fill in your complete delivery address and phone number')
      return
    }

    setIsSubmitting(true)
    try {
      // If guest checkout, silently auto-convert to member account
      if (!isAuthenticated) {
        try {
          await guestAutoConvertMutation.mutateAsync({
            fullName: customerName.trim(),
            phone: customerPhone.trim(),
            email: customerEmail.trim() || undefined,
            streetAddress: shippingAddress.trim(),
            city: city.trim() || 'City Hub',
            state: state.trim() || 'State',
            pincode: pincode.trim(),
          })
        } catch {
          // Silent fallback
        }
      }

      const cleanDigits = customerPhone.replace(/\D/g, '')
      const fallbackEmail = customerEmail.trim() || (user?.email ?? (cleanDigits + '@phone.sheaura.com'))

      const res = await createEnquiryMutation.mutateAsync({
        name: customerName.trim(),
        email: fallbackEmail,
        phone: customerPhone.trim(),
        preferredContact: paymentMethod === 'cod' ? 'whatsapp' : 'phone',
        shippingAddress: shippingAddress.trim(),
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim(),
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'cash_on_delivery' : 'pending',
        prepaidDiscount: totalDiscount,
        deliveryPickup: 'delivery',
        message: note.trim() || (appliedCoupon ? ('[Promo Code Applied: ' + appliedCoupon.code + ']') : undefined),
        items: items.map(i => ({
          productId: i.productId,
          quantity: 1,
          mode: 'sale',
        })),
      })

      setConfirmedOrderId(res.enquiryId)
      clearList()
      toast.success('Order placed successfully! Check your account for tracking.')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to place order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle WhatsApp Concierge Submit
  const handleOpenWhatsApp = () => {
    const url = buildWhatsAppUrl({
      items: items.map(i => ({ itemCode: i.itemCode, name: i.productName, price: i.price || i.salePrice })),
      customerName: customerName || (user?.name ?? 'Valued Customer'),
      note: note + (appliedCoupon ? (' (Applied Coupon: ' + appliedCoupon.code + ' for 10% Off)') : ''),
      whatsappNumber: settings?.whatsappNumber,
      brandName: settings?.brandName || 'Sheaura',
    })

    if (items.length > 0) {
      try {
        createEnquiryMutation.mutate({
          name: customerName.trim() || (user?.name ?? 'WhatsApp Shopper'),
          email: customerEmail.trim() || (user?.email ?? 'guest@sheaura.com'),
          phone: customerPhone.trim() || undefined,
          preferredContact: 'whatsapp',
          paymentMethod: 'whatsapp',
          message: note.trim() || undefined,
          items: items.map(i => ({
            productId: i.productId,
            quantity: 1,
            mode: 'sale',
          })),
        })
      } catch {
        // Silent catch
      }
    }

    window.open(url, '_blank', 'noopener,noreferrer')
    toast.success('Opening WhatsApp Concierge!')
  }

  const handleCopyMessage = () => {
    const message = generateWhatsAppMessage({
      items: items.map(i => ({ itemCode: i.itemCode, name: i.productName, price: i.price || i.salePrice })),
      customerName: customerName || (user?.name ?? 'Valued Customer'),
      note: note + (appliedCoupon ? (' (Applied Coupon: ' + appliedCoupon.code + ')') : ''),
      brandName: settings?.brandName || 'Sheaura',
    })
    navigator.clipboard.writeText(message)
    toast.success('Order details copied to clipboard!')
  }

  // Order Confirmed State
  if (confirmedOrderId) {
    return (
      <div className="container-sheaura py-16 lg:py-24 max-w-xl mx-auto text-center space-y-6 animate-fade-in">
        <Card className="card-sheaura p-8 sm:p-10 border border-emerald-500/30 bg-card shadow-xl space-y-6">
          <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20">
              Order Confirmed
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-foreground">
              Thank You For Your Order!
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Your order <strong className="text-foreground">#{confirmedOrderId.slice(0, 8).toUpperCase()}</strong> has been safely recorded and will be prepared for express delivery.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Recipient:</span>
              <span className="font-medium text-foreground">{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact Phone:</span>
              <span className="font-medium text-foreground">{customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Destination:</span>
              <span className="font-medium text-foreground text-right">{shippingAddress}, {city}, {state} - {pincode}</span>
            </div>
            <div className="flex justify-between border-t border-border/80 pt-2 font-semibold">
              <span>Total Amount:</span>
              <span className="text-amber-700 dark:text-amber-400 font-display text-sm">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button asChild className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs h-10 shadow-sm">
              <Link to="/account">View Order in My Account</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 text-xs h-10 border-border">
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Empty Cart State
  if (items.length === 0) {
    return (
      <div className="container-sheaura py-20 text-center max-w-md mx-auto space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-medium text-foreground">Your Order Bag is Empty</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Explore our curated collections of matte gold bridal chokers, temple jhumkas, and kadas.
          </p>
        </div>
        <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-10 px-6 font-medium shadow-sm">
          <Link to="/shop">Explore Jewellery Catalogue</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container-sheaura py-8 lg:py-16 space-y-8 animate-fade-in">
      {/* Auth & Welcome Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(_user, _isNew, isFirst) => {
          if (isFirst) {
            setIsWelcomeModalOpen(true)
          }
        }}
      />
      <WelcomeIncentive
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
        onApplyCoupon={(code, percent) => {
          setAppliedCoupon({ code, percent })
        }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/shop" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              <span>Continue Shopping</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-foreground">
            Complete Your Jewellery Order
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Express insured delivery across India & worldwide. 5% instant discount on prepaid payments.
          </p>
        </div>

        {/* 1-Tap OTP Login CTA Banner (If guest) */}
        {!isAuthenticated && (
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-medium transition-all shadow-xs cursor-pointer"
          >
            <Smartphone className="h-4 w-4 text-amber-600" />
            <span>One-Tap Mobile Login for <strong>10% OFF</strong></span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Bag Summary & Pricing Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="card-sheaura border border-border shadow-sm">
            <CardHeader className="p-5 pb-3 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-display">Selected Items ({itemCount})</CardTitle>
                <CardDescription className="text-xs">Review your handcrafted jewellery</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearList}
                className="text-[11px] text-destructive hover:bg-destructive/10 h-7 px-2 cursor-pointer"
              >
                Clear All
              </Button>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="divide-y divide-border max-h-[380px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.productId} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-14 h-14 rounded-xl object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center text-xs text-amber-700 shrink-0">
                          Jewel
                        </div>
                      )}
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-xs sm:text-sm font-medium text-foreground line-clamp-1">
                          {item.productName}
                        </h4>
                        <span className="text-[11px] text-muted-foreground block">
                          Code: {item.itemCode || 'SH-N/A'}
                        </span>
                        <span className="text-xs font-semibold text-foreground font-display block">
                          {formatCurrency(Number(item.price || item.salePrice || 0))}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted shrink-0 cursor-pointer"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Promo / Coupon Input */}
              <div className="pt-2 border-t border-border">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Tag className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Coupon <strong>{appliedCoupon.code}</strong> applied (-{appliedCoupon.percent}%)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAppliedCoupon(null)}
                      className="text-[11px] text-muted-foreground hover:text-destructive underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                        placeholder="Promo Code (e.g. WELCOME10)"
                        className="h-9 pl-8 text-xs font-mono uppercase tracking-wider"
                      />
                    </div>
                    <Button type="submit" size="sm" variant="outline" className="h-9 text-xs border-amber-600/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer">
                      Apply
                    </Button>
                  </form>
                )}
              </div>

              <Separator />

              {/* Price Summary Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground font-medium">{formatCurrency(subtotal)}</span>
                </div>

                {welcomeDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Member Welcome Discount (10%)</span>
                    </span>
                    <span>-{formatCurrency(welcomeDiscount)}</span>
                  </div>
                )}

                {prepaidDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Prepaid Instant Discount (5%)</span>
                    </span>
                    <span>-{formatCurrency(prepaidDiscount)}</span>
                  </div>
                )}

                {codFee > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>COD Convenience Handling</span>
                    <span className="text-foreground font-medium">+{formatCurrency(codFee)}</span>
                  </div>
                )}

                <div className="flex justify-between text-muted-foreground">
                  <span>Domestic Insured Shipping</span>
                  <span className="text-emerald-600 font-medium uppercase text-[11px]">FREE</span>
                </div>

                <div className="flex justify-between text-sm sm:text-base font-bold text-foreground pt-2 border-t border-border font-display">
                  <span>Total Amount</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-600/20 text-[11px] text-amber-900 dark:text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                  <span>Sheaura Quality Guarantee</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  6–12 month micro-gold plating guarantee • 24–72h replacement policy with unboxing video • 100% skin-safe brass core.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Dual Checkout Tabs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Tabs value={checkoutMode} onValueChange={(v: string) => setCheckoutMode(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/60 p-1.5 rounded-2xl mb-6">
              <TabsTrigger value="online" className="gap-2 text-xs sm:text-sm py-2.5">
                <Truck className="h-4 w-4" />
                <span>Online Delivery & Payment</span>
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="gap-2 text-xs sm:text-sm py-2.5">
                <MessageCircle className="h-4 w-4" />
                <span>Buy via WhatsApp</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Full Online Delivery Checkout */}
            <TabsContent value="online" className="space-y-6">
              <Card className="card-sheaura border border-border shadow-sm">
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-display">1. Shipping & Delivery Address</CardTitle>
                    {isAuthenticated ? (
                      <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-500/10 border-emerald-500/20">
                        Logged in as {user?.name || user?.email}
                      </Badge>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAuthModalOpen(true)}
                        className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-medium cursor-pointer"
                      >
                        1-Tap OTP Sign In for saved address
                      </button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-0 space-y-6">
                  {/* Smart Address Manager with Pincode Lookup & Multi-Address Cards */}
                  <AddressManager
                    selectedAddress={selectedAddress}
                    onSelectAddress={handleSelectAddress}
                  />

                  <form onSubmit={handleOnlineCheckout} className="space-y-6 pt-2">
                    {/* Optional Bridal Date / Delivery Note */}
                    <div className="space-y-1.5">
                      <Label htmlFor="chk-notes" className="text-xs font-semibold">Special Instructions or Bridal Event Date (Optional)</Label>
                      <Textarea
                        id="chk-notes"
                        placeholder="e.g. Please deliver before Dec 12th for wedding muhurtham ceremony."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        className="text-xs resize-none"
                      />
                    </div>

                    <Separator />

                    {/* Step 2: Payment Method */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-display font-medium text-foreground">
                          2. Select Payment Method
                        </Label>
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          256-Bit Encrypted
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Option 1: Prepaid UPI */}
                        <div
                          onClick={() => setPaymentMethod('prepaid_upi')}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                            paymentMethod === 'prepaid_upi'
                              ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/20 ring-1 ring-amber-600 shadow-sm'
                              : 'border-border bg-card hover:border-amber-600/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-foreground">UPI (GPay / PhonePe / Paytm)</span>
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] px-1.5 py-0">
                              5% OFF
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">Instant confirmation & priority dispatches</p>
                        </div>

                        {/* Option 2: Credit / Debit Cards */}
                        <div
                          onClick={() => setPaymentMethod('cards')}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                            paymentMethod === 'cards'
                              ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/20 ring-1 ring-amber-600 shadow-sm'
                              : 'border-border bg-card hover:border-amber-600/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-foreground">Credit / Debit Cards / Netbanking</span>
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] px-1.5 py-0">
                              5% OFF
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">Visa, Mastercard, RuPay & EMI</p>
                        </div>

                        {/* Option 3: Cash On Delivery (COD) */}
                        <div
                          onClick={() => setPaymentMethod('cod')}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                            paymentMethod === 'cod'
                              ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/20 ring-1 ring-amber-600 shadow-sm'
                              : 'border-border bg-card hover:border-amber-600/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-foreground">Cash On Delivery (COD)</span>
                            <span className="text-[10px] text-muted-foreground">+₹50 fee</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">WhatsApp OTP verification required</p>
                        </div>

                        {/* Option 4: International Stripe */}
                        <div
                          onClick={() => setPaymentMethod('stripe')}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                            paymentMethod === 'stripe'
                              ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/20 ring-1 ring-amber-600 shadow-sm'
                              : 'border-border bg-card hover:border-amber-600/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-foreground">International Cards (Stripe)</span>
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] px-1.5 py-0">
                              5% OFF
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">USD, AED, GBP, SGD accepted</p>
                        </div>
                      </div>
                    </div>

                    {/* Final CTA Button */}
                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting || items.length === 0}
                        className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>
                          {isSubmitting ? 'Placing Order...' : ('Place Order • ' + formatCurrency(grandTotal))}
                        </span>
                      </Button>
                      <p className="text-center text-[11px] text-muted-foreground mt-2">
                        By placing your order, you agree to Sheaura's <Link to="/account-policy" className="underline text-amber-700 dark:text-amber-400">Account & Delivery Policy</Link>.
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: WhatsApp Concierge Checkout */}
            <TabsContent value="whatsapp" className="space-y-6">
              <Card className="card-sheaura border border-border shadow-sm">
                <CardHeader className="p-6 pb-4">
                  <CardTitle className="text-lg font-display">1-Click WhatsApp Order Concierge</CardTitle>
                  <CardDescription className="text-xs">
                    Instantly transmit your items and item codes directly to Sheaura's senior bridal stylists.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-300 space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <MessageCircle className="h-4 w-4 text-emerald-600" />
                      <span>Official Styling Helpline: {settings?.phone || '+91 9995098294'}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Our concierge will immediately review your bridal requirements, check matching necklace lengths, and share payment QR codes.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="wa-name" className="text-xs font-semibold">Your Name</Label>
                      <Input
                        id="wa-name"
                        placeholder="e.g. Meera Menon"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="h-10 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="wa-note" className="text-xs font-semibold">Add Styling Notes or Event Dates</Label>
                      <Textarea
                        id="wa-note"
                        placeholder="e.g. Wedding is in November. Need matching jhumkas with this choker."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        className="text-xs resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      onClick={handleOpenWhatsApp}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-11 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Open in WhatsApp</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCopyMessage}
                      className="text-xs h-11 border-border flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Order Text</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}