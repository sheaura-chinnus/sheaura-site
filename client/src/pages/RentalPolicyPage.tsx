import { Link } from 'react-router-dom'
import { useContactInfo } from '@/hooks/useContactInfo'

export function RentalPolicyPage() {
  const contact = useContactInfo()
  const brandName = contact.brandName
  const lastUpdated = 'August 24, 2026'
  const effectiveDate = 'August 24, 2026'

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-muted/30" aria-labelledby="rental-hero">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto text-center">
            <h1 id="rental-hero" className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground mb-6">
              Rental Policy
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
                  This Rental Policy governs all rental transactions through {brandName}. By renting from us,
                  you agree to these terms. Please read carefully before submitting a rental enquiry.
                </p>
                <p>
                  All rentals are subject to availability and confirmation by our team. This policy works
                  alongside our <Link to="/terms" className="underline hover:text-primary">Terms of Service</Link>
                  and <Link to="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
                </p>
              </section>

              <section aria-labelledby="eligibility">
                <h2 id="eligibility" className="font-display text-2xl font-medium text-foreground mb-4">2. Eligibility</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li>You must be 18 years or older to rent</li>
                  <li>Valid government-issued photo ID required at delivery</li>
                  <li>Service available within our delivery zones (primarily India)</li>
                  <li>International rentals available on request with additional terms</li>
                </ul>
              </section>

              <section aria-labelledby="rental-process">
                <h2 id="rental-process" className="font-display text-2xl font-medium text-foreground mb-4">3. Rental Process</h2>
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                  <li><strong>Enquiry:</strong> Add items to your enquiry basket and submit. This is not a booking.</li>
                  <li><strong>Confirmation:</strong> Our team contacts you within 24 hours to confirm availability, pricing, and terms.</li>
                  <li><strong>Agreement:</strong> You review and accept the rental agreement with final terms.</li>
                  <li><strong>Payment:</strong> Rental fee + refundable deposit due before dispatch.</li>
                  <li><strong>Delivery:</strong> Scheduled per agreement. ID verification at handover.</li>
                  <li><strong>Enjoy:</strong> Use the item for the agreed rental period.</li>
                  <li><strong>Return:</strong> We arrange pickup on the agreed return date.</li>
                  <li><strong>Inspection & Refund:</strong> Item inspected; deposit refunded within 7 business days.</li>
                </ol>
              </section>

              <section aria-labelledby="rental-period">
                <h2 id="rental-period" className="font-display text-2xl font-medium text-foreground mb-4">4. Rental Period</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Standard Duration:</strong> 7 days (configurable per product)</li>
                  <li><strong>Start Date:</strong> Delivery date (or event date if specified and agreed)</li>
                  <li><strong>End Date:</strong> Agreed return date. Item must be ready for pickup by 12:00 PM.</li>
                  <li><strong>Extensions:</strong> Request at least 48 hours before end date. Subject to availability and additional fees.</li>
                  <li><strong>Early Return:</strong> No refund for unused days unless agreed in writing.</li>
                </ul>
              </section>

              <section aria-labelledby="deposit">
                <h2 id="deposit" className="font-display text-2xl font-medium text-foreground mb-4">5. Security Deposit</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Amount:</strong> Varies by product (typically 20-40% of retail value). Shown at checkout.</li>
                  <li><strong>Purpose:</strong> Covers damage, loss, theft, or late returns.</li>
                  <li><strong>Payment:</strong> Collected with rental fee before dispatch. Same payment method.</li>
                  <li><strong>Refund:</strong> Processed within 7 business days of safe return and inspection.</li>
                  <li><strong>Deductions:</strong> Repair costs, replacement value, late fees, cleaning fees as applicable.</li>
                  <li><strong>Disputes:</strong> Photos taken at delivery and return. Disputes resolved per agreement.</li>
                </ul>
              </section>

              <section aria-labelledby="care-responsibility">
                <h2 id="care-responsibility" className="font-display text-2xl font-medium text-foreground mb-4">6. Care & Responsibility</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Your Responsibility:</strong> Item is your responsibility from handover to return pickup.</li>
                  <li><strong>Normal Wear:</strong> Minor scratches, tarnish from normal use are acceptable.</li>
                  <li><strong>Damage:</strong> Dents, broken clasps, missing stones, stains, structural damage are chargeable.</li>
                  <li><strong>Loss/Theft:</strong> Full replacement value (retail price) charged. Police report required for theft.</li>
                  <li><strong>Cosmetics:</strong> Rental cosmetics must be returned with &gt;50% product remaining. Hygiene seals intact.</li>
                  <li><strong>Repairs:</strong> Only our authorized jewelers may repair. Unauthorized repairs void deposit protection.</li>
                </ul>
              </section>

              <section aria-labelledby="late-returns">
                <h2 id="late-returns" className="font-display text-2xl font-medium text-foreground mb-4">7. Late Returns</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Grace Period:</strong> 4 hours after agreed return time.</li>
                  <li><strong>Daily Late Fee:</strong> 10% of rental fee per day (or part thereof).</li>
                  <li><strong>Extended Delay (&gt;7 days):</strong> Treated as loss — full retail value charged from deposit.</li>
                  <li><strong>Communication:</strong> Contact us immediately if delay is unavoidable. We may approve extensions.</li>
                </ul>
              </section>

              <section aria-labelledby="cancellation">
                <h2 id="cancellation" className="font-display text-2xl font-medium text-foreground mb-4">8. Cancellation & Changes</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>7 days before rental:</strong> Full refund of rental fee and deposit.</li>
                  <li><strong>3-7 days before rental:</strong> 50% rental fee refunded. Deposit fully refunded.</li>
                  <li><strong>&lt;3 days before rental:</strong> No rental fee refund. Deposit fully refunded.</li>
                  <li><strong>After dispatch:</strong> No refunds. Standard late/loss terms apply.</li>
                  <li><strong>Changes:</strong> Date/item changes subject to availability. Admin fee may apply.</li>
                </ul>
              </section>

              <section aria-labelledby="payment">
                <h2 id="payment" className="font-display text-2xl font-medium text-foreground mb-4">9. Payment Terms</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li>Full rental fee + deposit due before dispatch</li>
                  <li>Accepted: Cards, UPI, Net Banking, Bank Transfer</li>
                  <li>Payments via PCI-DSS compliant partners. We don't store card details.</li>
                  <li>GST applicable as per Indian law (included in displayed prices)</li>
                  <li>Failed payments result in order hold/cancellation</li>
                </ul>
              </section>

              <section aria-labelledby="delivery-pickup">
                <h2 id="delivery-pickup" className="font-display text-2xl font-medium text-foreground mb-4">10. Delivery & Pickup</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Delivery:</strong> Scheduled 1-2 days before rental start. ID verification required.</li>
                  <li><strong>Pickup:</strong> Scheduled on return date. Item must be packed and ready.</li>
                  <li><strong>Missed Delivery/Pickup:</strong> Re-attempt fee ₹500. After 2 failed attempts, rental cancelled (no refund).</li>
                  <li><strong>Address Changes:</strong> Notify 48 hours prior. May incur additional charges.</li>
                  <li><strong>Packaging:</strong> Original packaging must be used for return. Replacement packaging charged if missing.</li>
                </ul>
              </section>

              <section aria-labelledby="insurance">
                <h2 id="insurance" className="font-display text-2xl font-medium text-foreground mb-4">11. Insurance</h2>
                <p className="text-muted-foreground mb-4">
                  Our deposit covers minor damages only. For high-value items (₹50,000+), we strongly recommend:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Personal valuable items insurance</li>
                  <li>Home contents insurance with 'away from home' cover</li>
                  <li>Specialist jewellery insurance</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  We can provide valuation certificates for insurance purposes upon request.
                </p>
              </section>

              <section aria-labelledby="special-occasions">
                <h2 id="special-occasions" className="font-display text-2xl font-medium text-foreground mb-4">12. Weddings & Events</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li>Book at least 30 days in advance for wedding season (Oct-Feb)</li>
                  <li>Event date confirmation required at booking</li>
                  <li>Extended rental periods available for multi-day events</li>
                  <li>On-site styling assistance available in select cities (additional fee)</li>
                  <li>Backup piece option available for critical events</li>
                </ul>
              </section>

              <section aria-labelledby="disputes">
                <h2 id="disputes" className="font-display text-2xl font-medium text-foreground mb-4">13. Dispute Resolution</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li>Condition documented with timestamped photos at delivery and return</li>
                  <li>Disputes raised within 48 hours of return inspection</li>
                  <li>Third-party jeweler assessment available (cost shared if dispute valid)</li>
                  <li>Final decision by {brandName} management, subject to legal recourse</li>
                </ul>
              </section>

              <section aria-labelledby="contact">
                <h2 id="contact" className="font-display text-2xl font-medium text-foreground mb-4">14. Contact Us</h2>
                <p className="text-muted-foreground">
                  For questions about this Rental Policy or your rental:
                </p>
                <address className="not-italic text-muted-foreground mt-4 space-y-1">
                  <p><strong>{brandName} Rental Team</strong></p>
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