import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, MessageCircle, Copy, ArrowLeft, Sparkles, Check } from 'lucide-react'
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
  const [enquirySent, setEnquirySent] = useState(false)

  const createEnquiryMutation = trpc.enquiries.createEnquiry.useMutation({
    onError: (err) => {
      // Non-blocking background log
      console.warn('Background enquiry log error:', err.message)
    },
  })

  const handleCopyMessage = () => {
    const message = generateWhatsAppMessage({
      items: items.map(i => ({ itemCode: i.itemCode, name: i.productName })),
      customerName,
      preferredDate,
      note,
      brandName: settings?.brandName || 'Sheaura',
    })
    navigator.clipboard.writeText(message)
    toast.success('Enquiry message copied to clipboard!')
  }

  const handleOpenWhatsApp = () => {
    if (items.length === 0) {
      toast.error('Your enquiry list is empty')
      return
    }

    const url = buildWhatsAppUrl({
      items: items.map(i => ({ itemCode: i.itemCode, name: i.productName })),
      customerName,
      preferredDate,
      note,
      whatsappNumber: settings?.whatsappNumber,
      brandName: settings?.brandName || 'Sheaura',
    })

    // Log internal record asynchronously without blocking the user
    try {
      createEnquiryMutation.mutate({
        name: customerName.trim() || 'Rental Guest',
        email: 'guest@sheaura.com',
        preferredContact: 'whatsapp',
        eventDate: preferredDate ? new Date(preferredDate) : undefined,
        message: note.trim() || undefined,
        items: items.map(i => ({
          productId: i.productId,
          quantity: 1,
          mode: 'rental',
        })),
      })
    } catch {
      // Background logger safe catch
    }

    // Open WhatsApp
    window.open(url, '_blank', 'noopener,noreferrer')
    setEnquirySent(true)
    toast.success('Opening WhatsApp with your selected ornaments!')
    setTimeout(() => {
      setEnquirySent(false)
    }, 3500)
  }

  if (items.length === 0) {
    return (
      <div className="animate-fade-in min-h-[60vh] flex items-center justify-center">
        <div className="container-sheaura text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/60 flex items-center justify-center text-primary">
              <Sparkles className="h-10 w-10 opacity-70" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground mb-3">
              Your Enquiry List is Empty
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mb-8 leading-relaxed">
              Explore our rental ornament catalogue and add items to your list.
              You can then enquire about all chosen item codes together on WhatsApp.
            </p>
            <Link to="/rental-ornaments">
              <Button size="lg" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Browse Rental Ornaments</span>
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
      <section className="py-10 lg:py-14 bg-muted/30 border-b border-border/60" aria-labelledby="enquiry-title">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto text-center">
            <h1 id="enquiry-title" className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-3">
              Rental Enquiry List
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Review your chosen rental ornaments below. Once ready, click to send your enquiry directly to Sheaura on WhatsApp.
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
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-sm font-medium text-foreground">
                  Selected Items ({itemCount})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearList}
                  className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                >
                  Clear List
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <article
                    key={item.productId}
                    className="p-3 sm:p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-3 sm:gap-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-lg overflow-hidden bg-muted/40 shrink-0 border border-border/60">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground p-1 text-center font-serif">
                            Sheaura
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <Badge variant="secondary" className="font-mono text-[10px] sm:text-xs font-semibold mb-0.5">
                          {item.itemCode}
                        </Badge>
                        <Link to={`/product/${item.productSlug}`}>
                          <h3 className="font-display font-medium text-xs sm:text-base text-foreground truncate hover:text-primary transition-colors">
                            {item.productName}
                          </h3>
                        </Link>
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
                ))}
              </div>

              <div className="pt-4">
                <Link
                  to="/rental-ornaments"
                  className="inline-flex items-center text-sm font-medium text-primary hover:underline gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Add more rental ornaments</span>
                </Link>
              </div>
            </div>

            {/* WhatsApp Preparation Sidebar (1 col) */}
            <div className="lg:col-span-1">
              <Card className="card-sheaura shadow-md border border-border">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm mb-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp Handover</span>
                  </div>
                  <CardTitle className="font-display text-xl">Enquiry Details</CardTitle>
                  <CardDescription className="text-xs">
                    These optional details will be included in your WhatsApp message.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="custName" className="text-xs font-medium">Your Name (Optional)</Label>
                    <Input
                      id="custName"
                      placeholder="e.g., Priya Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prefDate" className="text-xs font-medium">Preferred Event Date (Optional)</Label>
                    <Input
                      id="prefDate"
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="userNote" className="text-xs font-medium">Note / Specific Requirements (Optional)</Label>
                    <Textarea
                      id="userNote"
                      placeholder="e.g., Looking for matching earrings or needed for 3 days"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      className="text-sm resize-none"
                    />
                  </div>

                  <Separator />

                  <Button
                    size="lg"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2 h-12 text-sm shadow-md transition-all"
                    onClick={handleOpenWhatsApp}
                  >
                    {enquirySent ? (
                      <>
                        <Check className="h-5 w-5 text-white animate-in zoom-in-75 duration-200" />
                        <span>Enquiry Sent!</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-5 w-5" />
                        <span>Send Enquiry on WhatsApp</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full text-xs h-9 gap-1.5"
                    onClick={handleCopyMessage}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Message to Clipboard</span>
                  </Button>

                  <div className="p-3 bg-muted/40 rounded-lg text-[11px] text-muted-foreground leading-relaxed">
                    <p>
                      <strong>Important:</strong> A WhatsApp message is an enquiry only. Availability, rental fees, and refundable security deposit are confirmed directly by Sheaura.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Sticky WhatsApp Action Bar */}
      <aside aria-label="Quick WhatsApp Handover" className="lg:hidden fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur-md border-t border-border p-3 z-40 shadow-2xl flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-foreground block truncate">
            {itemCount} {itemCount === 1 ? 'ornament' : 'ornaments'} selected
          </span>
          <span className="text-[10px] text-muted-foreground block truncate">
            Includes all item codes
          </span>
        </div>

        <Button
          size="sm"
          className="h-11 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md shrink-0 transition-all"
          onClick={handleOpenWhatsApp}
        >
          {enquirySent ? (
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