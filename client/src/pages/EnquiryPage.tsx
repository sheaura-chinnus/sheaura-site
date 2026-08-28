import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, MessageCircle, Copy, ArrowLeft, Check, ShoppingBag, ShieldCheck } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useEnquiryList } from '@/hooks/useEnquiryBasket'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { buildWhatsAppUrl, generateWhatsAppMessage } from '@/lib/whatsapp'
import { Toaster, toast } from 'react-hot-toast'

export function EnquiryPage() {
  const { data: settings } = useSiteSettings()
  const { items, removeItem, clearList, itemCount } = useEnquiryList()

  const [customerName, setCustomerName] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [note, setNote] = useState('')
  const [orderSent, setOrderSent] = useState(false)

  const createEnquiryMutation = trpc.enquiries.createEnquiry.useMutation({
    onError: (err) => {
      // Non-blocking background log
      console.warn('Background order log notification:', err.message)
    },
  })

  // Calculate total price if prices are present
  const totalPrice = items.reduce((acc, item) => {
    const val = Number(item.price || item.salePrice || 0)
    return acc + (isNaN(val) ? 0 : val)
  }, 0)

  const handleCopyMessage = () => {
    const message = generateWhatsAppMessage({
      items: items.map(i => ({ itemCode: i.itemCode, name: i.productName, price: i.price || i.salePrice })),
      customerName,
      preferredDate,
      note,
      brandName: settings?.brandName || 'Sheaura',
    })
    navigator.clipboard.writeText(message)
    toast.success('Order enquiry copied to clipboard!')
  }

  const handleOpenWhatsApp = () => {
    const url = buildWhatsAppUrl({
      items: items.map(i => ({ itemCode: i.itemCode, name: i.productName, price: i.price || i.salePrice })),
      customerName,
      preferredDate,
      note,
      whatsappNumber: settings?.whatsappNumber,
      brandName: settings?.brandName || 'Sheaura',
    })

    // Log internal record asynchronously without blocking the user
    if (items.length > 0) {
      try {
        createEnquiryMutation.mutate({
          name: customerName.trim() || 'Valued Customer',
          email: 'guest@sheaura.com',
          preferredContact: 'whatsapp',
          eventDate: preferredDate ? new Date(preferredDate) : undefined,
          message: note.trim() || undefined,
          items: items.map(i => ({
            productId: i.productId,
            quantity: 1,
            mode: 'sale',
          })),
        })
      } catch {
        // Safe catch
      }
    }

    // Open WhatsApp
    window.open(url, '_blank', 'noopener,noreferrer')
    setOrderSent(true)
    toast.success('Opening WhatsApp to place your order enquiry!')
    setTimeout(() => {
      setOrderSent(false)
    }, 3500)
  }

  if (items.length === 0) {
    return (
      <div className="animate-fade-in min-h-[65vh] flex items-center justify-center">
        <div className="container-sheaura text-center py-16">
          <div className="max-w-md mx-auto p-8 rounded-3xl border border-amber-900/15 bg-card shadow-sm">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-800 dark:text-amber-300">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Your Order List is Empty
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mb-8 leading-relaxed">
              Explore our handcrafted fashion jewellery collection, note your favourite item codes, and add them to your list for direct WhatsApp checkout.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/shop">
                <Button size="lg" className="w-full sm:w-auto gap-2 bg-amber-700 hover:bg-amber-800 text-white shadow-md">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Browse Jewellery</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50"
                onClick={() => {
                  const url = `https://wa.me/919995098294?text=${encodeURIComponent('Hello Sheaura, I would like to enquire about your fashion jewellery collections.')}`
                  window.open(url, '_blank', 'noopener,noreferrer')
                }}
              >
                <MessageCircle className="h-4 w-4" />
                <span>Chat on WhatsApp</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      {/* Page Header */}
      <section className="py-10 lg:py-14 bg-amber-50/40 dark:bg-muted/20 border-b border-amber-900/10" aria-labelledby="enquiry-title">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-900 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
              Direct WhatsApp Checkout
            </span>
            <h1 id="enquiry-title" className="font-display text-3xl sm:text-4xl font-bold text-amber-900 dark:text-amber-300 mb-3">
              Order & Enquiry List
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Review your chosen handcrafted jewellery pieces. Click to send your complete order selection directly to Sheaura on WhatsApp.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-spacing pb-28 lg:pb-16">
        <div className="container-sheaura">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Items List (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-amber-900/10">
                <span className="text-sm font-semibold text-foreground">
                  Selected Jewellery Pieces ({itemCount})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearList}
                  className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item) => {
                  const itemPrice = item.price || item.salePrice
                  return (
                    <article
                      key={item.productId}
                      className="p-3.5 sm:p-4 rounded-2xl border border-amber-900/15 bg-card flex items-center justify-between gap-3 sm:gap-4 shadow-sm hover:border-amber-600/30 transition-all"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden bg-amber-50/40 shrink-0 border border-amber-900/10">
                          {item.productImage ? (
                            <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-amber-800/60 p-1 text-center font-serif">
                              Sheaura
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <Badge variant="secondary" className="font-mono text-[10px] sm:text-xs font-semibold mb-1 bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-600/20">
                            {item.itemCode}
                          </Badge>
                          <Link to={`/product/${item.productSlug}`}>
                            <h3 className="font-display font-medium text-sm sm:text-base text-foreground truncate hover:text-amber-700 transition-colors">
                              {item.productName}
                            </h3>
                          </Link>
                          {itemPrice && (
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-300 font-mono mt-0.5">
                              ₹{Number(itemPrice).toLocaleString('en-IN')}
                            </p>
                          )}
                          {item.category && (
                            <span className="text-[11px] sm:text-xs text-muted-foreground block truncate">{item.category}</span>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0 h-10 w-10 min-h-[40px] min-w-[40px]"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Remove ${item.productName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </article>
                  )
                })}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Link
                  to="/shop"
                  className="inline-flex items-center text-sm font-medium text-amber-800 dark:text-amber-400 hover:underline gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Add more jewellery pieces</span>
                </Link>
              </div>
            </div>

            {/* WhatsApp Preparation Sidebar (1 col) */}
            <div className="lg:col-span-1">
              <Card className="card-sheaura shadow-lg border border-amber-900/15 rounded-2xl overflow-hidden">
                <CardHeader className="bg-amber-50/50 dark:bg-muted/30 pb-4 border-b border-amber-900/10">
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs tracking-wider uppercase mb-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp Order Builder</span>
                  </div>
                  <CardTitle className="font-display text-xl text-amber-950 dark:text-amber-200">Order Summary</CardTitle>
                  <CardDescription className="text-xs">
                    Connect directly with our styling concierge on WhatsApp.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  {totalPrice > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-600/20 flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-900 dark:text-amber-300">Estimated Total:</span>
                      <span className="text-lg font-bold text-amber-900 dark:text-amber-300 font-mono">
                        ₹{totalPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="custName" className="text-xs font-medium">Your Name (Optional)</Label>
                    <Input
                      id="custName"
                      placeholder="e.g., Ananya Nair"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-10 text-sm rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prefDate" className="text-xs font-medium">Required By / Event Date (Optional)</Label>
                    <Input
                      id="prefDate"
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="h-10 text-sm rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="userNote" className="text-xs font-medium">Special Request / Sizing / Notes (Optional)</Label>
                    <Textarea
                      id="userNote"
                      placeholder="e.g., Need matching bangles or delivery to Pathanamthitta"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      className="text-sm resize-none rounded-xl"
                    />
                  </div>

                  <Separator />

                  <Button
                    size="lg"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2 h-12 text-sm shadow-md transition-all rounded-xl"
                    onClick={handleOpenWhatsApp}
                  >
                    {orderSent ? (
                      <>
                        <Check className="h-5 w-5 text-white animate-in zoom-in-75 duration-200" />
                        <span>Order Enquiry Sent!</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-5 w-5" />
                        <span>Send Order on WhatsApp</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full text-xs h-9 gap-1.5 rounded-xl border-amber-900/15 hover:border-amber-600/30"
                    onClick={handleCopyMessage}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Order Details</span>
                  </Button>

                  <div className="p-3 bg-muted/40 rounded-xl text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                    <p>
                      <strong>How it works:</strong> Clicking opens WhatsApp directly with all your selected jewellery codes. Our team confirms availability and dispatches promptly.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Sticky WhatsApp Action Bar */}
      <aside aria-label="Quick WhatsApp Handover" className="lg:hidden fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur-md border-t border-amber-900/10 p-3 z-40 shadow-2xl flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block truncate">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} ({totalPrice > 0 ? `₹${totalPrice.toLocaleString('en-IN')}` : 'Ready'})
          </span>
          <span className="text-[10px] text-muted-foreground block truncate">
            Includes all selected codes
          </span>
        </div>

        <Button
          size="sm"
          className="h-11 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md shrink-0 transition-all rounded-xl"
          onClick={handleOpenWhatsApp}
        >
          {orderSent ? (
            <>
              <Check className="h-4 w-4 text-white animate-in zoom-in-75 duration-200" />
              <span>Sent!</span>
            </>
          ) : (
            <>
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp ({itemCount})</span>
            </>
          )}
        </Button>
      </aside>
    </div>
  )
}