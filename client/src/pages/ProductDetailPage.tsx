import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, ShoppingBag, Calendar, Shield, Truck, RotateCcw, Heart, Share2, Check } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { useEnquiryBasket } from '@/hooks/useEnquiryBasket'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn, formatCurrency, truncate } from '@/lib/utils'
import { toast } from 'react-hot-toast'

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [mainImage, setMainImage] = useState(0)
  const [selectedAction, setSelectedAction] = useState<'sale' | 'rental' | null>(null)
  const { data: settings } = useSiteSettings()
  const { addItem } = useEnquiryBasket()
  const currency = settings?.currency || 'INR'

  const { data: product, isLoading, error } = trpc.products.bySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  )

  const { data: related } = trpc.products.related.useQuery(
    {
      productId: product?.id || '',
      categoryId: product?.categoryId || '',
      limit: 4,
    },
    { enabled: !!product?.id }
  )

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="container-sheaura py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-[3/4] bg-muted/50 rounded-xl" />
            <div className="space-y-6">
              <div className="h-8 bg-muted/50 rounded w-3/4" />
              <div className="h-6 bg-muted/50 rounded w-1/2" />
              <div className="h-24 bg-muted/50 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container-sheaura py-24 text-center">
        <h1 className="font-display text-3xl font-medium text-foreground mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">The product you're looking for may have been removed or is no longer available.</p>
        <Button onClick={() => navigate('/shop')}>Back to Shop</Button>
      </div>
    )
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ id: 'placeholder', url: '', altText: product.name, displayOrder: 0, isPrimary: true }]

  const hasSale = product.mode === 'sale' || product.mode === 'both'
  const hasRental = product.mode === 'rental' || product.mode === 'both'
  const isAvailable = product.availability === 'available' || product.availability === 'low_stock'

  const handleEnquiry = (action: 'sale' | 'rental') => {
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: images[0]?.url,
      mode: action,
      salePrice: hasSale ? (typeof product.salePrice === 'string' ? parseFloat(product.salePrice) : product.salePrice) : undefined,
      rentalPrice: hasRental ? (typeof product.rentalPrice === 'string' ? parseFloat(product.rentalPrice) : product.rentalPrice) : undefined,
      rentalDurationDays: product.rentalDurationDays,
      depositAmount: product.depositAmount ? (typeof product.depositAmount === 'string' ? parseFloat(product.depositAmount) : product.depositAmount) : undefined,
      category: product.category.name,
      categorySlug: product.category.slug,
    })
    toast.success(`Added to enquiry basket`)
  }

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="container-sheaura py-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><span aria-hidden="true">/</span></li>
            <li><Link to={`/shop?category=${product.category.slug}`} className="hover:text-primary transition-colors">{product.category.name}</Link></li>
            <li><span aria-hidden="true">/</span></li>
            <li className="text-foreground font-medium truncate max-w-[200px]">{product.name}</li>
          </ol>
        </nav>
      </div>

      <div className="container-sheaura pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted/50 relative group">
              {images[mainImage]?.url ? (
                <img
                  src={images[mainImage].url}
                  alt={images[mainImage].altText || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="h-16 w-16 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Image Actions */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 rounded-full bg-background/90 shadow-sm hover:bg-background transition-colors" aria-label="Add to wishlist">
                  <Heart className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-full bg-background/90 shadow-sm hover:bg-background transition-colors" aria-label="Share">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setMainImage(idx)}
                    className={cn(
                      'aspect-square rounded-lg overflow-hidden border-2 transition-colors',
                      idx === mainImage ? 'border-primary' : 'border-transparent hover:border-border'
                    )}
                    aria-label={`View image ${idx + 1}`}
                  >
                    {img.url ? (
                      <img src={img.url} alt={img.altText || `${product.name} ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-muted/50" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Link to={`/shop?category=${product.category.slug}`} className="text-sm font-medium text-primary uppercase tracking-wider hover:text-primary/80 transition-colors">
                  {product.category.name}
                </Link>
                {product.isFeatured && <Badge variant="secondary">Featured</Badge>}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-4">{product.name}</h1>
              {product.shortDescription && (
                <p className="text-muted-foreground text-lg mb-4">{product.shortDescription}</p>
              )}
            </div>

            {/* Price Information */}
            <div className="space-y-4">
              {hasSale && (
                <div className="p-5 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                      Purchase
                    </span>
                    <span className="text-2xl font-semibold text-foreground">
                      {formatCurrency(product.salePrice, currency)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Own this exquisite piece forever</p>
                  <Button className="w-full" onClick={() => handleEnquiry('sale')} disabled={!isAvailable}>
                    Enquire to Buy
                  </Button>
                </div>
              )}

              {hasRental && (
                <div className="p-5 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Rental
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-semibold text-foreground">
                        {formatCurrency(product.rentalPrice, currency)}
                      </span>
                      <span className="text-sm text-muted-foreground"> / {product.rentalDurationDays || 7} days</span>
                    </div>
                  </div>
                  {product.depositAmount && (
                    <p className="text-sm text-muted-foreground mb-1">
                      Refundable deposit: {formatCurrency(product.depositAmount, currency)}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mb-3">Perfect for your special occasion</p>
                  <Button variant="outline" className="w-full" onClick={() => handleEnquiry('rental')} disabled={!isAvailable}>
                    Enquire to Rent
                  </Button>
                </div>
              )}
            </div>

            {/* Availability Status */}
            <div className="flex items-center gap-2 text-sm">
              {product.availability === 'available' && (
                <Badge variant="success" className="gap-1">
                  <Check className="h-3 w-3" />
                  In Stock & Available
                </Badge>
              )}
              {product.availability === 'low_stock' && (
                <Badge variant="warning">Low Stock</Badge>
              )}
              {product.availability === 'out_of_stock' && (
                <Badge variant="destructive">Currently Unavailable</Badge>
              )}
              {product.availability === 'discontinued' && (
                <Badge variant="outline">Discontinued</Badge>
              )}
            </div>

            <Separator />

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="font-medium text-foreground mb-2">Description</h2>
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <h2 className="font-medium text-foreground mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="capitalize">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Care Instructions */}
            {product.careInstructions && (
              <div className="p-4 rounded-lg bg-muted/30 border border-border">
                <h2 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Care Instructions
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{product.careInstructions}</p>
              </div>
            )}

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3">
                <Truck className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Secure Shipping</p>
              </div>
              <div className="text-center p-3">
                <Shield className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Authenticity Guaranteed</p>
              </div>
              <div className="text-center p-3">
                <RotateCcw className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Easy Returns</p>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-4 space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Add to your enquiry basket and we'll get back to you with details and availability.
              </p>
              <Button className="w-full" size="lg" onClick={() => navigate('/enquiry')}>
                Go to Enquiry Basket
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related && related.length > 0 && (
        <section className="section-spacing bg-muted/30" aria-labelledby="related-title">
          <div className="container-sheaura">
            <h2 id="related-title" className="font-display text-2xl sm:text-3xl font-medium text-foreground mb-8 text-center">
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} compact />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

import { ProductCard } from '@/components/product/ProductCard'