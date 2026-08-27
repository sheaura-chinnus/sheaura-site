import { Link } from 'react-router-dom'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { cn } from '@/lib/utils'

export function ShippingPolicyPage() {
  const { data: settings } = useSiteSettings()
  const brandName = settings?.brandName || 'Sheaura'
  const lastUpdated = 'August 24, 2026'
  const effectiveDate = 'August 24, 2026'

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-muted/30" aria-labelledby="shipping-hero">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto text-center">
            <h1 id="shipping-hero" className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground mb-6">
              Shipping & Delivery Policy
            </h1>
            <p className="text-lg text-muted-foreground">
              Last updated: {lastUpdated} &nbsp;|&nbsp; Effective: {effectiveDate}
            </p>
          </div>
        </div>
      </section>

      <section className="section-spacing">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto space-y-12">
            <article className="prose prose-sheaura max-w-none">
              <section aria-labelledby="introduction">
                <h2 id="introduction" className="font-display text-2xl font-medium text-foreground mb-4">1. Introduction</h2>
                <p>
                  This Shipping & Delivery Policy outlines how {brandName} handles delivery of purchased items
                  and rental items. It works alongside our <Link to="/terms" className="underline hover:text-primary">Terms of Service</Link>,
                  <Link to="/rental-policy" className="underline hover:text-primary">Rental Policy</Link>, and
                  <Link to="/refund-policy" className="underline hover:text-primary">Refund Policy</Link>.
                </p>
              </section>

              <section aria-labelledby="shipping-zones">
                <h2 id="shipping-zones" className="font-display text-2xl font-medium text-foreground mb-4">2. Shipping Zones</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>India (Primary):</strong> All states and union territories via trusted courier partners</li>
                  <li><strong>International:</strong> Available on request. Contact us for custom quote and timeline</li>
                  <li><strong>Restricted Areas:</strong> Some remote/conflict zones may have limited service or surcharges</li>
                </ul>
              </section>

              <section aria-labelledby="purchase-shipping">
                <h2 id="purchase-shipping" className="font-display text-2xl font-medium text-foreground mb-4">3. Purchase Shipping (Sale Items)</h2>

                <h3 className="font-medium text-lg text-foreground mb-2 mt-6">3.1 Standard Shipping</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                  <li><strong>Free Shipping:</strong> Orders above ₹{settings?.freeShippingThreshold || '10,000'}</li>
                  <li><strong>Standard Fee:</strong> ₹{settings?.standardShippingCost || '299'} for orders below threshold</li>
                  <li><strong>Timeline:</strong> 3-7 business days after order confirmation</li>
                  <li><strong>Tracking:</strong> Provided within 24 hours of dispatch</li>
                </ul>

                <h3 className="font-medium text-lg text-foreground mb-2 mt-6">3.2 Express Shipping</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                  <li><strong>Fee:</strong> ₹{settings?.expressShippingCost || '599'} (additional)</li>
                  <li><strong>Timeline:</strong> 1-3 business days (metro), 2-4 business days (non-metro)</li>
                  <li><strong>Availability:</strong> Select pin codes only. Shown at checkout.</li>
                </ul>

                <h3 className="font-medium text-lg text-foreground mb-2 mt-6">3.3 Cash on Delivery (COD)</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                  <li><strong>Availability:</strong> {settings?.codEnabled === 'true' ? 'Enabled' : 'Currently unavailable'} — shown at checkout if available</li>
                  <li><strong>Limit:</strong> Maximum ₹50,000 per order</li>
                  <li><strong>Additional Fee:</strong> ₹99 COD handling charge</li>
                  <li><strong>Payment:</strong> Exact change preferred. Digital payment link also sent as backup.</li>
                </ul>
              </section>

              <section aria-labelledby="rental-delivery">
                <h2 id="rental-delivery" className="font-display text-2xl font-medium text-foreground mb-4">4. Rental Delivery & Pickup</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Included:</strong> Delivery and pickup included in rental fee (within standard zones)</li>
                  <li><strong>Scheduling:</strong> 1-2 days before rental start. Exact slot confirmed via call/WhatsApp</li>
                  <li><strong>ID Verification:</strong> Government photo ID required at both delivery and pickup</li>
                  <li><strong>Packaging:</strong> Items delivered in secure, branded packaging. Must be reused for return</li>
                  <li><strong>Missed Delivery:</strong> Re-attempt next business day (₹500 fee). 2 failures = cancellation</li>
                  <li><strong>Pickup:</strong> Scheduled on return date. Item must be ready by 12:00 PM</li>
                </ul>
              </section>

              <section aria-labelledby="timelines">
                <h2 id="timelines" className="font-display text-2xl font-medium text-foreground mb-4">5. Processing & Dispatch Timelines</h2>
                <table className="w-full text-sm text-muted-foreground mb-6">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-foreground">Stage</th>
                      <th className="text-left py-2 px-3 font-medium text-foreground">Timeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-2 px-3">Order Confirmation</td><td className="py-2 px-3">Within 4 hours (business hours)</td></tr>
                    <tr><td className="py-2 px-3">Payment Verification</td><td className="py-2 px-3">Immediate (online) / 24h (bank transfer)</td></tr>
                    <tr><td className="py-2 px-3">Quality Check & Packing</td><td className="py-2 px-3">1-2 business days</td></tr>
                    <tr><td className="py-2 px-3">Dispatch</td><td className="py-2 px-3">Next business day after packing</td></tr>
                    <tr><td className="py-2 px-3">Transit (Standard)</td><td className="py-2 px-3">2-6 business days</td></tr>
                    <tr><td className="py-2 px-3">Transit (Express)</td><td className="py-2 px-3">1-3 business days</td></tr>
                  </tbody>
                </table>
                <p className="text-muted-foreground text-sm">
                  * Timelines are estimates. Peak seasons, weather, and courier delays may extend delivery.
                </p>
              </section>

              <section aria-labelledby="tracking">
                <h2 id="tracking" className="font-display text-2xl font-medium text-foreground mb-4">6. Tracking & Notifications</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li>Tracking link sent via email and WhatsApp/SMS upon dispatch</li>
                  <li>Real-time tracking available on courier partner website</li>
                  <li>Delivery day notifications: morning (out for delivery) and post-delivery</li>
                  <li>Contact us if tracking hasn't updated in 48 hours</li>
                </ul>
              </section>

              <section aria-labelledby="delivery-issues">
                <h2 id="delivery-issues" className="font-display text-2xl font-medium text-foreground mb-4">7. Delivery Issues</h2>

                <h3 className="font-medium text-lg text-foreground mb-2 mt-6">7.1 Failed Delivery</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                  <li>Courier attempts delivery 2 times over 2 business days</li>
                  <li>After 2 failures: held at local courier hub for 5 days</li>
                  <li>Customer can collect from hub or request re-delivery (₹500 fee)</li>
                  <li>Unclaimed after 5 days: returned to us. Refund issued minus return shipping</li>
                </ul>

                <h3 className="font-medium text-lg text-foreground mb-2 mt-6">7.2 Damaged in Transit</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                  <li>Refuse delivery if packaging shows obvious damage/tampering</li>
                  <li>If accepted, document damage with photos within 24 hours</li>
                  <li>Contact us immediately — we'll arrange replacement or full refund</li>
                  <li>Do not discard original packaging until resolved</li>
                </ul>

                <h3 className="font-medium text-lg text-foreground mb-2 mt-6">7.3 Lost in Transit</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                  <li>Declared lost if no tracking update for 10 business days (15 for international)</li>
                  <li>Full refund or replacement at your choice</li>
                  <li>We file insurance claim with courier — no action needed from you</li>
                </ul>
              </section>

              <section aria-labelledby="address">
                <h2 id="address" className="font-display text-2xl font-medium text-foreground mb-4">8. Address & Delivery Instructions</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Accuracy:</strong> You are responsible for correct, complete address including PIN code</li>
                  <li><strong>Landmarks:</strong> Helpful for courier — add in address line 2</li>
                  <li><strong>Contact:</strong> Valid phone number mandatory for delivery coordination</li>
                  <li><strong>Changes:</strong> Address changes after dispatch may not be possible. Contact us immediately</li>
                  <li><strong>Office/Business:</strong> Provide company name and receiver name</li>
                </ul>
              </section>

              <section aria-labelledby="international">
                <h2 id="international" className="font-display text-2xl font-medium text-foreground mb-4">9. International Shipping</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Availability:</strong> On request only. Email <a href="mailto:international@sheaura.com" className="underline hover:text-primary">international@sheaura.com</a></li>
                  <li><strong>Timeline:</strong> 7-21 business days depending on destination</li>
                  <li><strong>Cost:</strong> Calculated per order (weight, value, destination, service level)</li>
                  <li><strong>Customs:</strong> Duties, taxes, and clearance fees are buyer's responsibility</li>
                  <li><strong>Restrictions:</strong> Some items (cosmetics, certain metals) may have export restrictions</li>
                  <li><strong>Insurance:</strong> Mandatory for orders &gt;$500. Cost included in shipping quote</li>
                  <li><strong>Returns:</strong> International returns not accepted except for our error</li>
                </ul>
              </section>

              <section aria-labelledby="packaging">
                <h2 id="packaging" className="font-display text-2xl font-medium text-foreground mb-4">10. Packaging</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Jewellery:</strong> Individual pouch + branded box + tamper-evident seal + outer courier box</li>
                  <li><strong>Cosmetics:</strong> Bubble wrap + branded box + outer courier box</li>
                  <li><strong>Ornaments:</strong> Custom foam/fabric inserts + branded box + outer courier box</li>
                  <li><strong>Rental:</strong> Same premium packaging. Must be reused for return</li>
                  <li><strong>Gift Packaging:</strong> Complimentary gift wrap available — select at checkout</li>
                  <li><strong>Sustainability:</strong> Recyclable materials. Minimal plastic. Reusable pouches/boxes</li>
                </ul>
              </section>

              <section aria-labelledby="risk">
                <h2 id="risk" className="font-display text-2xl font-medium text-foreground mb-4">11. Risk Transfer</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Purchases:</strong> Risk transfers to you upon successful delivery (signature/OTP confirmation)</li>
                  <li><strong>Rentals:</strong> Risk transfers at handover. Returns: risk transfers back to us at pickup</li>
                  <li><strong>Unattended Delivery:</strong> If you authorize "leave at door," risk transfers at drop-off</li>
                </ul>
              </section>

              <section aria-labelledby="contact">
                <h2 id="contact" className="font-display text-2xl font-medium text-foreground mb-4">12. Contact Us</h2>
                <p className="text-muted-foreground">
                  For shipping queries, tracking issues, or delivery coordination:
                </p>
                <address className="not-italic text-muted-foreground mt-4 space-y-1">
                  <p><strong>{brandName} Logistics</strong></p>
                  <p>Email: <a href="mailto:shipping@sheaura.com" className="underline hover:text-primary">shipping@sheaura.com</a></p>
                  <p>Phone: <a href="tel:+919876543210" className="underline hover:text-primary">+91 98765 43210</a></p>
                  <p>WhatsApp: <a href="https://wa.me/919876543210" className="underline hover:text-primary" target="_blank" rel="noopener noreferrer">+91 98765 43210</a></p>
                </address>
              </section>
            </article>

            <div className="pt-8 border-t border-border">
              <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}