import { Link } from 'react-router-dom'
import { useContactInfo } from '@/hooks/useContactInfo'

export function RefundPolicyPage() {
  const contact = useContactInfo()
  const brandName = contact.brandName
  const lastUpdated = 'August 24, 2026'
  const effectiveDate = 'August 24, 2026'

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-muted/30" aria-labelledby="refund-hero">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto text-center">
            <h1 id="refund-hero" className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground mb-6">
              Refund & Return Policy
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
                <h2 id="introduction" className="font-display text-2xl font-medium text-foreground mb-4">1. Introduction & Overview</h2>
                <p className="text-muted-foreground leading-relaxed">
                  At {brandName}, each piece of 1-gram micro gold-plated and fashion jewellery is rigorously inspected and securely packed in tamper-evident velvet boxes. This Return & Exchange Policy governs all purchases made through our direct-to-consumer platform.
                  It works alongside our <Link to="/terms" className="underline hover:text-primary">Terms of Service</Link>,
                  <Link to="/shipping-policy" className="underline hover:text-primary">Shipping Policy</Link>, and
                  <Link to="/warranty-policy" className="underline hover:text-primary">Plating Warranty & Care Policy</Link>.
                </p>
              </section>

              <section aria-labelledby="return-window">
                <h2 id="return-window" className="font-display text-2xl font-medium text-foreground mb-4">2. Strict Return & Exchange Window (24–72 Hours)</h2>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4 text-amber-950 dark:text-amber-200">
                  <p className="text-sm font-medium">
                    ⏱ <strong>Strict 24 to 72 Hour Reporting Rule:</strong> All exchange, replacement, or transit damage claims must be initiated within <strong>24 to 72 hours</strong> of package delivery as recorded by courier tracking.
                  </p>
                </div>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Requests submitted after 72 hours from delivery timestamp cannot be entertained under any circumstances.</li>
                  <li>Initial communication must be sent to our WhatsApp Concierge or official support email with order details.</li>
                </ul>
              </section>

              <section aria-labelledby="unboxing-video">
                <h2 id="unboxing-video" className="font-display text-2xl font-medium text-foreground mb-4">3. Mandatory 360° Continuous Unboxing Video</h2>
                <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-4 text-rose-950 dark:text-rose-200 space-y-2">
                  <p className="text-sm font-bold flex items-center gap-2">
                    <span>📹 STRICT REQUIREMENT FOR DAMAGE / MISSING CLAIMS:</span>
                  </p>
                  <p className="text-xs leading-relaxed">
                    To prevent fraudulent claims and ensure courier accountability, a <strong>single, continuous, 360-degree unedited unboxing video</strong> is strictly mandatory.
                  </p>
                </div>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Start from Sealed Outer Package:</strong> The video must start showing all 4 sides and the intact shipping label BEFORE the outer poly-bag/box is cut open.</li>
                  <li><strong>Continuous & Uncut:</strong> The video must be continuous with no pauses, cuts, transitions, or edits.</li>
                  <li><strong>Clear Product Inspection:</strong> The camera must clearly capture the inner velvet box opening and close-up inspection of the jewellery item and any alleged defect.</li>
                  <li><strong>Absence of Video:</strong> Claims submitted without a qualifying continuous unboxing video will be automatically declined.</li>
                </ul>
              </section>

              <section aria-labelledby="non-returnable">
                <h2 id="non-returnable" className="font-display text-2xl font-medium text-foreground mb-4">4. Hygiene & Custom Exemptions (Strictly Non-Returnable)</h2>
                <p className="text-muted-foreground mb-4">
                  For customer safety and in accordance with international health & hygiene regulations, the following categories cannot be returned or exchanged:
                </p>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Earrings, Jhumkas & Chandbalis:</strong> All pierced ear jewellery is non-returnable once the security seal is opened.</li>
                  <li><strong>Nose Pins & Nose Rings:</strong> Pierced facial jewellery cannot be returned due to hygiene regulations.</li>
                  <li><strong>Custom-Sized & Made-to-Order Pieces:</strong> Customized bangle sizes, modified necklace lengths, and personalized bridal sets.</li>
                  <li><strong>Clearance & Final Sale:</strong> Promotional sale items marked as "Final Sale".</li>
                </ul>
              </section>

              <section aria-labelledby="refund-mechanism">
                <h2 id="refund-mechanism" className="font-display text-2xl font-medium text-foreground mb-4">5. Refund Mechanism: Store Credit & 1-to-1 Replacement Only</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  All approved return claims are processed strictly through:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose mb-6">
                  <div className="p-4 rounded-xl border border-amber-900/20 bg-background">
                    <h3 className="font-semibold text-amber-950 dark:text-amber-200 text-sm mb-1">Option A: 1-to-1 Replacement</h3>
                    <p className="text-xs text-muted-foreground">
                      Complimentary express dispatch of a fresh, brand-new identical piece once return is verified.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-amber-900/20 bg-background">
                    <h3 className="font-semibold text-amber-950 dark:text-amber-200 text-sm mb-1">Option B: Sheaura Store Credit</h3>
                    <p className="text-xs text-muted-foreground">
                      Digital Store Credit voucher valid for 12 months with no minimum spend limit.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  * Please note: We do not issue direct bank cash/UPI refunds. In the event of a verified return, you receive Store Credit or a Replacement.
                </p>
              </section>

              <section aria-labelledby="shipping-costs">
                <h2 id="shipping-costs" className="font-display text-2xl font-medium text-foreground mb-4">7. Return Shipping Costs</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Our Error (wrong/defective/damaged):</strong> We provide prepaid label. Full refund including original shipping.</li>
                  <li><strong>Change of Mind:</strong> Customer bears return shipping (₹299 standard, ₹599 express deducted from refund)</li>
                  <li><strong>Exchange:</strong> First exchange free (we cover both ways). Subsequent exchanges: customer pays.</li>
                  <li><strong>International:</strong> Customer bears all return shipping and customs. Refund minus these costs.</li>
                  <li><strong>Partial Returns:</strong> If remaining items qualify for free shipping, no deduction. Otherwise, standard shipping deducted.</li>
                </ul>
              </section>

              <section aria-labelledby="exchanges">
                <h2 id="exchanges" className="font-display text-2xl font-medium text-foreground mb-4">8. Exchanges</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Available For:</strong> Size, colour, or style variants of same product</li>
                  <li><strong>First Exchange Free:</strong> We cover shipping both ways</li>
                  <li><strong>Price Difference:</strong> Refunded or charged to original payment method</li>
                  <li><strong>Availability:</strong> Subject to stock. If unavailable, processed as return + new order</li>
                  <li><strong>Custom Items:</strong> Not exchangeable (size adjustments available pre-shipment)</li>
                </ul>
              </section>

              <section aria-labelledby="defective-items">
                <h2 id="defective-items" className="font-display text-2xl font-medium text-foreground mb-4">9. Defective or Incorrect Items</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Report Within:</strong> 48 hours of delivery with photos/videos</li>
                  <li><strong>Coverage:</strong> Manufacturing defects, wrong item shipped, transit damage</li>
                  <li><strong>Resolution Options:</strong> Full refund + return shipping OR replacement (priority dispatch)</li>
                  <li><strong>Assessment:</strong> May require return for inspection. We cover shipping.</li>
                  <li><strong>Timeframe:</strong> Replacement dispatched within 48 hours of approval</li>
                </ul>
              </section>

              <section aria-labelledby="jewellery-specific">
                <h2 id="jewellery-specific" className="font-display text-2xl font-medium text-foreground mb-4">10. Jewellery-Specific Guidelines</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Sizing:</strong> Free first resize within 30 days (if offered by design). Thereafter ₹500-2000</li>
                  <li><strong>Gemstones:</strong> Natural variations in color/inclusions are not defects</li>
                  <li><strong>Metal:</strong> Minor surface scratches from daily wear are normal. Polishing service available</li>
                  <li><strong>Certificates:</strong> Must be returned. Lost certificate = ₹2,000 re-issuance fee deducted</li>
                  <li><strong>Hallmark:</strong> BIS hallmark verified. Tampering voids return eligibility</li>
                </ul>
              </section>

              <section aria-labelledby="cosmetics-specific">
                <h2 id="cosmetics-specific" className="font-display text-2xl font-medium text-foreground mb-4">11. Cosmetics-Specific Guidelines</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Sealed Only:</strong> Only factory-sealed, unopened items returnable</li>
                  <li><strong>Shade Mismatch:</strong> Not eligible for return (use virtual try-on / samples)</li>
                  <li><strong>Allergic Reaction:</strong> Doctor's note required. Store credit only (no cash refund)</li>
                  <li><strong>Expiry:</strong> Minimum 24 months shelf life at delivery. Less = full refund</li>
                  <li><strong>Samples:</strong> Free samples with orders. Non-returnable.</li>
                </ul>
              </section>

              <section aria-labelledby="cancellations">
                <h2 id="cancellations" className="font-display text-2xl font-medium text-foreground mb-4">12. Order Cancellations</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Standard Orders (Before Dispatch):</strong> 100% full refund if cancelled prior to dispatch handover</li>
                  <li><strong>After Dispatch:</strong> Must be processed under the standard 7-day return procedure upon receipt</li>
                  <li><strong>Custom / Bridal Sets:</strong> Cancellation accepted within 24 hours of advance payment only</li>
                </ul>
              </section>

              <section aria-labelledby="dispute-resolution">
                <h2 id="dispute-resolution" className="font-display text-2xl font-medium text-foreground mb-4">13. Customer Support & Resolution</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li>Direct WhatsApp assistance at +91 9995098294 for rapid resolution within 24 hours</li>
                  <li>Email resolution via <a href="mailto:support@sheaura.com" className="underline hover:text-primary">support@sheaura.com</a></li>
                </ul>
              </section>

              <section aria-labelledby="contact">
                <h2 id="contact" className="font-display text-2xl font-medium text-foreground mb-4">15. Contact Us</h2>
                <p className="text-muted-foreground">
                  For return initiation, status queries, or refund issues:
                </p>
                <address className="not-italic text-muted-foreground mt-4 space-y-1">
                  <p><strong>{brandName} Returns</strong></p>
                  <p>Email: {contact.emailHref ? <a href={contact.emailHref} className="underline hover:text-primary">{contact.email}</a> : contact.email}</p>
                  <p>Phone: {contact.phoneHref ? <a href={contact.phoneHref} className="underline hover:text-primary">{contact.phone}</a> : contact.phone}</p>
                  <p>WhatsApp: {contact.whatsappHref ? <a href={contact.whatsappHref} className="underline hover:text-primary" target="_blank" rel="noopener noreferrer">{contact.whatsapp}</a> : contact.whatsapp}</p>
                  <p>Returns Address: {contact.address}</p>
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