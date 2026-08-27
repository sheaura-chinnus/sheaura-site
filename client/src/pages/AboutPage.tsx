import { Link } from 'react-router-dom'
import { Sparkles, Gem, Leaf, Heart, Truck, Shield, Award, Users } from 'lucide-react'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Gem,
    title: 'Curated Collections',
    description: 'Handpicked jewellery, cosmetics, and ornaments from trusted artisans and premium brands.',
  },
  {
    icon: Sparkles,
    title: 'Sale & Rental Options',
    description: 'Choose to own your favourites forever or rent exquisite pieces for special occasions.',
  },
  {
    icon: Leaf,
    title: 'Ethical Sourcing',
    description: 'Commitment to responsible sourcing, conflict-free materials, and sustainable practices.',
  },
  {
    icon: Heart,
    title: 'Personalized Service',
    description: 'Dedicated consultants to help you find the perfect piece for every moment.',
  },
]

const values = [
  {
    icon: Award,
    title: 'Excellence',
    description: 'Uncompromising quality in every piece we offer, from design to delivery.',
  },
  {
    icon: Shield,
    title: 'Trust',
    description: 'Transparent pricing, authenticity guarantees, and honest guidance always.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Building lasting relationships with clients who appreciate timeless beauty.',
  },
  {
    icon: Truck,
    title: 'Reliability',
    description: 'Secure pan-India shipping, easy returns, and hassle-free rental returns.',
  },
]

const milestones = [
  { year: '2020', title: 'Founded', description: 'Sheaura began with a vision to make premium jewellery accessible.' },
  { year: '2021', title: 'First Boutique', description: 'Opened our flagship store in Mumbai, offering curated collections.' },
  { year: '2022', title: 'Rental Launch', description: 'Introduced jewellery rental service for weddings and events.' },
  { year: '2023', title: 'Cosmetics Line', description: 'Expanded into premium cosmetics and beauty essentials.' },
  { year: '2024', title: 'National Reach', description: 'Pan-India delivery with 10,000+ happy customers served.' },
]

export function AboutPage() {
  const { data: settings } = useSiteSettings()
  const brandName = settings?.brandName || 'Sheaura'
  const brandTagline = settings?.brandTagline || 'Timeless Elegance, Curated for You'

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-b from-muted/30 to-background overflow-hidden" aria-labelledby="about-hero">
        <div className="container-sheaura">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              Our Story
            </span>
            <h1 id="about-hero" className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground mb-6 leading-tight">
              {brandName} — {brandTagline}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Founded with a passion for timeless beauty, we curate exceptional jewellery, premium cosmetics,
              and exquisite ornaments — available for purchase or rental — so every moment shines.
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-10 left-5 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-5 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-10 w-24 h-24 bg-primary/5 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Mission Section */}
      <section className="section-spacing" aria-labelledby="mission-title">
        <div className="container-sheaura">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Our Mission
              </span>
              <h2 id="mission-title" className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-6">
                Making Luxury Accessible,<br />Every Day & For Every Occasion
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  At {brandName}, we believe that elegance shouldn't be reserved for rare moments.
                  Whether you're celebrating a milestone, preparing for your wedding, or simply
                  treating yourself — you deserve access to exquisite pieces that make you feel extraordinary.
                </p>
                <p>
                  Our dual model of sale and rental means you can invest in heirloom pieces to cherish
                  forever, or rent stunning jewellery for that one magical evening — both with the same
                  guarantee of authenticity, quality, and personalized service.
                </p>
                <p>
                  Every item in our collection is carefully selected by our experts, ensuring
                  conflict-free sourcing, exceptional craftsmanship, and timeless design that
                  transcends fleeting trends.
                </p>
              </div>
              <Link to="/shop">
                <Button size="lg" className="mt-2">
                  Explore Our Collection
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted/50 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-24 w-24 text-primary/20" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-72 h-72 bg-primary/10 rounded-full blur-3xl" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-spacing bg-muted/30" aria-labelledby="features-title">
        <div className="container-sheaura">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="features-title" className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-4">
              Why Choose Sheaura
            </h2>
            <p className="text-muted-foreground text-lg">
              Four pillars that define every experience with us
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="card-sheaura text-center p-6">
                <CardContent className="space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-7 w-7 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-medium text-lg text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-spacing" aria-labelledby="values-title">
        <div className="container-sheaura">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="values-title" className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-4">
              Our Core Values
            </h2>
            <p className="text-muted-foreground text-lg">
              The principles that guide every decision we make
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div key={index} className="flex gap-4 p-6 rounded-xl bg-card border border-border">
                <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                  <value.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-medium text-lg text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="section-spacing bg-muted/30" aria-labelledby="journey-title">
        <div className="container-sheaura">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="journey-title" className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-4">
              Our Journey
            </h2>
            <p className="text-muted-foreground text-lg">
              Milestones that shaped who we are today
            </p>
          </div>

          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-primary/20" aria-hidden="true" />
            <div className="space-y-10">
              {milestones.map((milestone, index) => (
                <div key={index} className="relative flex gap-6">
                  <div className="relative flex-shrink-0 w-12 h-12 rounded-full bg-primary border-4 border-background flex items-center justify-center z-10">
                    <span className="text-xs font-bold text-primary">{milestone.year}</span>
                  </div>
                  <div className="pt-1 flex-1">
                    <h3 className="font-medium text-lg text-foreground mb-1">{milestone.title}</h3>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing" aria-labelledby="cta-title">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto text-center p-8 lg:p-12 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
            <h2 id="cta-title" className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-4">
              Ready to Find Your Perfect Piece?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              Browse our curated collections, add favourites to your enquiry basket,
              and let our team guide you to the perfect choice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/shop">
                <Button size="lg" className="w-full sm:w-auto">
                  Shop Collection
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}