import { useState, useEffect } from 'react'
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
  CheckCircle2
} from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useEnquiryList } from '@/hooks/useEnquiryBasket'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { useAuth } from '@/hooks/useAuth'
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

export function EnquiryPage() {
  const { data: settings } = useSiteSettings()
  const { user, isAuthenticated } = useAuth()
  const { items, removeItem, clearList, itemCount } = useEnquiryList()

  // Checkout Mode: 'whatsapp' | 'online'
  const [checkoutMode, setCheckoutMode] = useState<'whatsapp' | 'online'>('online')

  // Form Fields
  const [customerName, setCustomerName] = useState(user?.name || '')
  const [customerPhone, setCustomerPhone] = useState((user as any)?.phone || '')
  const [customerEmail, setCustomerEmail] = useState(user?.email || '')
  const [shippingAddress, setShippingAddress] = useState((user as any)?.deliveryAddress || '')
  const [city, setCity] = useState((user as any)?.city || '')
  const [state, setState] = useState((user as any)?.state || '')
  const [pincode, setPincode] = useState((user as any)?.pincode || '')
  const [note, setNote] = useState('')

  // Payment Method: 'prepaid_upi' | 'cards' | 'cod' | 'stripe'
  const [paymentMethod, setPaymentMethod] = useState<'prepaid_upi' | 'cards' | 'cod' | 'stripe'>('prepaid_upi')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null)

  // Sync user details when auth loads
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name || '')
      if (!customerEmail) setCustomerEmail(user.email || '')
      if (!customerPhone && (user as any).phone) setCustomerPhone((user as any).phone)
      if (!shippingAddress && (user as any).deliveryAddress) setShippingAddress((user as any).deliveryAddress)
      if (!city && (user as any).city) setCity((user as any).city)
      if (!state && (user as any).state) setState((user as any).state)
      if (!pincode && (user as any).pincode) setPincode((user as any).pincode)
    }
  }, [user])

  const createEnquiryMutation = trpc.enquiries.createEnquiry.useMutation()

  // Calculations
  const subtotal = items.reduce((acc, item) => {
    const val = Number(item.price || item.salePrice || 0)
    return acc + (isNaN(val) ? 0 : val)
  }, 0)

  // 5% instant discount for prepaid UPI / cards
  const isPrepaid = paymentMethod === 'prepaid_upi' || paymentMethod === 'cards' || paymentMethod === 'stripe'
  const prepaidDiscount = isPrepaid && subtotal > 0 ? Math.round(subtotal * 0.05) : 0
  const codFee = paymentMethod === 'cod' ? 50 : 0
  const grandTotal = Math.max(0, subtotal - prepaidDiscount + codFee)

  // Handle Online Delivery Checkout Submit
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
      const res = await createEnquiryMutation.mutateAsync({
        name: customerName.trim(),
        email: customerEmail.trim() || (user?.email ?? 'customer@sheaura.com'),
        phone: customerPhone.trim(),
        preferredContact: paymentMethod === 'cod' ? 'whatsapp' : 'phone',
        shippingAddress: shippingAddress.trim(),
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: pincode.trim(),
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'cash_on_delivery' : 'pending',
        prepaidDiscount: prepaidDiscount,
        deliveryPickup: 'delivery',
        message: note.trim() || undefined,
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
      note,
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
      note,
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
              <span className="text-muted-foreground">Payment Mode:</span>
              <span className="font-medium text-foreground uppercase">{paymentMethod.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border/80">
              <span className="font-semibold text-foreground">Total Payable:</span>
              <span className="font-bold text-foreground font-display text-sm">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              asChild
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm h-11 shadow-sm"
            >
              <Link to="/account">View Order in My Account</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full text-xs h-10 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 gap-2"
            >
              <a
                href={"https://wa.me/919995098294?text=" + encodeURIComponent("Hello Sheaura, I have placed Order #" + confirmedOrderId.slice(0, 8).toUpperCase() + " for ₹" + grandTotal + ". Please confirm dispatch.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Confirm Instantly on WhatsApp</span>
              </a>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Empty Cart State
  if (items.length === 0) {
    return (
      <div className="animate-fade-in min-h-[65vh] flex items-center justify-center">
        <div className="container-sheaura text-center py-16">
          <div className="max-w-md mx-auto p-8 rounded-3xl border border-amber-900/15 bg-card shadow-sm space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-800 dark:text-amber-300">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Your Order Bag is Empty
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Explore our handcrafted 1-gram gold plated jewellery sets and add your favourite pieces.
              </p>
            </div>
            <Button asChild size="lg" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm shadow-md">
              <Link to="/shop">Explore Jewellery Catalogue</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-sheaura py-8 sm:py-12 lg:py-16 space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Badge variant="outline" className="text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-600/30 mb-2">
            Secure Jewellery Checkout
          </Badge>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground">
            Order & Enquiry Checkout
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Choose between instant WhatsApp concierge booking or direct online delivery checkout.
          </p>
        </div>

        <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-foreground w-fit">
          <Link to="/shop">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            <span>Continue Shopping</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Order Bag Items (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="card-sheaura border border-border shadow-sm">
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-base font-display">Selected Pieces ({itemCount})</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearList}
                className="text-[11px] text-destructive hover:bg-destructive/10 h-7 px-2"
              >
                Clear All
              </Button>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="divide-y divide-border max-h-[420px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.productId} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
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
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted shrink-0"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Price Summary Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground font-medium">{formatCurrency(subtotal)}</span>
                </div>
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
                    <CardTitle className="text-lg font-display">1. Shipping & Contact Details</CardTitle>
                    {isAuthenticated ? (
                      <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-500/10 border-emerald-500/20">
                        Logged in as {user?.email}
                      </Badge>
                    ) : (
                      <Link to="/login" className="text-xs text-amber-700 dark:text-amber-400 hover:underline">
                        Sign In for autofill
                      </Link>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-0">
                  <form onSubmit={handleOnlineCheckout} className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="chk-name" className="text-xs font-semibold">Recipient Full Name *</Label>
                          <Input
                            id="chk-name"
                            placeholder="e.g. Ananya Sharma"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            required
                            className="h-10 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="chk-phone" className="text-xs font-semibold">Phone / WhatsApp Number *</Label>
                          <Input
                            id="chk-phone"
                            placeholder="+91 9995098294"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            required
                            className="h-10 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="chk-address" className="text-xs font-semibold">Delivery Street Address *</Label>
                        <Input
                          id="chk-address"
                          placeholder="Flat/House No, Building, Street, Area..."
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          required
                          className="h-10 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="chk-city" className="text-xs font-semibold">City / District</Label>
                          <Input
                            id="chk-city"
                            placeholder="Kochi"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="h-10 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="chk-state" className="text-xs font-semibold">State</Label>
                          <Input
                            id="chk-state"
                            placeholder="Kerala"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="h-10 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="chk-pincode" className="text-xs font-semibold">PIN Code *</Label>
                          <Input
                            id="chk-pincode"
                            placeholder="682001"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            required
                            className="h-10 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Payment Method Selector */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-display font-semibold text-foreground">2. Select Payment Method</h3>
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                          5% Instant Discount on Prepaid
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Option 1: Prepaid UPI */}
                        <div
                          onClick={() => setPaymentMethod('prepaid_upi')}
                          className={"p-4 rounded-2xl border cursor-pointer transition-all " + (paymentMethod === 'prepaid_upi' ? 'border-amber-600 bg-amber-500/10 shadow-xs ring-1 ring-amber-600' : 'border-border hover:border-amber-600/40 bg-card')}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={paymentMethod === 'prepaid_upi'}
                              onChange={() => setPaymentMethod('prepaid_upi')}
                              className="mt-1 text-amber-600 focus:ring-amber-500"
                            />
                            <div className="space-y-1">
                              <span className="text-xs font-bold block text-foreground">
                                UPI Instant (GPay / PhonePe / Paytm)
                              </span>
                              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-[10px]">
                                Save 5% Instantly
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Option 2: Cards / NetBanking */}
                        <div
                          onClick={() => setPaymentMethod('cards')}
                          className={"p-4 rounded-2xl border cursor-pointer transition-all " + (paymentMethod === 'cards' ? 'border-amber-600 bg-amber-500/10 shadow-xs ring-1 ring-amber-600' : 'border-border hover:border-amber-600/40 bg-card')}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={paymentMethod === 'cards'}
                              onChange={() => setPaymentMethod('cards')}
                              className="mt-1 text-amber-600 focus:ring-amber-500"
                            />
                            <div className="space-y-1">
                              <span className="text-xs font-bold block text-foreground">
                                Credit / Debit Card & NetBanking
                              </span>
                              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-[10px]">
                                Save 5% Instantly
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Option 3: Cash on Delivery */}
                        <div
                          onClick={() => setPaymentMethod('cod')}
                          className={"p-4 rounded-2xl border cursor-pointer transition-all " + (paymentMethod === 'cod' ? 'border-amber-600 bg-amber-500/10 shadow-xs ring-1 ring-amber-600' : 'border-border hover:border-amber-600/40 bg-card')}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={paymentMethod === 'cod'}
                              onChange={() => setPaymentMethod('cod')}
                              className="mt-1 text-amber-600 focus:ring-amber-500"
                            />
                            <div className="space-y-1">
                              <span className="text-xs font-bold block text-foreground">
                                Cash on Delivery (COD)
                              </span>
                              <p className="text-[10px] text-muted-foreground">+₹50 fee • WhatsApp OTP verification</p>
                            </div>
                          </div>
                        </div>

                        {/* Option 4: International Stripe */}
                        <div
                          onClick={() => setPaymentMethod('stripe')}
                          className={"p-4 rounded-2xl border cursor-pointer transition-all " + (paymentMethod === 'stripe' ? 'border-amber-600 bg-amber-500/10 shadow-xs ring-1 ring-amber-600' : 'border-border hover:border-amber-600/40 bg-card')}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={paymentMethod === 'stripe'}
                              onChange={() => setPaymentMethod('stripe')}
                              className="mt-1 text-amber-600 focus:ring-amber-500"
                            />
                            <div className="space-y-1">
                              <span className="text-xs font-bold block text-foreground">
                                International Cards (USD/AED/GBP)
                              </span>
                              <p className="text-[10px] text-muted-foreground">DHL/EMS 5–9 days</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="chk-note" className="text-xs font-semibold">Special Instructions or Bridal Event Date (Optional)</Label>
                      <Textarea
                        id="chk-note"
                        placeholder="e.g. Ring size 14, or need delivery before 15th for wedding ceremony..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="text-xs min-h-[60px]"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm h-12 shadow-md gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      <span>{isSubmitting ? 'Processing Order...' : 'Place Order • ' + formatCurrency(grandTotal)}</span>
                    </Button>

                    <p className="text-[11px] text-center text-muted-foreground">
                      By placing this order, you agree to Sheaura's{' '}
                      <Link to="/refund-policy" className="text-amber-700 underline">Return Policy (24–72h unboxing video)</Link> and{' '}
                      <Link to="/warranty-policy" className="text-amber-700 underline">Plating Warranty</Link>.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: WhatsApp Concierge Checkout */}
            <TabsContent value="whatsapp" className="space-y-6">
              <Card className="card-sheaura border border-border shadow-sm">
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-700">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-display">Personal Bridal Stylist on WhatsApp</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Direct connection to Sheaura Concierge at +91 9995098294.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-0 space-y-5">
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2 text-xs text-muted-foreground leading-relaxed">
                    <p className="font-semibold text-foreground">Why order via WhatsApp?</p>
                    <ul className="list-disc list-inside space-y-1 text-[11px]">
                      <li>Request high-resolution videos or real-light photographs of jewellery pieces.</li>
                      <li>Consult our stylist for matching sets (Harams, Chokers, Maang Tikkas).</li>
                      <li>Customized UPI payment links & instant tracking updates.</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="wa-name" className="text-xs font-semibold">Your Name (Optional)</Label>
                      <Input
                        id="wa-name"
                        placeholder="e.g. Priya Nair"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="h-10 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="wa-note" className="text-xs font-semibold">Custom Inquiries or Questions</Label>
                      <Textarea
                        id="wa-note"
                        placeholder="e.g. Can you share a video of the choker set in natural sunlight?"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="text-xs min-h-[70px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button
                      type="button"
                      onClick={handleOpenWhatsApp}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm h-12 shadow-md gap-2"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span>Send Order to WhatsApp Concierge</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyMessage}
                      className="w-full text-xs h-10 gap-2"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Order Details</span>
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
