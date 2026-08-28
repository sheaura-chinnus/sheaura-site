import { Link } from 'react-router-dom'
import { Shield, Sparkles, Heart, Clock, AlertCircle, CheckCircle2, MessageCircle } from 'lucide-react'
import { useContactInfo } from '@/hooks/useContactInfo'
import { Button } from '@/components/ui/button'

export function WarrantyPolicyPage() {
  const contact = useContactInfo()
  const brandName = contact.brandName || 'Sheaura'
  const lastUpdated = 'August 28, 2026'

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-900/10" aria-labelledby="warranty-hero">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs font-medium mb-4">
              <Shield className="h-4 w-4 text-amber-600" />
              <span>Authentic Craftsmanship Guarantee</span>
            </div>
            <h1 id="warranty-hero" className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground mb-6">
              Plating Warranty & Care Policy
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We stand behind the artistry of our 1-Gram Micro Gold Plated & Premium Fashion Jewellery with a dedicated 6-to-12 Month Plating Warranty.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Last updated: {lastUpdated} &nbsp;|&nbsp; Version 2.4
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-spacing">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto space-y-12">
            
            {/* Quick Summary Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-amber-500/5 border border-amber-900/20 space-y-4">
              <h2 className="font-display text-xl font-semibold text-amber-950 dark:text-amber-200 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
                Warranty Highlights at a Glance
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>6–12 Month Warranty:</strong> Full coverage against premature plating discoloration or tarnishing.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Skin-Safe Brass Core:</strong> 100% hypoallergenic, nickel-free & lead-safe foundation.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Anti-Tarnish Seal:</strong> Multi-layer protective lacquer for long-lasting festive luster.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Free Re-Plating / Exchange:</strong> 1-to-1 replacement or replating service for eligible claims.
                  </div>
                </div>
              </div>
            </div>

            <article className="prose prose-sheaura max-w-none">
              
              {/* Section 1: Coverage */}
              <section aria-labelledby="warranty-coverage">
                <h2 id="warranty-coverage" className="font-display text-2xl font-medium text-foreground mb-4">
                  1. Micro-Gold Plating Warranty Coverage
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Every handcrafted piece from {brandName} is coated with superior 1-gram micro gold plating or antique matte gold plating backed by our warranty against manufacturing and plating defects:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-3">
                  <li><strong>Standard 1-Gram Gold Plated Items:</strong> 6 Months Plating Warranty from the date of confirmed delivery.</li>
                  <li><strong>Bridal Sets & Premium Nakshi Masterpieces:</strong> Up to 12 Months (1 Year) Comprehensive Plating Warranty.</li>
                  <li><strong>What is Covered:</strong> Unexplained, premature peeling, flaking, or rapid tarnishing under normal recommended care guidelines.</li>
                </ul>
              </section>

              {/* Section 2: Exclusions */}
              <section aria-labelledby="warranty-exclusions">
                <h2 id="warranty-exclusions" className="font-display text-2xl font-medium text-foreground mb-4">
                  2. Warranty Exclusions & Limitations
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our warranty is designed to protect you against plating defects. However, it does not cover damage resulting from improper handling, accident, or natural wear:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-3">
                  <li><strong>Chemical & Cosmetic Exposure:</strong> Discoloration caused by direct spraying of perfumes, body mists, deodorants, hairsprays, or contact with harsh lotions.</li>
                  <li><strong>Water & Moisture Exposure:</strong> Wearing jewellery during baths, swimming, heavy workouts, or humid storage without airtight protection.</li>
                  <li><strong>Physical Damage & Mishandling:</strong> Broken clasps, bent chains, chipped stones, or scratches caused by dropping or excessive force.</li>
                  <li><strong>Third-Party Alterations:</strong> Any modification, resizing, or repair attempted by an unauthorized jeweler.</li>
                </ul>
              </section>

              {/* Section 3: Care Guidelines */}
              <section aria-labelledby="care-instructions">
                <h2 id="care-instructions" className="font-display text-2xl font-medium text-foreground mb-4">
                  3. Essential Jewellery Care Guide
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Preserve the brilliant gold shine of your {brandName} jewellery for years by following our 4-step care routine:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose my-6">
                  <div className="p-4 rounded-xl border border-amber-900/15 bg-background shadow-xs">
                    <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200 font-semibold mb-2">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      <span>Last On, First Off</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Put your jewellery on AFTER completing your makeup, hairspray, and perfume application. Remove first before sleeping.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-900/15 bg-background shadow-xs">
                    <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200 font-semibold mb-2">
                      <Heart className="h-4 w-4 text-amber-600" />
                      <span>Dry Soft Cloth Wipe</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Gently wipe your jewellery with a clean, dry micro-fiber cloth after every wear to remove body sweat and oils.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-900/15 bg-background shadow-xs">
                    <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200 font-semibold mb-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>Airtight Velvet Storage</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Always store individual pieces separately in sealed zip-lock pouches inside your Sheaura velvet box to prevent oxidation.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-900/15 bg-background shadow-xs">
                    <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200 font-semibold mb-2">
                      <AlertCircle className="h-4 w-4 text-rose-600" />
                      <span>No Liquids or Detergents</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Never submerge 1-gram gold jewellery in water, soap, ultrasonic cleaners, or jewellery dipping solutions.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 4: How to Claim */}
              <section aria-labelledby="claim-process">
                <h2 id="claim-process" className="font-display text-2xl font-medium text-foreground mb-4">
                  4. How to Submit a Warranty Claim
                </h2>
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                  <li><strong>Initiate on WhatsApp:</strong> Message our concierge at <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary font-medium">{contact.whatsapp}</a> with your Order ID and Item Code.</li>
                  <li><strong>Share Clear Media:</strong> Send 2–3 high-resolution, well-lit photos and a 5-second video highlighting the affected plating area.</li>
                  <li><strong>Evaluation (24–48 Hours):</strong> Our quality assurance team will inspect the images against purchase date and wear history.</li>
                  <li><strong>Resolution:</strong> Upon claim approval, we will arrange a complimentary re-plating service or dispatch a brand-new replacement piece.</li>
                </ol>
              </section>

              {/* Section 5: Related Links */}
              <section aria-labelledby="related-policies" className="pt-6 border-t border-border">
                <h2 id="related-policies" className="font-display text-xl font-medium text-foreground mb-3">
                  Related Operational Policies
                </h2>
                <div className="flex flex-wrap gap-4 text-sm">
                  <Link to="/refund-policy" className="text-primary underline hover:text-primary/80">
                    Return & Exchange Policy (24–72h)
                  </Link>
                  <span>•</span>
                  <Link to="/shipping-policy" className="text-primary underline hover:text-primary/80">
                    Shipping & International Delivery
                  </Link>
                  <span>•</span>
                  <Link to="/payment-policy" className="text-primary underline hover:text-primary/80">
                    Payment Methods & COD Rules
                  </Link>
                </div>
              </section>

            </article>

            {/* Concierge CTA */}
            <div className="p-6 rounded-2xl bg-muted/50 border border-amber-900/10 text-center space-y-3">
              <h3 className="font-display text-lg font-semibold text-foreground">Need Assistance with a Piece?</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Our jewellery care experts are available on WhatsApp to guide you on maintenance, sizing, or warranty verification.
              </p>
              <div className="pt-2">
                <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium gap-2 shadow-xs">
                    <MessageCircle className="h-4 w-4" />
                    Chat with Jewellery Concierge
                  </Button>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}