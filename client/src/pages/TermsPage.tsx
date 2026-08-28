import { Link } from 'react-router-dom'
import { useContactInfo } from '@/hooks/useContactInfo'

export function TermsPage() {
  const contact = useContactInfo()
  const brandName = contact.brandName
  const lastUpdated = 'August 24, 2026'
  const effectiveDate = 'August 24, 2026'

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-muted/30" aria-labelledby="terms-hero">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto text-center">
            <h1 id="terms-hero" className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground mb-6">
              Terms of Service
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
                  Welcome to {brandName}. These Terms of Service ("Terms") govern your access to and use of our website,
                  services, and any rental or purchase transactions. By accessing or using our services, you agree to be
                  bound by these Terms.
                </p>
                <p>
                  If you do not agree to these Terms, please do not use our services. We may update these Terms from time
                  to time. Changes are effective upon posting. Continued use constitutes acceptance.
                </p>
              </section>

              <section aria-labelledby="services">
                <h2 id="services" className="font-display text-2xl font-medium text-foreground mb-4">2. Services Offered</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Retail Sales:</strong> Purchase of jewellery, cosmetics, and ornaments</li>
                  <li><strong>Rental Services:</strong> Short-term rental of premium items for events and occasions</li>
                  <li><strong>Enquiry Service:</strong> Submit product enquiries for personalized quotes and consultation</li>
                  <li><strong>Custom Design:</strong> Bespoke jewellery design and manufacturing (separate agreement required)</li>
                </ul>
              </section>

              <section aria-labelledby="user-accounts">
                <h2 id="user-accounts" className="font-display text-2xl font-medium text-foreground mb-4">3. User Accounts</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li>Account creation optional for enquiries; required for order tracking and rental management</li>
                  <li>You are responsible for maintaining account confidentiality and all activity under your account</li>
                  <li>Provide accurate, current, and complete information. Update promptly if changes occur</li>
                  <li>We may suspend or terminate accounts for violations of these Terms</li>
                  <li>Notify us immediately of any unauthorized use at <a href="mailto:security@sheaura.com" className="underline hover:text-primary">security@sheaura.com</a></li>
                </ul>
              </section>

              <section aria-labelledby="enquiries-orders">
                <h2 id="enquiries-orders" className="font-display text-2xl font-medium text-foreground mb-4">4. Enquiries & Orders</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Enquiries:</strong> Submitting an enquiry is not a binding order. Our team will contact you with a formal quote.</li>
                  <li><strong>Quotes:</strong> Valid for 7 days unless otherwise stated. Subject to stock availability.</li>
                  <li><strong>Orders:</strong> Confirmed upon payment receipt. Order confirmation emailed with details.</li>
                  <li><strong>Custom Orders:</strong> Require 50% non-refundable advance. Balance due before dispatch.</li>
                  <li><strong>Pricing:</strong> Prices in INR, inclusive of GST. Subject to change without notice prior to order confirmation.</li>
                </ul>
              </section>

              <section aria-labelledby="payment">
                <h2 id="payment" className="font-display text-2xl font-medium text-foreground mb-4">5. Payment & Invoicing</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li>Accepted methods: UPI, Credit/Debit cards, Net Banking, Direct Bank Transfer</li>
                  <li>All payments processed via secure PCI-DSS compliant payment gateways</li>
                  <li>We do not store full card details or banking credentials on our servers</li>
                  <li>Prices are in INR, inclusive of applicable taxes</li>
                </ul>
              </section>

              <section aria-labelledby="shipping-delivery">
                <h2 id="shipping-delivery" className="font-display text-2xl font-medium text-foreground mb-4">6. Shipping & Delivery</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li>Delivery across India within 3-7 business days via express courier partners</li>
                  <li>All shipments are fully insured during transit and dispatched in protective velvet gift boxes</li>
                  <li>Live tracking ID is provided via WhatsApp/SMS upon courier dispatch</li>
                </ul>
              </section>

              <section aria-labelledby="returns-refunds">
                <h2 id="returns-refunds" className="font-display text-2xl font-medium text-foreground mb-4">7. Returns & Refunds</h2>
                <p className="text-muted-foreground mb-4">
                  Governed by our <Link to="/refund-policy" className="underline hover:text-primary">Refund & Return Policy</Link>.
                </p>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li>Returns accepted within 7 days of delivery for unused items in original velvet packaging</li>
                  <li>Transit defects must be reported within 48 hours with unboxing video proof</li>
                  <li>Custom bridal sets and personalized jewellery are non-returnable</li>
                  <li>Approved refunds processed to original payment method within 5-7 business days</li>
                </ul>
              </section>

              <section aria-labelledby="intellectual-property">
                <h2 id="intellectual-property" className="font-display text-2xl font-medium text-foreground mb-4">9. Intellectual Property</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li>All content, designs, images, trademarks, and code are property of {brandName} or licensed to us</li>
                  <li>No reproduction, distribution, or commercial use without written permission</li>
                  <li>Product designs and custom creations remain our intellectual property</li>
                  <li>User-submitted content (reviews, photos): You grant us royalty-free license to use for marketing</li>
                </ul>
              </section>

              <section aria-labelledby="disclaimers">
                <h2 id="disclaimers" className="font-display text-2xl font-medium text-foreground mb-4">10. Disclaimers</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li>Services provided "as is" and "as available" without warranties of any kind</li>
                  <li>Product images are representative. Natural variations in gemstones, metals, and handcrafted items are expected</li>
                  <li>Colors may vary due to screen calibration. Request physical samples for critical matching</li>
                  <li>We do not guarantee uninterrupted or error-free service</li>
                  <li>Third-party links provided for convenience. We are not responsible for their content</li>
                </ul>
              </section>

              <section aria-labelledby="limitation-liability">
                <h2 id="limitation-liability" className="font-display text-2xl font-medium text-foreground mb-4">11. Limitation of Liability</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li>To the maximum extent permitted by law, {brandName} shall not be liable for indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Total liability limited to the amount paid by you in the 12 months preceding the claim</li>
                  <li>Not liable for force majeure events: natural disasters, government actions, pandemics, etc.</li>
                </ul>
              </section>

              <section aria-labelledby="indemnification">
                <h2 id="indemnification" className="font-display text-2xl font-medium text-foreground mb-4">12. Indemnification</h2>
                <p className="text-muted-foreground">
                  You agree to indemnify and hold {brandName} harmless from any claims, damages, losses, or expenses
                  (including legal fees) arising from your use of our services, violation of these Terms, or infringement
                  of any third-party rights.
                </p>
              </section>

              <section aria-labelledby="governing-law">
                <h2 id="governing-law" className="font-display text-2xl font-medium text-foreground mb-4">13. Governing Law & Dispute Resolution</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li>Governed by laws of India. Jurisdiction: Courts of Mumbai, Maharashtra</li>
                  <li>Disputes: First attempt good-faith negotiation. Then mediation per Arbitration and Conciliation Act, 1996</li>
                  <li>Consumer disputes: Subject to Consumer Protection Act, 2019</li>
                </ul>
              </section>

              <section aria-labelledby="termination">
                <h2 id="termination" className="font-display text-2xl font-medium text-foreground mb-4">14. Termination</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li>We may suspend or terminate access for violations, fraud, or legal compliance</li>
                  <li>You may terminate by closing your account (email us)</li>
                  <li>Surviving provisions: IP, liability, indemnification, governing law</li>
                </ul>
              </section>

              <section aria-labelledby="general">
                <h2 id="general" className="font-display text-2xl font-medium text-foreground mb-4">15. General</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Entire Agreement:</strong> These Terms, plus Privacy Policy, Rental Policy, Shipping Policy, Payment Policy, and Refund Policy constitute the entire agreement</li>
                  <li><strong>Severability:</strong> If any provision is unenforceable, the remainder remains in effect</li>
                  <li><strong>Waiver:</strong> Failure to enforce a right does not waive it</li>
                  <li><strong>Assignment:</strong> We may assign these Terms. You may not assign without our consent</li>
                  <li><strong>Contact:</strong> Questions? {contact.emailHref ? <a href={contact.emailHref} className="underline hover:text-primary">{contact.email}</a> : contact.email}</li>
                </ul>
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