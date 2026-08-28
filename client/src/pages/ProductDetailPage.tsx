import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { MessageCircle, Plus, Check, Copy, Shield, ArrowLeft, Gem } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { useEnquiryList } from '@/hooks/useEnquiryBasket'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { ProductCard } from '@/components/product/ProductCard'
import { toast } from 'react-hot-toast'

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [mainImage, setMainImage] = useState(0)
  const { data: settings } = useSiteSettings()
  const { addItem, removeItem, isInList } = useEnquiryList()

  const { data: product, isLoading, error } = trpc.products.getBySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  )

  const { data: related } = trpc.products.getRelated.useQuery(
    {
      productId: product?.id || '',
      categoryId: product?.categoryId || '',
      limit: 4,
    },
    { enabled: !!product?.id }
  )

  if (isLoading) {
    return (
      <div className="animate-pulse container-sheaura py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-[3/4] bg-muted/50 rounded-2xl" />
          <div className="space-y-6">
            <div className="h-8 bg-muted/50 rounded w-1/3" />
            <div className="h-10 bg-muted/50 rounded w-3/4" />
            <div className="h-24 bg-muted/50 rounded" />
            <div className="h-14 bg-muted/50 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container-sheaura py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-amber-950 dark:text-amber-200 mb-4">Jewellery Piece Not Found</h1>
        <p className="text-muted-foreground mb-8">The jewellery piece you are looking for may have been archived or is temporarily unpublished.</p>
        <Button onClick={() => navigate('/shop')} className="bg-amber-700 hover:bg-amber-800 text-white rounded-xl">Browse Jewellery Catalogue</Button>
      </div>
    )
  }

  const rawImages = (product.images || []).filter((img): img is NonNullable<typeof img> => img !== null && Boolean(img?.url))
  const images = rawImages.length > 0
    ? rawImages
    : [{ id: 'placeholder', url: '', altText: product.name, displayOrder: 0, isPrimary: true }]

  const itemCode = product.itemCode || `SH-${product.slug.substring(0, 6).toUpperCase()}`
  const inList = isInList(product.id)
  const displayPrice = product.salePrice || product.rentalPrice

  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [listConfirmed, setListConfirmed] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(itemCode)
    toast.success(`Copied item code: ${itemCode}`)
  }

  const handleWhatsAppOrder = () => {
    const url = buildWhatsAppUrl({
      items: [{ itemCode, name: product.name, price: displayPrice }],
      whatsappNumber: settings?.whatsappNumber,
      brandName: settings?.brandName || 'Sheaura',
    })
    window.open(url, '_blank', 'noopener,noreferrer')
    setOrderConfirmed(true)
    toast.success(`Opening WhatsApp to order "${product.name}"`)
    setTimeout(() => {
      setOrderConfirmed(false)
    }, 3500)
  }

  const handleToggleList = () => {
    if (inList) {
      removeItem(product.id)
      setListConfirmed(false)
      toast.success(`Removed "${product.name}" from Order List`)
    } else {
      addItem({
        productId: product.id,
        itemCode,
        productName: product.name,
        productSlug: product.slug,
        productImage: images[0]?.url,
        category: product.category?.name || '',
        price: displayPrice,
        salePrice: product.salePrice,
      })
      setListConfirmed(true)
      toast.success(`Added "${product.name}" to Order List`)
      setTimeout(() => {
        setListConfirmed(false)
      }, 3500)
    }
  }

  const availabilityLabel = () => {
    if (product.availability === 'out_of_stock' || product.availability === 'discontinued') {
      return { text: 'Sold Out', variant: 'destructive' as const }
    }
    if (product.availability === 'low_stock') {
      return { text: 'Limited Quantity Left', variant: 'warning' as const }
    }
    return { text: 'In Stock — Ready to Dispatch', variant: 'secondary' as const }
  }

  const avail = availabilityLabel()

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="container-sheaura py-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-amber-800 transition-colors">Home</Link></li>
            <li><span aria-hidden="true">/</span></li>
            <li><Link to="/shop" className="hover:text-amber-800 transition-colors">Fashion Jewellery</Link></li>
            <li><span aria-hidden="true">/</span></li>
            {product.category && (
              <>
                <li><Link to={`/shop?category=${product.category.slug}`} className="hover:text-amber-800 transition-colors">{product.category.name}</Link></li>
                <li><span aria-hidden="true">/</span></li>
              </>
            )}
            <li className="text-foreground font-medium truncate max-w-[180px] sm:max-w-[280px]">{product.name}</li>
          </ol>
        </nav>
      </div>

      {/* Main Product Section */}
      <div className="container-sheaura pb-28 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-amber-50/40 dark:bg-muted/30 border border-amber-900/15 shadow-md">
              {images[mainImage]?.url ? (
                <img
                  src={images[mainImage].url}
                  alt={images[mainImage].altText || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                  <Gem className="h-12 w-12 mb-3 text-amber-700/50" />
                  <span className="font-display font-semibold text-lg text-amber-950 dark:text-amber-200">Sheaura Fashion Jewellery</span>
                  <span className="text-xs text-muted-foreground mt-1">Handcrafted jewellery piece</span>
                </div>
              )}

              {/* Item Code Badge on Image */}
              <div className="absolute top-4 left-4">
                <Badge variant="secondary" className="font-mono text-sm px-3 py-1 bg-background/95 backdrop-blur-sm border border-amber-600/25 text-amber-900 dark:text-amber-300 shadow-sm">
                  {itemCode}
                </Badge>
              </div>
            </div>

            {/* Thumbnail selector */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setMainImage(idx)}
                    className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      mainImage === idx ? 'border-amber-600 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.altText || `View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details & WhatsApp Action */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Category & Status */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-xs font-semibold tracking-wider text-amber-700 dark:text-amber-400 uppercase">
                  {product.category?.name || 'Fashion Jewellery'}
                </span>
                <Badge variant={avail.variant} className="text-xs px-2.5 py-0.5">
                  {avail.text}
                </Badge>
              </div>

              {/* Product Title */}
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-950 dark:text-amber-200 mb-3">
                {product.name}
              </h1>

              {/* Pricing Section */}
              {displayPrice && (
                <div className="flex items-baseline gap-3 mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-600/20">
                  <span className="text-2xl sm:text-3xl font-bold text-amber-950 dark:text-amber-200 font-mono">
                    ₹{Number(displayPrice).toLocaleString('en-IN')}
                  </span>
                  {(product as any).compareAtPrice && Number((product as any).compareAtPrice) > Number(displayPrice) && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground line-through font-mono">
                        MRP ₹{Number((product as any).compareAtPrice).toLocaleString('en-IN')}
                      </span>
                      <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2">
                        Special Price
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Item Code Card */}
              <div className="p-4 rounded-2xl border border-amber-900/15 bg-card/80 mb-6 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block">Item Reference Code</span>
                  <span className="font-mono text-xl font-bold text-amber-900 dark:text-amber-300">{itemCode}</span>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-xl border-amber-700/20" onClick={handleCopyCode}>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Code</span>
                </Button>
              </div>

              {/* Short description */}
              {product.shortDescription && (
                <p className="text-muted-foreground text-base sm:text-lg mb-6 leading-relaxed">
                  {product.shortDescription}
                </p>
              )}

              {/* WhatsApp Order Callout Card */}
              <div className="p-6 rounded-3xl border border-amber-900/15 bg-card shadow-md mb-8">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-amber-950 dark:text-amber-200 text-lg">Direct WhatsApp Ordering</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Connect directly with Sheaura styling concierge to verify sizing, request live video previews, and confirm dispatch.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    size="lg"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 h-12 text-base shadow-md transition-all rounded-xl"
                    onClick={handleWhatsAppOrder}
                    aria-label={`Order ${product.name} on WhatsApp`}
                  >
                    {orderConfirmed ? (
                      <>
                        <Check className="h-5 w-5 text-white animate-in zoom-in-75 duration-200" />
                        <span>Connecting to WhatsApp...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-5 w-5" />
                        <span>Order on WhatsApp (₹{Number(displayPrice || 0).toLocaleString('en-IN')})</span>
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <Button
                      variant={listConfirmed ? 'secondary' : inList ? 'secondary' : 'outline'}
                      className="w-full gap-1.5 h-11 text-xs sm:text-sm font-medium transition-all rounded-xl border-amber-700/20"
                      onClick={handleToggleList}
                      aria-label={inList ? `Remove ${product.name} from list` : `Add ${product.name} to order list`}
                    >
                      {listConfirmed ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-600 animate-in zoom-in-75 duration-200" />
                          <span>Added to Order List!</span>
                        </>
                      ) : inList ? (
                        <>
                          <Check className="h-4 w-4 text-amber-700" />
                          <span>In List (Click to Remove)</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>Add to Order List</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full gap-1.5 h-11 text-xs sm:text-sm rounded-xl border-amber-700/20"
                      onClick={() => navigate('/enquiry')}
                    >
                      <span>View Order List</span>
                    </Button>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground/80 text-center mt-3">
                  * All orders dispatched in protective velvet gift boxes with tracking. Pan-India shipping.
                </p>
              </div>

              {/* Full Description / Details */}
              {product.description && (
                <div className="prose prose-sm max-w-none mb-8 text-foreground/90 leading-relaxed">
                  <h3 className="font-display text-lg font-bold text-amber-950 dark:text-amber-200 mb-2">About This Piece</h3>
                  <p>{product.description}</p>
                </div>
              )}

              {/* Care Instructions / Notes */}
              {product.careInstructions && (
                <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-muted/20 border border-amber-900/10 mb-8 text-xs text-muted-foreground space-y-1">
                  <div className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                    <Shield className="h-3.5 w-3.5 text-amber-700" />
                    <span>Jewellery Care & Handling</span>
                  </div>
                  <p>{product.careInstructions}</p>
                </div>
              )}
            </div>

            {/* Back link */}
            <div className="pt-6 border-t border-amber-900/10">
              <Link
                to="/shop"
                className="inline-flex items-center text-sm font-medium text-amber-800 dark:text-amber-400 hover:underline gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Fashion Jewellery Catalogue</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Related Ornaments */}
        {related && related.length > 0 && (
          <div className="mt-16 sm:mt-20 pt-10 sm:pt-12 border-t border-amber-900/10">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-amber-950 dark:text-amber-200 mb-6 sm:mb-8 text-center sm:text-left">
              You May Also Adore
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {related.map((item: any) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Action Bar */}
      <aside aria-label="Quick Order Action" className="lg:hidden fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur-md border-t border-amber-900/10 p-3 z-40 shadow-2xl flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Badge variant="outline" className="font-mono text-[10px] font-bold block truncate max-w-[120px] px-1.5 py-0 border-amber-600/30 text-amber-900">
            {itemCode}
          </Badge>
          <span className="text-xs font-semibold text-foreground truncate block mt-0.5">
            {product.name} {displayPrice ? `— ₹${Number(displayPrice).toLocaleString('en-IN')}` : ''}
          </span>
        </div>

        <Button
          size="sm"
          variant={listConfirmed ? 'secondary' : inList ? 'secondary' : 'outline'}
          className="h-10 px-3 text-xs gap-1 font-medium shrink-0 rounded-xl"
          onClick={handleToggleList}
          aria-label={inList ? `Remove ${product.name} from list` : `Add ${product.name} to order list`}
        >
          {listConfirmed ? (
            <Check className="h-4 w-4 text-emerald-600 animate-in zoom-in-75 duration-200" />
          ) : inList ? (
            <Check className="h-4 w-4 text-amber-700" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{listConfirmed ? 'Added!' : inList ? 'In List' : 'Add'}</span>
        </Button>

        <Button
          size="sm"
          className="h-10 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-md shrink-0 rounded-xl"
          onClick={handleWhatsAppOrder}
          aria-label={`Order ${product.name} on WhatsApp`}
        >
          {orderConfirmed ? (
            <>
              <Check className="h-4 w-4 text-white animate-in zoom-in-75 duration-200" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp</span>
            </>
          )}
        </Button>
      </aside>
    </div>
  )
}