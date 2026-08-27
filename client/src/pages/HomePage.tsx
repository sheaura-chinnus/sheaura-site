import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Truck, Shield, Headphones, Star } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import { ProductCard } from '@/components/product/ProductCard'
import { CategoryCard } from '@/components/product/CategoryCard'

export function HomePage() {
  const { data: settings } = useSiteSettings()
  const { data: featuredProducts } = trpc.products.featured.useQuery({ limit: 8 })
  const { data: categories } = trpc.categories.list.useQuery()

  const heroTitle = settings?.heroTitle || 'Sheaura — Timeless Elegance for Every Occasion'
  const heroSubtitle = settings?.heroSubtitle || 'Discover exquisite jewellery, premium cosmetics, and curated ornaments. Available for purchase or rental.'

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="hero-spacing relative overflow-hidden" aria-labelledby="hero-title">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 inline-flex items-center space-x-2">
              <Sparkles className="h-3 w-3" />
              <span>New Collection Now Available</span>
            </Badge>
            <h1 id="hero-title" className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-foreground mb-6 text-balance">
              {heroTitle}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/shop">
                <Button size="xl" className="group">
                  Shop Collection
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/shop?mode=rental">
                <Button size="xl" variant="outline" className="group">
                  Rent for Your Occasion
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Trust/Value Section */}
      <section className="section-spacing bg-muted/30" aria-labelledby="trust-title">
        <div className="container-sheaura">
          <h2 id="trust-title" className="sr-only">Our Promise</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: Shield, title: 'Authenticity Guaranteed', description: 'Every piece verified for quality and craftsmanship' },
              { icon: Sparkles, title: 'Expert Styling', description: 'Personalised recommendations for your occasion' },
              { icon: Truck, title: 'Secure Delivery', description: 'Insured shipping with tracking across India' },
              { icon: Headphones, title: 'Dedicated Support', description: 'Our concierge team is here to assist you' },
            ].map((item, index) => (
              <div key={index} className="text-center p-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-4">
                  <item.icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section-spacing" aria-labelledby="categories-title">
        <div className="container-sheaura">
          <div className="text-center mb-12">
            <h2 id="categories-title" className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-4">
              Explore by Category
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Each collection is carefully curated to bring you the finest selection
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories?.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-spacing" aria-labelledby="featured-title">
        <div className="container-sheaura">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
            <div>
              <h2 id="featured-title" className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-2">
                Featured Collection
              </h2>
              <p className="text-muted-foreground">Handpicked favourites from our latest arrivals</p>
            </div>
            <Link to="/shop?featured=true" className="btn-outline self-start">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No featured products at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Rental Process Section */}
      <section className="section-spacing bg-muted/30" aria-labelledby="rental-title">
        <div className="container-sheaura">
          <div className="text-center mb-12">
            <h2 id="rental-title" className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-4">
              How Rental Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enjoy luxury pieces for your special occasions without the commitment
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Browse & Select', description: 'Choose from our curated rental collection' },
              { step: '02', title: 'Reserve Dates', description: 'Pick your event and return dates online' },
              { step: '03', title: 'Receive & Enjoy', description: 'We deliver to your doorstep or arrange pickup' },
              { step: '04', title: 'Return', description: 'Hassle-free return with prepaid shipping label' },
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

      {/* CTA Section */}
      <section className="section-spacing" aria-labelledby="cta-title">
        <div className="container-sheaura">
          <div className="rounded-2xl bg-gradient-to-r from-primary/90 to-primary p-8 md:p-16 text-center text-primary-foreground">
            <h2 id="cta-title" className="font-display text-3xl sm:text-4xl font-medium mb-4">
              Ready to Find Your Perfect Piece?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Browse our complete collection or start an enquiry for your upcoming event.
              Our team is here to help you every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/shop">
                <Button size="lg" variant="secondary" className="group">
                  Explore Collection
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Get in Touch
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}