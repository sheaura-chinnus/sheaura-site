import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Truck, Shield, MessageCircle, Gem } from 'lucide-react'
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
  const heroEyebrow = settings?.heroEyebrow || 'Handcrafted Heritage & Festive Glamour'
  const heroHeading = settings?.heroHeading || settings?.heroTitle || 'The Art of Handcrafted Luxury Fashion Jewellery'
  const heroSupportingText = settings?.heroSupportingText || settings?.heroSubtitle || 'Discover royal antique chokers, temple bridal sets, and festive statement jewellery crafted to celebrate your finest moments. Order seamlessly on WhatsApp.'
  const heroPrimaryLabel = settings?.heroPrimaryCtaLabel || 'Explore Collections'
  const heroPrimaryLink = settings?.heroPrimaryCtaLink || '/shop'
  const heroSecondaryLabel = settings?.heroSecondaryCtaLabel || 'How to Order'
  const heroSecondaryLink = settings?.heroSecondaryCtaLink || '#how-to-order'

  // Dynamic section titles and descriptions
  const orderProcessTitle = settings?.sectionRentalOrnamentsTitle || 'How to Order on WhatsApp'
  const orderProcessDesc = settings?.sectionRentalOrnamentsDesc || 'A seamless 4-step concierge experience for ordering your favourite handcrafted jewellery'
  const featuredTitle = settings?.sectionSaleProductsTitle || 'Curated Signature Jewellery'
  const featuredDesc = settings?.sectionSaleProductsDesc || 'Handcrafted necklaces, bridal sets, and occasion pieces available for direct purchase'

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
      {/* 1. Hero Section (Stitch Quiet Luxury) */}
      {visibility.hero !== false && (
        <section className="hero-spacing relative overflow-hidden bg-gradient-to-b from-amber-50/50 via-background to-background" aria-labelledby="hero-title">
          <div className="container-sheaura">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-6 inline-flex items-center space-x-2 px-3.5 py-1 bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-600/25">
                <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                <span className="text-xs font-semibold uppercase tracking-wider">{heroEyebrow}</span>
              </Badge>
              <h1 id="hero-title" className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-amber-950 dark:text-amber-200 mb-6 text-balance leading-[1.15]">
                {heroHeading}
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto text-balance leading-relaxed">
                {heroSupportingText}
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-5 w-full max-w-sm sm:max-w-none mx-auto">
                <Link to={heroPrimaryLink} className="w-full sm:w-auto">
                  <Button size="xl" className="w-full sm:w-auto bg-amber-700 hover:bg-amber-800 text-white font-semibold shadow-lg group h-13 px-8 rounded-xl">
                    {heroPrimaryLabel}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <a href={heroSecondaryLink} className="w-full sm:w-auto">
                  <Button size="xl" variant="outline" className="w-full sm:w-auto border-2 border-amber-700/30 text-amber-950 dark:text-amber-300 hover:bg-amber-500/10 font-semibold h-13 px-8 rounded-xl">
                    {heroSecondaryLabel}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Decorative ambient gold glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-700/10 rounded-full blur-3xl" />
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
                { icon: Gem, title: 'Master Craftsmanship', description: 'Intricate micro gold polish, antique patina, and hand-set stones' },
                { icon: Shield, title: 'Premium Alloy Base', description: 'Skin-friendly, long-lasting high quality fashion jewellery' },
                { icon: Truck, title: 'Pan-India Delivery', description: 'Safe packaging in protective jewellery boxes with express dispatch' },
                { icon: MessageCircle, title: 'WhatsApp Concierge', description: 'Personal styling help, video previews, and easy ordering' },
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
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest block mb-2">Curated Collections</span>
              <h2 id="categories-title" className="font-display text-3xl sm:text-4xl font-bold text-amber-950 dark:text-amber-200 mb-4">
                Explore by Category
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
                Discover handcrafted temple jewellery, signature bridal sets, choker necklaces, and festive earrings
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
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest block mb-2">Handpicked for Celebrations</span>
                <h2 id="featured-title" className="font-display text-3xl sm:text-4xl font-bold text-amber-950 dark:text-amber-200 mb-2">
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
                <p className="text-muted-foreground font-medium">Explore our complete jewellery catalogue.</p>
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
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest block mb-2">Easy & Transparent</span>
              <h2 id="order-process-title" className="font-display text-3xl sm:text-4xl font-bold text-amber-950 dark:text-amber-200 mb-4">
                {orderProcessTitle}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
                {orderProcessDesc}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: '01', title: 'Browse & Select', description: 'Explore our exquisite designs. Each piece has a unique item code (e.g. SH-001).' },
                { step: '02', title: 'Add to Order List', description: 'Click "Add to List" or note down the item codes you wish to purchase.' },
                { step: '03', title: 'Order on WhatsApp', description: 'Click "Send Order on WhatsApp" to connect directly with our styling team.' },
                { step: '04', title: 'Doorstep Delivery', description: 'We confirm availability, custom sizing, and dispatch safely across India.' },
              ].map((item, index) => (
                <div key={index} className="p-6 rounded-2xl bg-card border border-amber-900/15 text-center relative shadow-xs hover:border-amber-600/30 transition-all">
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-800 dark:text-amber-300 font-display font-bold text-lg mb-4 border border-amber-600/20">
                    {item.step}
                  </div>
                  <h3 className="font-display font-medium text-base sm:text-lg text-foreground mb-2">{item.title}</h3>
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
            <div className="rounded-3xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 p-8 sm:p-12 md:p-16 text-center text-white shadow-2xl relative overflow-hidden border border-amber-600/30">
              <h2 id="cta-title" className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white tracking-tight">
                Celebrate in Royal Splendor
              </h2>
              <p className="text-white/90 mb-8 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg leading-relaxed">
                Discover handcrafted necklaces, antique chokers, and festive jewellery made for unforgettable moments. Order directly on WhatsApp with our concierge team.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/shop">
                  <Button size="lg" className="bg-white text-stone-900 font-semibold hover:bg-stone-100 shadow-xl group h-12 px-8 rounded-xl">
                    Explore Jewellery Catalogue
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/enquiry">
                  <Button size="lg" className="bg-amber-950/80 text-white font-semibold hover:bg-amber-950 border border-amber-400/40 shadow-xl h-12 px-8 rounded-xl">
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