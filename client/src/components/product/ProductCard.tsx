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

  const [justEnquired, setJustEnquired] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const handleToggleList = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (inList) {
      removeItem(product.id)
      setJustAdded(false)
      toast.success(`Removed "${product.name}" from Enquiry List`)
    } else {
      addItem({
        productId: product.id,
        itemCode,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.primaryImage?.url,
        category: product.category?.name || '',
      })
      setJustAdded(true)
      toast.success(`Added "${product.name}" to Enquiry List`)
      setTimeout(() => {
        setJustAdded(false)
      }, 3500)
    }
  }

  const handleDirectWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = buildWhatsAppUrl({
      items: [{ itemCode, name: product.name }],
      whatsappNumber: settings?.whatsappNumber,
      brandName: settings?.brandName || 'Sheaura',
    })
    window.open(url, '_blank', 'noopener,noreferrer')
    setJustEnquired(true)
    toast.success(`Opening WhatsApp to enquire about "${product.name}"`)
    setTimeout(() => {
      setJustEnquired(false)
    }, 3500)
  }

  if (compact) {
    return (
      <article className="product-card group border border-border rounded-lg bg-card overflow-hidden transition-shadow hover:shadow-md">
        <Link to={`/product/${product.slug}`} className="block relative overflow-hidden aspect-[4/5]" aria-label={product.name}>
          {product.primaryImage?.url ? (
            <img
              src={product.primaryImage.url}
              alt={product.primaryImage.altText || product.name}
              className="product-image w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="product-image bg-muted/50 flex items-center justify-center w-full h-full">
              <span className="text-xs text-muted-foreground">Rental Ornament</span>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-[11px] font-mono shadow-sm bg-background/90 backdrop-blur-sm">
              {itemCode}
            </Badge>
          </div>
        </Link>
        <div className="p-3">
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-medium text-sm text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
            <span className="text-xs text-muted-foreground">{product.category?.name || 'Rental Ornament'}</span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2 gap-1 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50"
              onClick={handleDirectWhatsApp}
              aria-label={`Enquire about ${product.name} on WhatsApp`}
            >
              {justEnquired ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600 animate-in zoom-in-75 duration-200" />
                  <span>Enquired!</span>
                </>
              ) : (
                <>
                  <MessageCircle className="h-3 w-3" />
                  <span>Enquire</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="product-card group border border-border rounded-xl bg-card overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col justify-between">
      <div>
        {/* Product Image */}
        <Link to={`/product/${product.slug}`} className="block relative overflow-hidden aspect-[4/5] bg-muted/30" aria-label={product.name}>
          {product.primaryImage?.url ? (
            <img
              src={product.primaryImage.url}
              alt={product.primaryImage.altText || product.name}
              className="product-image w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="product-image bg-muted/50 flex items-center justify-center w-full h-full">
              <span className="text-sm text-muted-foreground font-serif">Sheaura Rental Ornament</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 z-10">
            <Badge variant="secondary" className="font-mono text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 shadow-sm bg-background/95 backdrop-blur-sm border border-border/80">
              {itemCode}
            </Badge>
            {product.isFeatured && (
              <Badge variant="default" className="gap-1 text-[10px] sm:text-[11px] px-1.5 py-0.5 bg-amber-600 hover:bg-amber-600 text-white shadow-sm">
                <Star className="h-2.5 w-2.5 fill-current" />
                Featured
              </Badge>
            )}
          </div>

          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
            {product.availability === 'out_of_stock' || product.availability === 'discontinued' ? (
              <Badge variant="destructive" className="text-[10px] sm:text-[11px] px-1.5 py-0.5 shadow-sm">
                Unavailable
              </Badge>
            ) : product.availability === 'low_stock' ? (
              <Badge variant="warning" className="text-[10px] sm:text-[11px] px-1.5 py-0.5 shadow-sm">
                Limited Slots
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] sm:text-[11px] px-1.5 py-0.5 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-sm">
                Available
              </Badge>
            )}
          </div>
        </Link>

        {/* Card Content */}
        <div className="p-3 sm:p-4 md:p-5">
          <div className="mb-1">
            <span className="text-[11px] sm:text-xs font-semibold text-primary uppercase tracking-wider">
              {product.category?.name || 'Rental Ornament'}
            </span>
          </div>

          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="font-display font-medium text-sm sm:text-base md:text-lg text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>

          {product.shortDescription && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-3">
              {product.shortDescription}
            </p>
          )}
        </div>
      </div>

      {/* Enquiry Actions */}
      <div className="p-3 sm:p-4 md:p-5 pt-0">
        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1.5 sm:gap-2 pt-2.5 sm:pt-3 border-t border-border/70">
          <Button
            size="sm"
            className="w-full text-xs h-8 sm:h-9 gap-1.5 font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm order-1 sm:order-2"
            onClick={handleDirectWhatsApp}
            aria-label={`Enquire about ${product.name} on WhatsApp`}
          >
            {justEnquired ? (
              <>
                <Check className="h-3.5 w-3.5 text-white animate-in zoom-in-75 duration-200" />
                <span className="truncate">Enquired!</span>
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
            className="w-full text-xs h-8 sm:h-9 gap-1 font-medium order-2 sm:order-1 transition-all"
            onClick={handleToggleList}
            aria-label={inList ? `Remove ${product.name} from list` : `Add ${product.name} to enquiry list`}
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 animate-in zoom-in-75 duration-200" />
                <span>Added!</span>
              </>
            ) : inList ? (
              <>
                <Plus className="h-3.5 w-3.5 shrink-0 rotate-45 text-muted-foreground" />
                <span>In List</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span>Add to List</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  )
}