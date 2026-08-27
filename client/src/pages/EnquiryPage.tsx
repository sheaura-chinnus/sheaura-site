import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ArrowLeft, Mail, Phone, MapPin, Loader2, CheckCircle, Lock, UserPlus } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useEnquiryBasket } from '@/hooks/useEnquiryBasket'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Toaster, toast } from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { useSiteSettings } from '@/hooks/useSiteSettings'

export function EnquiryPage() {
  const navigate = useNavigate()
  const { data: settings } = useSiteSettings()
  const { user, isAuthenticated } = useAuth()
  const currency = settings?.currency || 'INR'
  const {
    items,
    removeItem,
    updateQuantity,
    clearBasket,
  } = useEnquiryBasket()

  // Computed values
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalSalePrice = items
    .filter(item => item.mode === 'sale')
    .reduce((sum, item) => sum + (item.salePrice || 0) * item.quantity, 0)
  const totalRentalPrice = items
    .filter(item => item.mode === 'rental')
    .reduce((sum, item) => sum + (item.rentalPrice || 0) * item.quantity, 0)
  const totalDeposit = items
    .filter(item => item.mode === 'rental' && item.depositAmount)
    .reduce((sum, item) => sum + (item.depositAmount || 0) * item.quantity, 0)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[\d\s\-+()]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required'
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const createEnquiryMutation = trpc.enquiries.createEnquiry.useMutation({
    onSuccess: () => {
      toast.success('Enquiry submitted successfully! We\'ll get back to you soon.')
      clearBasket()
      navigate('/')
      setIsSubmitting(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit enquiry. Please try again.')
      setIsSubmitting(false)
    },
  })

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
      }))
    }
  }, [user])

  const handleGoogleLogin = () => {
    const apiUrl = (import.meta as any).env?.VITE_API_URL || ''
    window.location.href = `${apiUrl}/auth/google`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      toast.error('Authentication required: Please sign in before checking out.')
      navigate('/login?redirect=/enquiry')
      return
    }

    if (!validateForm()) return
    if (items.length === 0) {
      toast.error('Your enquiry basket is empty')
      return
    }

    setIsSubmitting(true)

    const enquiryItems = items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      mode: item.mode,
    }))

    createEnquiryMutation.mutate({
      items: enquiryItems,
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      message: formData.message || undefined,
    })
  }

  const getModeLabel = (mode: 'sale' | 'rental') => mode === 'sale' ? 'Purchase' : 'Rental'

  if (items.length === 0) {
    return (
      <div className="animate-fade-in min-h-[60vh] flex items-center justify-center">
        <div className="container-sheaura text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
              <Mail className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground mb-3">
              Your Enquiry Basket is Empty
            </h1>
            <p className="text-muted-foreground mb-8">
              Add products to your enquiry basket from the shop or product pages,
              then return here to submit your enquiry.
            </p>
            <Link to="/shop">
              <Button size="lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      {/* Page Header */}
      <section className="py-12 lg:py-16 bg-muted/30" aria-labelledby="enquiry-title">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto text-center">
            <h1 id="enquiry-title" className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium text-foreground mb-4">
              Enquiry Basket
            </h1>
            <p className="text-muted-foreground text-lg">
              Review your selected items and submit your enquiry.
              We'll contact you with availability, pricing, and next steps.
            </p>
          </div>
        </div>
      </section>

      <section className="section-spacing">
        <div className="container-sheaura">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Basket Items */}
            <div className="lg:col-span-2 space-y-4" aria-label="Enquiry items">
              {items.map((item, index) => (
                <Card key={`${item.productId}-${item.mode}`} className="flex flex-col sm:flex-row gap-4 overflow-hidden">
                  <div className="relative w-full sm:w-24 flex-shrink-0 aspect-square bg-muted/50 overflow-hidden">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="h-8 w-8 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <Badge variant="secondary" className="absolute top-2 left-2 capitalize">{item.mode}</Badge>
                  </div>

                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <Link to={`/product/${item.productSlug}`} className="block">
                        <h3 className="font-medium text-foreground line-clamp-2 mb-1 hover:text-primary transition-colors">
                          {item.productName}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{getModeLabel(item.mode)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-3">
                        <Label htmlFor={`qty-${index}`} className="text-sm font-medium text-foreground">
                          Qty:
                        </Label>
                        <div className="flex items-center border border-input rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.productId, item.mode, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-2 hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            id={`qty-${index}`}
                            type="number"
                            value={item.quantity}
                            min="1"
                            max="99"
                            onChange={(e) => updateQuantity(item.productId, item.mode, parseInt(e.target.value) || 1)}
                            className="w-12 text-center border-none focus:outline-none focus:ring-0 bg-transparent"
                            aria-label="Quantity"
                          />
                          <button
                            onClick={() => updateQuantity(item.productId, item.mode, item.quantity + 1)}
                            className="p-2 hover:bg-accent transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {formatCurrency(
                              item.mode === 'sale' ? (item.salePrice || 0) * item.quantity : (item.rentalPrice || 0) * item.quantity,
                              currency
                            )}
                          </p>
                          {item.mode === 'rental' && item.depositAmount && (
                            <p className="text-xs text-muted-foreground">
                              + {formatCurrency(item.depositAmount * item.quantity, currency)} deposit
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.mode)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          aria-label={`Remove ${item.productName} from enquiry`}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {items.length > 1 && (
                <Button variant="ghost" className="w-full justify-center" onClick={clearBasket}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Items
                </Button>
              )}
            </div>

            {/* Summary & Form */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader className="pb-4">
                  <CardTitle className="font-display text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 border-b border-border pb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(
                          (totalSalePrice || 0) + (totalRentalPrice || 0),
                          currency
                        )}
                      </span>
                    </div>
                    {(totalSalePrice || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Purchase items</span>
                        <span className="font-medium text-foreground">{formatCurrency(totalSalePrice || 0, currency)}</span>
                      </div>
                    )}
                    {(totalRentalPrice || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rental items</span>
                        <span className="font-medium text-foreground">{formatCurrency(totalRentalPrice || 0, currency)}</span>
                      </div>
                    )}
                    {(totalDeposit || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Refundable deposits</span>
                        <span className="font-medium text-foreground">{formatCurrency(totalDeposit || 0, currency)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-lg font-semibold">
                    <span>Estimated Total</span>
                    <span className="text-primary">
                      {formatCurrency(
                        (totalSalePrice || 0) + (totalRentalPrice || 0) + (totalDeposit || 0),
                        currency
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    * Final pricing and availability will be confirmed by our team.
                    Deposits are fully refundable upon safe return.
                  </p>

                  <Separator />

                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName" className="block text-sm font-medium mb-1">
                          Full Name *
                        </Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="John Doe"
                          aria-invalid={!!errors.fullName}
                          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                        />
                        {errors.fullName && (
                          <p id="fullName-error" className="text-sm text-destructive mt-1" role="alert">{errors.fullName}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="email" className="block text-sm font-medium mb-1">
                          Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="john@example.com"
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? 'email-error' : undefined}
                        />
                        {errors.email && (
                          <p id="email-error" className="text-sm text-destructive mt-1" role="alert">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="block text-sm font-medium mb-1">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                      />
                      {errors.phone && (
                        <p id="phone-error" className="text-sm text-destructive mt-1" role="alert">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="address" className="block text-sm font-medium mb-1">
                        Address *
                      </Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Main Street, Apt 4B"
                        aria-invalid={!!errors.address}
                        aria-describedby={errors.address ? 'address-error' : undefined}
                      />
                      {errors.address && (
                        <p id="address-error" className="text-sm text-destructive mt-1" role="alert">{errors.address}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city" className="block text-sm font-medium mb-1">
                          City *
                        </Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Mumbai"
                          aria-invalid={!!errors.city}
                          aria-describedby={errors.city ? 'city-error' : undefined}
                        />
                        {errors.city && (
                          <p id="city-error" className="text-sm text-destructive mt-1" role="alert">{errors.city}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="state" className="block text-sm font-medium mb-1">
                          State *
                        </Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="Maharashtra"
                          aria-invalid={!!errors.state}
                          aria-describedby={errors.state ? 'state-error' : undefined}
                        />
                        {errors.state && (
                          <p id="state-error" className="text-sm text-destructive mt-1" role="alert">{errors.state}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="pincode" className="block text-sm font-medium mb-1">
                          Pincode *
                        </Label>
                        <Input
                          id="pincode"
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                          placeholder="400001"
                          maxLength={6}
                          aria-invalid={!!errors.pincode}
                          aria-describedby={errors.pincode ? 'pincode-error' : undefined}
                        />
                        {errors.pincode && (
                          <p id="pincode-error" className="text-sm text-destructive mt-1" role="alert">{errors.pincode}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message" className="block text-sm font-medium mb-1">
                        Additional Notes (Optional)
                      </Label>
                      <textarea
                        id="message"
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Any specific requirements, preferred dates for rental, etc."
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                      />
                    </div>

                    {!isAuthenticated ? (
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-3 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                          <Lock className="h-4 w-4 text-primary" />
                          <span>Sign in required to place enquiry</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Log in with your Google account to submit your enquiry, receive instant updates, and view your order history.
                        </p>
                        <Button
                          type="button"
                          onClick={handleGoogleLogin}
                          variant="default"
                          className="w-full gap-2"
                        >
                          <UserPlus className="h-4 w-4" />
                          Sign in with Google to Continue
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Enquiry'
                        )}
                      </Button>
                    )}

                    <p className="text-xs text-muted-foreground text-center">
                      By submitting, you agree to our{' '}
                      <Link to="/privacy" className="underline hover:text-primary">Privacy Policy</Link>
                      {' '}and{' '}
                      <Link to="/terms" className="underline hover:text-primary">Terms of Service</Link>
                    </p>
                  </form>
                </CardContent>
              </Card>

              {/* Trust Indicators */}
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-card border border-border">
                  <CheckCircle className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Secure Enquiry</p>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border">
                  <MapPin className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Pan-India Delivery</p>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border">
                  <Phone className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Expert Support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Continue Shopping */}
      <section className="section-spacing bg-muted/30">
        <div className="container-sheaura text-center">
          <p className="text-muted-foreground mb-4">Want to add more items?</p>
          <Link to="/shop">
            <Button variant="outline" size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}