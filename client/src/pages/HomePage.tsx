import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Truck, Shield, Headphones } from 'lucide-react'
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
  const heroEyebrow = settings?.heroEyebrow || 'New Occasion Collection'
  const heroHeading = settings?.heroHeading || settings?.heroTitle || 'Timeless Elegance with Curated Imitation Jewellery & Rental Ornaments'
  const heroSupportingText = settings?.heroSupportingText || settings?.heroSubtitle || 'Discover handcrafted fashion jewellery, premium cosmetics, and grand ornaments curated for weddings, parties, and celebrations — available for purchase or rental.'
  const heroPrimaryLabel = settings?.heroPrimaryCtaLabel || 'Browse Rental Ornaments'
  const heroPrimaryLink = settings?.heroPrimaryCtaLink || '/rental-ornaments'
  const heroSecondaryLabel = settings?.heroSecondaryCtaLabel || 'How Rental Works'
  const heroSecondaryLink = settings?.heroSecondaryCtaLink || '#rental-process'

  // Dynamic section titles and descriptions
  const rentalTitle = settings?.sectionRentalOrnamentsTitle || 'How Rental Works'
  const rentalDesc = settings?.sectionRentalOrnamentsDesc || 'Enjoy grand occasion ornaments for your celebrations with transparent security deposit terms'
  const featuredTitle = settings?.sectionSaleProductsTitle || 'Featured Rental Ornaments'
  const featuredDesc = settings?.sectionSaleProductsDesc || 'Handcrafted imitation jewellery and occasion rental ornaments from our curated catalogue'

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
        <section className="hero-spacing relative overflow-hidden" aria-labelledby="hero-title">
          <div className="container-sheaura">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-6 inline-flex items-center space-x-2">
                <Sparkles className="h-3 w-3" />
                <span>{heroEyebrow}</span>
              </Badge>
              <h1 id="hero-title" className="font-display text-3xl sm:text-4xl lg:text-6xl font-medium tracking-tight text-foreground mb-4 sm:mb-6 text-balance">
                {heroHeading}
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto text-balance">
                {heroSupportingText}
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full max-w-sm sm:max-w-none mx-auto">
                <Link to={heroPrimaryLink} className="w-full sm:w-auto">
                  <Button size="xl" className="w-full sm:w-auto group">
                    {heroPrimaryLabel}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to={heroSecondaryLink} className="w-full sm:w-auto">
                  <Button size="xl" variant="outline" className="w-full sm:w-auto group">
                    {heroSecondaryLabel}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Decorative background glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          </div>
        </section>
      )}

      {/* 2. Trust Badges Section */}
      {visibility.trustBadges !== false && (
        <section className="section-spacing bg-muted/30" aria-labelledby="trust-title">
          <div className="container-sheaura">
            <h2 id="trust-title" className="sr-only">Our Promise</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
              {[
                { icon: Shield, title: 'Quality Craftsmanship', description: 'Every imitation piece verified for finish and durability' },
                { icon: Sparkles, title: 'Occasion Styling', description: 'Curated bridal, festive, and party styling accents' },
                { icon: Truck, title: 'Secure Insured Delivery', description: 'Careful packaging and pan-India tracked shipping' },
                { icon: Headphones, title: 'Dedicated Support', description: 'Enquiry assistance and rental coordination team' },
              ].map((item, index) => (
                <div key={index} className="text-center p-3 sm:p-6 bg-card/60 sm:bg-transparent rounded-xl sm:rounded-none border sm:border-0 border-border/60">
                  <div className="inline-flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-primary/10 text-primary mb-3 sm:mb-4">
                    <item.icon className="h-5 w-5 sm:h-7 sm:w-7" aria-hidden="true" />
                  </div>
                  <h3 className="font-medium text-xs sm:text-base text-foreground mb-1 sm:mb-2">{item.title}</h3>
                  <p className="text-[11px] sm:text-sm text-muted-foreground">{item.description}</p>
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
              <h2 id="categories-title" className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-4">
                Explore by Category
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore our collections of imitation jewellery, cosmetics, and occasion ornaments
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
        <section className="section-spacing" aria-labelledby="featured-title">
          <div className="container-sheaura">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
              <div>
                <h2 id="featured-title" className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-2">
                  {featuredTitle}
                </h2>
                <p className="text-muted-foreground">{featuredDesc}</p>
              </div>
              <Link to="/rental-ornaments?featured=true" className="btn-outline self-start">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {featuredProducts && featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No featured items at the moment.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 5. Rental Process Section */}
      {visibility.rentalProcess !== false && (
        <section id="rental-process" className="section-spacing bg-muted/30 scroll-mt-20" aria-labelledby="rental-title">
          <div className="container-sheaura">
            <div className="text-center mb-12">
              <h2 id="rental-title" className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-4">
                {rentalTitle}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {rentalDesc}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: '01', title: 'Browse Ornaments', description: 'Explore bridal, temple, and celebration pieces with clear item codes' },
                { step: '02', title: 'Enquire on WhatsApp', description: 'Click WhatsApp Enquiry or assemble multiple pieces in your Enquiry List' },
                { step: '03', title: 'Confirm Availability', description: 'Our team verifies dates, fitting guidance, and refundable security deposit' },
                { step: '04', title: 'Wear & Return', description: 'Celebrate with confidence and return your ornaments hassle-free' },
              ].map((item, index) => (
                <div key={index} className="text-center p-6 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-lg">
                    {item.step}
                  </div>
                  <div className="pt-8">
                    <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
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
            <div className="rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 p-8 md:p-14 text-center text-white shadow-xl">
              <h2 id="cta-title" className="font-display text-3xl sm:text-4xl font-semibold mb-4 text-white">
                Planning an Upcoming Celebration?
              </h2>
              <p className="text-white/90 mb-8 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                Browse our complete collection of rental ornaments and connect with our styling team on WhatsApp for availability and bookings.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/rental-ornaments">
                  <Button size="lg" className="bg-white text-stone-900 font-semibold hover:bg-stone-100 shadow-md group h-12 px-6">
                    Browse Rental Ornaments
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/enquiry">
                  <Button size="lg" className="bg-stone-900 text-white font-semibold hover:bg-stone-800 border-2 border-white/50 shadow-md h-12 px-6">
                    View Enquiry List
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