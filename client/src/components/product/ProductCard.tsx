import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Plus, Check, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEnquiryList } from '@/hooks/useEnquiryBasket'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { toast } from 'react-hot-toast'

interface ProductCardProps {
  product: {
    id: string
    itemCode?: string | null
    name: string
    slug: string
    shortDescription?: string | null
    tags?: string[]
    salePrice?: string | null
    compareAtPrice?: string | null
    rentalPrice?: string | null
    availability?: string | null
    isFeatured?: boolean | null
    category?: {
      id: string
      name: string
      slug: string
    } | null
    primaryImage?: {
      url: string
      altText?: string | null
    } | null
  }
  compact?: boolean
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addItem, removeItem, isInList } = useEnquiryList()
  const { data: settings } = useSiteSettings()
  const inList = isInList(product.id)
  const itemCode = product.itemCode || `SH-${product.slug.substring(0, 6).toUpperCase()}`
  const displayPrice = product.salePrice || product.rentalPrice

  const [justEnquired, setJustEnquired] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const handleToggleList = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (inList) {
      removeItem(product.id)
      setJustAdded(false)
      toast.success(`Removed "${product.name}" from Order List`)
    } else {
      addItem({
        productId: product.id,
        itemCode,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.primaryImage?.url,
        category: product.category?.name || '',
        price: displayPrice,
        salePrice: product.salePrice,
      })
      setJustAdded(true)
      toast.success(`Added "${product.name}" to Order List`)
      setTimeout(() => {
        setJustAdded(false)
      }, 3500)
    }
  }

  const handleDirectWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = buildWhatsAppUrl({
      items: [{ itemCode, name: product.name, price: displayPrice }],
      whatsappNumber: settings?.whatsappNumber,
      brandName: settings?.brandName || 'Sheaura',
    })
    window.open(url, '_blank', 'noopener,noreferrer')
    setJustEnquired(true)
    toast.success(`Opening WhatsApp to order "${product.name}"`)
    setTimeout(() => {
      setJustEnquired(false)
    }, 3500)
  }

  if (compact) {
    return (
      <article className="product-card group border border-amber-900/10 rounded-xl bg-card overflow-hidden transition-all duration-300 hover:border-amber-600/40 hover:shadow-lg">
        <Link to={`/product/${product.slug}`} className="block relative overflow-hidden aspect-[4/5]" aria-label={product.name}>
          {product.primaryImage?.url ? (
            <img
              src={product.primaryImage.url}
              alt={product.primaryImage.altText || product.name}
              className="product-image w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="product-image bg-amber-50/50 dark:bg-muted/40 flex items-center justify-center w-full h-full">
              <span className="text-xs text-amber-800/60 font-serif">Sheaura Jewellery</span>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-[11px] font-mono shadow-sm bg-background/95 backdrop-blur-sm border border-amber-600/20 text-amber-900 dark:text-amber-300">
              {itemCode}
            </Badge>
          </div>
        </Link>
        <div className="p-3">
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-display font-medium text-sm text-foreground line-clamp-1 mb-1 group-hover:text-amber-700 transition-colors">
              {product.name}
            </h3>
          </Link>
          {displayPrice && (
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 font-mono mb-2">
              ₹{Number(displayPrice).toLocaleString('en-IN')}
            </p>
          )}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
            <span className="text-xs text-muted-foreground">{product.category?.name || 'Jewellery'}</span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2 gap-1 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 border-emerald-600/30"
              onClick={handleDirectWhatsApp}
              aria-label={`Order ${product.name} on WhatsApp`}
            >
              <MessageCircle className="h-3 w-3" />
              <span>Order</span>
            </Button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="product-card group border border-amber-900/15 rounded-2xl bg-card overflow-hidden transition-all duration-300 hover:border-amber-600/40 hover:shadow-xl flex flex-col justify-between">
      <div>
        {/* Product Image */}
        <Link to={`/product/${product.slug}`} className="block relative overflow-hidden aspect-[4/5] bg-muted/20" aria-label={product.name}>
          {product.primaryImage?.url ? (
            <img
              src={product.primaryImage.url}
              alt={product.primaryImage.altText || product.name}
              className="product-image w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="product-image bg-amber-50/40 dark:bg-muted/40 flex items-center justify-center w-full h-full">
              <span className="text-sm text-amber-800/60 font-serif">Sheaura Jewellery</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 z-10">
            <Badge variant="secondary" className="font-mono text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 shadow-sm bg-background/95 backdrop-blur-sm border border-amber-600/25 text-amber-900 dark:text-amber-300">
              {itemCode}
            </Badge>
            {product.isFeatured && (
              <Badge variant="default" className="gap-1 text-[10px] sm:text-[11px] px-1.5 py-0.5 bg-amber-700 hover:bg-amber-800 text-white shadow-sm">
                <Star className="h-2.5 w-2.5 fill-current" />
                Featured
              </Badge>
            )}
          </div>

          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
            {product.availability === 'out_of_stock' || product.availability === 'discontinued' ? (
              <Badge variant="destructive" className="text-[10px] sm:text-[11px] px-1.5 py-0.5 shadow-sm">
                Sold Out
              </Badge>
            ) : product.availability === 'low_stock' ? (
              <Badge variant="warning" className="text-[10px] sm:text-[11px] px-1.5 py-0.5 shadow-sm bg-amber-500/15 text-amber-800 border-amber-500/30">
                Only Few Left
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] sm:text-[11px] px-1.5 py-0.5 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-sm">
                In Stock
              </Badge>
            )}
          </div>
        </Link>

        {/* Card Content */}
        <div className="p-3 sm:p-4 md:p-5">
          <div className="mb-1">
            <span className="text-[11px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              {product.category?.name || 'Fashion Jewellery'}
            </span>
          </div>

          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="font-display font-medium text-sm sm:text-base md:text-lg text-foreground line-clamp-1 mb-1.5 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Pricing Row */}
          {displayPrice && (
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-base sm:text-lg font-bold text-amber-900 dark:text-amber-300 font-mono">
                ₹{Number(displayPrice).toLocaleString('en-IN')}
              </span>
              {product.compareAtPrice && Number(product.compareAtPrice) > Number(displayPrice) && (
                <span className="text-xs text-muted-foreground line-through font-mono">
                  ₹{Number(product.compareAtPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>
          )}

          {product.shortDescription && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-3">
              {product.shortDescription}
            </p>
          )}
        </div>
      </div>

      {/* Enquiry Actions */}
      <div className="p-3 sm:p-4 md:p-5 pt-0">
        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1.5 sm:gap-2 pt-2.5 sm:pt-3 border-t border-amber-900/10">
          <Button
            size="sm"
            className="w-full text-xs h-8 sm:h-9 gap-1.5 font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm order-1 sm:order-2"
            onClick={handleDirectWhatsApp}
            aria-label={`Order ${product.name} on WhatsApp`}
          >
            {justEnquired ? (
              <>
                <Check className="h-3.5 w-3.5 text-white animate-in zoom-in-75 duration-200" />
                <span className="truncate">Connecting...</span>
              </>
            ) : (
              <>
                <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">WhatsApp</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant={justAdded ? 'secondary' : inList ? 'secondary' : 'outline'}
            className="w-full text-xs h-8 sm:h-9 gap-1 font-medium order-2 sm:order-1 transition-all border-amber-700/20 hover:border-amber-600/40"
            onClick={handleToggleList}
            aria-label={inList ? `Remove ${product.name} from list` : `Add ${product.name} to order list`}
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 animate-in zoom-in-75 duration-200" />
                <span>Added!</span>
              </>
            ) : inList ? (
              <>
                <Check className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                <span>In List</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 shrink-0 text-amber-800" />
                <span>Add to List</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  )
}