import { Link } from 'react-router-dom'
import { ArrowRight, Truck, Shield, MessageCircle, Gem } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/product/ProductCard'
import { CategoryCard } from '@/components/product/CategoryCard'

export function HomePage() {
  const { data: settings } = useSiteSettings()
  const { data: featuredProducts } = trpc.products.getFeatured.useQuery({ limit: 8 })
  const { data: categories } = trpc.categories.getList.useQuery()

  // Dynamic hero settings
  const heroEyebrow = settings?.heroEyebrow || 'Occasion & Festive Collections'
  const heroHeading = settings?.heroHeading || settings?.heroTitle || 'Handcrafted Fashion & Imitation Jewellery'
  const heroSupportingText = settings?.heroSupportingText || settings?.heroSubtitle || 'Traditional temple bridal sets, antique chokers, and occasion jewellery designed for weddings and festivities. Order directly via WhatsApp or online.'
  const heroPrimaryLabel = settings?.heroPrimaryCtaLabel || 'Browse Catalogue'
  const heroPrimaryLink = settings?.heroPrimaryCtaLink || '/shop'
  const heroSecondaryLabel = settings?.heroSecondaryCtaLabel || 'How to Order'
  const heroSecondaryLink = settings?.heroSecondaryCtaLink || '#how-to-order'

  // Dynamic section titles and descriptions
  const orderProcessTitle = settings?.sectionRentalOrnamentsTitle || 'How to Order on WhatsApp'
  const orderProcessDesc = settings?.sectionRentalOrnamentsDesc || 'A simple 4-step process to order your selected jewellery pieces'
  const featuredTitle = settings?.sectionSaleProductsTitle || 'Featured Pieces'
  const featuredDesc = settings?.sectionSaleProductsDesc || 'Handcrafted necklaces, bridal sets, and festive jewellery available for direct purchase'

  // Section visibility parsing with safe allowlist fallback
  let visibility: Record<string, boolean> = {
    hero: true,
    trustBadges: true,
    categories: true,
    featuredProducts: true,
    rentalProcess: true,
    cta: true,
  }

  if (settings?.homepageSectionVisibility) {
    try {
      const parsed = JSON.parse(settings.homepageSectionVisibility)
      if (typeof parsed === 'object' && parsed !== null) {
        visibility = { ...visibility, ...parsed }
      }
    } catch {
      // Keep default visibility on parse failure
    }
  }

  return (
    <div className="animate-fade-in">
      {/* 1. Hero Section */}
      {visibility.hero !== false && (
        <section className="hero-spacing relative overflow-hidden bg-gradient-to-b from-amber-50/40 via-background to-background" aria-labelledby="hero-title">
          <div className="container-sheaura">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-6 inline-flex items-center px-3 py-1 bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-600/25">
                <span className="text-xs font-semibold uppercase tracking-wider">{heroEyebrow}</span>
              </Badge>
              <h1 id="hero-title" className="font-display text-4xl sm:text-5xl lg:text-5xl font-bold tracking-tight text-amber-950 dark:text-amber-200 mb-6 text-balance leading-[1.15]">
                {heroHeading}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto text-balance leading-relaxed">
                {heroSupportingText}
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-4 w-full max-w-sm sm:max-w-none mx-auto">
                <Link to={heroPrimaryLink} className="w-full sm:w-auto">
                  <Button size="xl" className="w-full sm:w-auto bg-amber-700 hover:bg-amber-800 text-white font-semibold shadow-md group h-12 px-7 rounded-xl">
                    {heroPrimaryLabel}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <a href={heroSecondaryLink} className="w-full sm:w-auto">
                  <Button size="xl" variant="outline" className="w-full sm:w-auto border border-amber-700/30 text-amber-950 dark:text-amber-300 hover:bg-amber-500/10 font-semibold h-12 px-7 rounded-xl">
                    {heroSecondaryLabel}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Trust Badges Section */}
      {visibility.trustBadges !== false && (
        <section className="py-12 sm:py-16 bg-amber-50/40 dark:bg-muted/20 border-y border-amber-900/10" aria-labelledby="trust-title">
          <div className="container-sheaura">
            <h2 id="trust-title" className="sr-only">Our Craftsmanship & Standards</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {[
                { icon: Gem, title: 'Quality Craftsmanship', description: 'Micro gold polish, antique patina, and hand-set stones' },
                { icon: Shield, title: 'Skin-Safe Alloys', description: 'Nickel-free, durable materials for all-day comfort' },
                { icon: Truck, title: 'Pan-India Delivery', description: 'Protective velvet gift box packing with tracked courier' },
                { icon: MessageCircle, title: 'WhatsApp Ordering', description: 'Direct sizing assistance, photos, and payment support' },
              ].map((item, index) => (
                <div key={index} className="text-center p-4 sm:p-6 bg-card/80 sm:bg-transparent rounded-2xl sm:rounded-none border sm:border-0 border-amber-900/10">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/10 text-amber-800 dark:text-amber-300 mb-3 sm:mb-4">
                    <item.icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                  </div>
                  <h3 className="font-display font-medium text-sm sm:text-base text-foreground mb-1">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Categories Section */}
      {visibility.categories !== false && (
        <section className="section-spacing" aria-labelledby="categories-title">
          <div className="container-sheaura">
            <div className="text-center mb-10">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1.5">Collections</span>
              <h2 id="categories-title" className="font-display text-2xl sm:text-3xl font-bold text-amber-950 dark:text-amber-200 mb-3">
                Browse Collections
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
                Temple jewellery, bridal sets, choker necklaces, and festive earrings
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories?.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Featured Collection */}
      {visibility.featuredProducts !== false && (
        <section className="section-spacing bg-amber-50/20 dark:bg-muted/10 border-t border-amber-900/10" aria-labelledby="featured-title">
          <div className="container-sheaura">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1.5">Occasion Pieces</span>
                <h2 id="featured-title" className="font-display text-2xl sm:text-3xl font-bold text-amber-950 dark:text-amber-200 mb-2">
                  {featuredTitle}
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base">{featuredDesc}</p>
              </div>
              <Link to="/shop?featured=true" className="btn-outline self-start border-amber-700/30 text-amber-900 dark:text-amber-300 hover:bg-amber-500/10 rounded-xl">
                View Full Catalogue <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {featuredProducts && featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 p-8 rounded-3xl border border-dashed border-amber-900/20 bg-card">
                <Gem className="h-10 w-10 text-amber-700/60 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Browse our complete jewellery catalogue.</p>
                <Link to="/shop" className="inline-block mt-4">
                  <Button className="bg-amber-700 hover:bg-amber-800 text-white rounded-xl">Browse All Jewellery</Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 5. How to Order on WhatsApp Section */}
      {visibility.rentalProcess !== false && (
        <section id="how-to-order" className="section-spacing bg-amber-50/40 dark:bg-muted/20 scroll-mt-20 border-t border-amber-900/10" aria-labelledby="order-process-title">
          <div className="container-sheaura">
            <div className="text-center mb-10">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1.5">Order Process</span>
              <h2 id="order-process-title" className="font-display text-2xl sm:text-3xl font-bold text-amber-950 dark:text-amber-200 mb-3">
                {orderProcessTitle}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
                {orderProcessDesc}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: '01', title: 'Browse & Select', description: 'Review pieces and note their unique reference codes (e.g. SH-001).' },
                { step: '02', title: 'Add to Order List', description: 'Click "Add to List" or keep track of the items you want.' },
                { step: '03', title: 'Order on WhatsApp', description: 'Send your selected items directly to our team via WhatsApp.' },
                { step: '04', title: 'Doorstep Delivery', description: 'We confirm stock, provide sizing advice, and ship securely across India.' },
              ].map((item, index) => (
                <div key={index} className="p-6 rounded-2xl bg-card border border-amber-900/15 text-center relative shadow-xs hover:border-amber-600/30 transition-all">
                  <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-800 dark:text-amber-300 font-display font-bold text-base mb-3 border border-amber-600/20">
                    {item.step}
                  </div>
                  <h3 className="font-display font-medium text-base text-foreground mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Call to Action Section */}
      {visibility.cta !== false && (
        <section className="section-spacing" aria-labelledby="cta-title">
          <div className="container-sheaura">
            <div className="rounded-3xl bg-gradient-to-r from-amber-800 via-amber-900 to-amber-950 p-8 sm:p-12 md:p-14 text-center text-white shadow-xl relative overflow-hidden border border-amber-700/30">
              <h2 id="cta-title" className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 text-white tracking-tight">
                Special Occasion & Festive Jewellery
              </h2>
              <p className="text-white/85 mb-8 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
                Handcrafted necklaces, antique chokers, and bridal jewellery for weddings and celebrations. Order directly on WhatsApp or through online checkout.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Link to="/shop">
                  <Button size="lg" className="bg-white text-stone-900 font-semibold hover:bg-stone-100 shadow-md group h-11 px-7 rounded-xl">
                    Browse Catalogue
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/enquiry">
                  <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10 h-11 px-7 rounded-xl">
                    View Order List
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}