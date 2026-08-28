import { Link } from 'react-router-dom'
import { useContactInfo } from '@/hooks/useContactInfo'

export function ShippingPolicyPage() {
  const contact = useContactInfo()
  const brandName = contact.brandName
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
                  This Shipping & Delivery Policy outlines how {brandName} handles dispatch, packaging, and pan-India delivery of our handcrafted fashion jewellery. It works alongside our <Link to="/terms" className="underline hover:text-primary">Terms of Service</Link> and
                  <Link to="/refund-policy" className="underline hover:text-primary">Refund Policy</Link>.
                </p>
              </section>

              <section aria-labelledby="shipping-zones">
                <h2 id="shipping-zones" className="font-display text-2xl font-medium text-foreground mb-4">2. Shipping Zones</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>India (Primary):</strong> All states and union territories via trusted express courier partners (Delhivery, BlueDart, DTDC, India Post)</li>
                  <li><strong>International:</strong> Available on request. Contact our WhatsApp concierge for custom shipping quotes and delivery schedules</li>
                </ul>
              </section>

              <section aria-labelledby="purchase-shipping">
                <h2 id="purchase-shipping" className="font-display text-2xl font-medium text-foreground mb-4">3. Shipping Rates & Delivery Times</h2>

                <h3 className="font-medium text-lg text-foreground mb-2 mt-6">3.1 Standard Shipping</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                  <li><strong>Free Shipping:</strong> Complimentary pan-India shipping on all orders</li>
                  <li><strong>Delivery Timeline:</strong> 3-7 business days across India depending on location</li>
                  <li><strong>Live Tracking:</strong> Courier tracking link shared directly via WhatsApp / SMS within 24 hours of dispatch</li>
                </ul>

                <h3 className="font-medium text-lg text-foreground mb-2 mt-6">3.2 Express Metro Dispatch</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                  <li><strong>Timeline:</strong> 1-3 business days for major tier-1 metros (Bangalore, Chennai, Mumbai, Delhi, Hyderabad, Kochi)</li>
                  <li><strong>Priority Handling:</strong> Same-day dispatch available for urgent bridal / event orders upon request</li>
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
                <h2 id="packaging" className="font-display text-2xl font-medium text-foreground mb-4">10. Packaging & Unboxing</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Protective Velvet Cases:</strong> All jewellery sets are packed in custom padded velvet boxes with moisture-absorbing silica pouches</li>
                  <li><strong>Tamper-Proof Courier Boxes:</strong> Secure exterior carton with tamper-evident security seal</li>
                  <li><strong>Gift Presentation:</strong> Elegant gift-ready presentation included with every order</li>
                </ul>
              </section>

              <section aria-labelledby="risk">
                <h2 id="risk" className="font-display text-2xl font-medium text-foreground mb-4">11. Risk Transfer</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Purchases:</strong> Risk transfers to you upon successful courier handover (signature / OTP confirmation)</li>
                  <li><strong>Transit Insurance:</strong> All shipments are fully insured during transit against damage or loss</li>
                </ul>
              </section>

              <section aria-labelledby="contact">
                <h2 id="contact" className="font-display text-2xl font-medium text-foreground mb-4">12. Contact Us</h2>
                <p className="text-muted-foreground">
                  For shipping queries, tracking issues, or delivery coordination:
                </p>
                <address className="not-italic text-muted-foreground mt-4 space-y-1">
                  <p><strong>{brandName} Logistics</strong></p>
                  <p>Email: {contact.emailHref ? <a href={contact.emailHref} className="underline hover:text-primary">{contact.email}</a> : contact.email}</p>
                  <p>Phone: {contact.phoneHref ? <a href={contact.phoneHref} className="underline hover:text-primary">{contact.phone}</a> : contact.phone}</p>
                  <p>WhatsApp: {contact.whatsappHref ? <a href={contact.whatsappHref} className="underline hover:text-primary" target="_blank" rel="noopener noreferrer">{contact.whatsapp}</a> : contact.whatsapp}</p>
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