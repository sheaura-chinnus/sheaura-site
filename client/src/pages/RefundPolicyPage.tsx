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
                <h2 id="introduction" className="font-display text-2xl font-medium text-foreground mb-4">1. Introduction</h2>
                <p>
                  This Refund & Return Policy applies to all purchases made through {brandName}.
                  For rental returns, see our <Link to="/rental-policy" className="underline hover:text-primary">Rental Policy</Link>.
                  This policy works alongside our <Link to="/terms" className="underline hover:text-primary">Terms of Service</Link> and
                  <Link to="/shipping-policy" className="underline hover:text-primary">Shipping Policy</Link>.
                </p>
              </section>

              <section aria-labelledby="return-window">
                <h2 id="return-window" className="font-display text-2xl font-medium text-foreground mb-4">2. Return Window</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Standard Returns:</strong> 14 calendar days from delivery date</li>
                  <li><strong>Extended Holiday Window:</strong> Purchases Nov 1 - Dec 31 returnable until Jan 15</li>
                  <li><strong>Gift Returns:</strong> 30 days from delivery (gift receipt required)</li>
                  <li><strong>Defective/Incorrect Items:</strong> 30 days from delivery (no questions asked)</li>
                </ul>
              </section>

              <section aria-labelledby="eligibility">
                <h2 id="eligibility" className="font-display text-2xl font-medium text-foreground mb-4">3. Eligibility Criteria</h2>
                <p className="text-muted-foreground mb-4">
                  Items must meet ALL of the following conditions:
                </p>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground mb-4">
                  <li><strong>Unworn/Unused:</strong> No signs of wear, scratches, makeup, perfume, or alterations</li>
                  <li><strong>Original Packaging:</strong> All boxes, pouches, certificates, tags, and accessories included</li>
                  <li><strong>Certificates Intact:</strong> Authenticity certificates, grading reports, warranty cards unmarked</li>
                  <li><strong>Hygiene Seals:</strong> Cosmetics must have original seals unbroken</li>
                  <li><strong>No Resizing/Engraving:</strong> Jewellery must not be resized, engraved, or modified</li>
                </ul>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-primary font-medium">⚠ Items failing inspection will be returned to you at your cost. No refund issued.</p>
                </div>
              </section>

              <section aria-labelledby="non-returnable">
                <h2 id="non-returnable" className="font-display text-2xl font-medium text-foreground mb-4">4. Non-Returnable Items</h2>
                <p className="text-muted-foreground mb-4">
                  The following cannot be returned or exchanged (except if defective/incorrect):
                </p>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Custom Designs:</strong> Made-to-order, personalized, or engraved pieces</li>
                  <li><strong>Cosmetics & Beauty:</strong> All opened/unsealed products (hygiene regulations)</li>
                  <li><strong>Sale/Clearance:</strong> Items marked "Final Sale," "Clearance," or &gt;50% off</li>
                  <li><strong>Gift Cards:</strong> Digital and physical gift cards, store credit</li>
                  <li><strong>Pierced Jewellery:</strong> Earrings, nose pins, body jewellery (hygiene)</li>
                  <li><strong>Altered Items:</strong> Resized, engraved, or modified by customer or third party</li>
                  <li><strong>Rental Items:</strong> Governed by separate <Link to="/rental-policy" className="underline hover:text-primary">Rental Policy</Link></li>
                </ul>
              </section>

              <section aria-labelledby="return-process">
                <h2 id="return-process" className="font-display text-2xl font-medium text-foreground mb-4">5. Return Process</h2>
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                  <li><strong>Initiate:</strong> Email <a href="mailto:returns@sheaura.com" className="underline hover:text-primary">returns@sheaura.com</a> with order number, item(s), and reason</li>
                  <li><strong>Authorization:</strong> Receive Return Authorization (RA) number and instructions within 24 hours</li>
                  <li><strong>Pack:</strong> Use original packaging. Include all certificates, accessories, and RA slip</li>
                  <li><strong>Ship:</strong> Use provided prepaid label (India) or ship to our address (customer-paid, reimbursed if our error)</li>
                  <li><strong>Inspection:</strong> 3-5 business days after we receive the return</li>
                  <li><strong>Outcome:</strong> Refund issued or item returned with explanation if rejected</li>
                </ol>
              </section>

              <section aria-labelledby="refund-method">
                <h2 id="refund-method" className="font-display text-2xl font-medium text-foreground mb-4">6. Refund Method & Timeline</h2>

                <h3 className="font-medium text-lg text-foreground mb-2 mt-6">6.1 Refund Destination</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                  <li>Original payment method (card, UPI, wallet, bank account)</li>
                  <li>Store credit (optional — 5% bonus added, valid 12 months)</li>
                  <li>COD orders: Bank transfer (provide cancelled cheque/account details)</li>
                  <li>Gift purchases: Refund to purchaser's original method (not recipient)</li>
                </ul>

                <h3 className="font-medium text-lg text-foreground mb-2 mt-6">6.2 Processing Timelines</h3>
                <table className="w-full text-sm text-muted-foreground mb-6">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-foreground">Method</th>
                      <th className="text-left py-2 px-3 font-medium text-foreground">Timeline After Approval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-2 px-3">UPI / Wallets</td><td className="py-2 px-3">24-48 hours</td></tr>
                    <tr><td className="py-2 px-3">Credit/Debit Card</td><td className="py-2 px-3">5-10 business days (bank dependent)</td></tr>
                    <tr><td className="py-2 px-3">Net Banking</td><td className="py-2 px-3">3-5 business days</td></tr>
                    <tr><td className="py-2 px-3">Bank Transfer</td><td className="py-2 px-3">3-5 business days</td></tr>
                    <tr><td className="py-2 px-3">Store Credit</td><td className="py-2 px-3">Instant</td></tr>
                  </tbody>
                </table>
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

              <section aria-labelledby="rental-deposits">
                <h2 id="rental-deposits" className="font-display text-2xl font-medium text-foreground mb-4">12. Rental Security Deposits</h2>
                <p className="text-muted-foreground mb-4">
                  See <Link to="/rental-policy" className="underline hover:text-primary">Rental Policy</Link> for full details. Summary:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Refunded within 7 business days of safe return and inspection</li>
                  <li>Deductions for: damage, loss, late return, missing packaging, cleaning</li>
                  <li>Disputes: Documented with timestamped photos at delivery and return</li>
                  <li>If deductions &gt; deposit: balance invoiced (payable within 7 days)</li>
                </ul>
              </section>

              <section aria-labelledby="cancellations">
                <h2 id="cancellations" className="font-display text-2xl font-medium text-foreground mb-4">13. Order Cancellations</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Before Dispatch:</strong> Full refund (cancel anytime before "Dispatched" status)</li>
                  <li><strong>After Dispatch:</strong> Treat as return. Refuse delivery or return per process above</li>
                  <li><strong>Custom Orders:</strong> Cancellable within 24 hours only. After: 50% fee (materials/labor)</li>
                  <li><strong>Rental Cancellations:</strong> Per <Link to="/rental-policy" className="underline hover:text-primary">Rental Policy</Link> (Section 8)</li>
                </ul>
              </section>

              <section aria-labelledby="dispute-resolution">
                <h2 id="dispute-resolution" className="font-display text-2xl font-medium text-foreground mb-4">14. Dispute Resolution</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li>Contact <a href="mailto:returns@sheaura.com" className="underline hover:text-primary">returns@sheaura.com</a> — we resolve 95% directly</li>
                  <li>Escalate to management: <a href="mailto:management@sheaura.com" className="underline hover:text-primary">management@sheaura.com</a></li>
                  <li>Consumer Forum: Available per Indian Consumer Protection Act, 2019</li>
                  <li>Jurisdiction: Mumbai courts (per Terms of Service)</li>
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