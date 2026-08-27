import { Link } from 'react-router-dom'
import { ShoppingBag, Tag, Calendar, Star } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEnquiryBasket } from '@/hooks/useEnquiryBasket'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    shortDescription?: string
    tags: string[]
    mode: 'sale' | 'rental' | 'both'
    salePrice?: number | string | null
    rentalPrice?: number | string | null
    rentalDurationDays?: number | null
    depositAmount?: number | string | null
    availability: string
    isFeatured: boolean
    category: {
      id: string
      name: string
      slug: string
    }
    primaryImage?: {
      url: string
      altText?: string
    } | null
  }
  compact?: boolean
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addItem } = useEnquiryBasket()
  const hasSale = product.mode === 'sale' || product.mode === 'both'
  const hasRental = product.mode === 'rental' || product.mode === 'both'

  const handleAddToEnquiry = (mode: 'sale' | 'rental', e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.primaryImage?.url,
      mode,
      salePrice: hasSale ? (typeof product.salePrice === 'string' ? parseFloat(product.salePrice) : product.salePrice) : undefined,
      rentalPrice: hasRental ? (typeof product.rentalPrice === 'string' ? parseFloat(product.rentalPrice) : product.rentalPrice) : undefined,
      rentalDurationDays: product.rentalDurationDays,
      depositAmount: product.depositAmount ? (typeof product.depositAmount === 'string' ? parseFloat(product.depositAmount) : product.depositAmount) : undefined,
      category: product.category.name,
      categorySlug: product.category.slug,
    })
  }

  if (compact) {
    return (
      <article className="product-card group">
        <Link to={`/product/${product.slug}`} className="block relative overflow-hidden" aria-label={product.name}>
          {product.primaryImage?.url ? (
            <img
              src={product.primaryImage.url}
              alt={product.primaryImage.altText || product.name}
              className="product-image"
              loading="lazy"
            />
          ) : (
            <div className="product-image bg-muted/50 flex items-center justify-center">
              <svg className="h-12 w-12 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </Link>
        <div className="p-4">
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-medium text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-2">
            {hasSale && (
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(product.salePrice)}
              </span>
            )}
            {hasRental && (
              <span className="text-sm text-primary">
                {formatCurrency(product.rentalPrice)} / {product.rentalDurationDays || 7}d
              </span>
            )}
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="product-card group">
      {/* Image */}
      <Link to={`/product/${product.slug}`} className="block relative overflow-hidden" aria-label={product.name}>
        {product.primaryImage?.url ? (
          <img
            src={product.primaryImage.url}
            alt={product.primaryImage.altText || product.name}
            className="product-image"
            loading="lazy"
          />
        ) : (
          <div className="product-image bg-muted/50 flex items-center justify-center">
            <svg className="h-12 w-12 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isFeatured && (
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3" />
              Featured
            </Badge>
          )}
          {product.mode === 'both' && (
            <Badge variant="outline" className="gap-1">
              <Tag className="h-3 w-3" />
              Sale & Rental
            </Badge>
          )}
          {product.mode === 'rental' && (
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              Rental
            </Badge>
          )}
        </div>

        {/* Availability */}
        {product.availability === 'low_stock' && (
          <div className="absolute top-3 right-3">
            <Badge variant="warning" className="gap-1">
              Low Stock
            </Badge>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-primary uppercase tracking-wider">
            {product.category.name}
          </span>
          {product.availability === 'out_of_stock' && (
            <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
          )}
        </div>

        <Link to={`/product/${product.slug}`} className="block">
          <h3 className="font-medium text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {product.shortDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.shortDescription}</p>
        )}

        {/* Price & Actions */}
        <div className="space-y-3">
          {hasSale && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(product.salePrice)}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={(e) => handleAddToEnquiry('sale', e)}
                disabled={product.availability === 'out_of_stock'}
              >
                <ShoppingBag className="h-4 w-4 mr-1" />
                Enquire to Buy
              </Button>
            </div>
          )}

          {hasRental && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-semibold text-foreground">
                    {formatCurrency(product.rentalPrice)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {product.rentalDurationDays || 7} days
                  </span>
                </div>
                {product.depositAmount && (
                  <p className="text-xs text-muted-foreground">
                    Deposit: {formatCurrency(product.depositAmount)}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={(e) => handleAddToEnquiry('rental', e)}
                disabled={product.availability === 'out_of_stock'}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Enquire to Rent
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}