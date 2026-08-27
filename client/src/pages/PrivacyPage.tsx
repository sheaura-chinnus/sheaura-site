import { Link } from 'react-router-dom'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { cn } from '@/lib/utils'

export function PrivacyPage() {
  const { data: settings } = useSiteSettings()
  const brandName = settings?.brandName || 'Sheaura'
  const lastUpdated = 'August 24, 2026'
  const effectiveDate = 'August 24, 2026'

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-muted/30" aria-labelledby="privacy-hero">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto text-center">
            <h1 id="privacy-hero" className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground mb-6">
              Privacy Policy
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
                  Welcome to {brandName}. We respect your privacy and are committed to protecting your personal data.
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you
                  visit our website, use our services, or interact with us.
                </p>
                <p>
                  Please read this policy carefully. If you do not agree with our practices, please do not use our services.
                  By accessing or using our website and services, you acknowledge that you have read, understood,
                  and agree to be bound by this Privacy Policy.
                </p>
              </section>

              <section aria-labelledby="data-collected">
                <h2 id="data-collected" className="font-display text-2xl font-medium text-foreground mb-4">2. Information We Collect</h2>

                <h3 className="font-medium text-lg text-foreground mb-2 mt-6">2.1 Personal Information You Provide</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Name, email address, phone number</li>
                  <li>Shipping and billing addresses</li>
                  <li>Payment information (processed securely by our payment partners)</li>
                  <li>Enquiry and order details</li>
                  <li>Preferences and feedback</li>
                  <li>Account credentials (if you create an account)</li>
                </ul>

                <h3 className="font-medium text-lg text-foreground mb-2 mt-6">2.2 Information Collected Automatically</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>IP address, browser type, operating system</li>
                  <li>Pages visited, time spent, referral source</li>
                  <li>Device identifiers and cookies (see Cookie Policy)</li>
                  <li>Interaction data (clicks, scrolls, form submissions)</li>
                </ul>

                <h3 className="font-medium text-lg text-foreground mb-2 mt-6">2.3 Information from Third Parties</h3>
                <p className="text-muted-foreground">
                  We may receive information about you from payment processors, shipping carriers,
                  authentication providers (Manus OAuth), and analytics services.
                </p>
              </section>

              <section aria-labelledby="data-use">
                <h2 id="data-use" className="font-display text-2xl font-medium text-foreground mb-4">3. How We Use Your Information</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Order & Enquiry Fulfillment:</strong> Process orders, manage rentals, arrange delivery/pickup, communicate status</li>
                  <li><strong>Customer Support:</strong> Respond to enquiries, provide product assistance, handle returns</li>
                  <li><strong>Account Management:</strong> Create and maintain your account, authenticate access</li>
                  <li><strong>Personalization:</strong> Recommend products, tailor content, remember preferences</li>
                  <li><strong>Marketing (with consent):</strong> Send promotional emails, new collection alerts, exclusive offers</li>
                  <li><strong>Legal & Security:</strong> Comply with laws, prevent fraud, protect rights and safety</li>
                  <li><strong>Analytics & Improvement:</strong> Understand usage, improve website, develop new features</li>
                </ul>
              </section>

              <section aria-labelledby="data-sharing">
                <h2 id="data-sharing" className="font-display text-2xl font-medium text-foreground mb-4">4. Information Sharing & Disclosure</h2>
                <p className="text-muted-foreground mb-4">
                  We do not sell your personal information. We may share data only in these circumstances:
                </p>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Service Providers:</strong> Payment processors, shipping partners, hosting, analytics (under strict contracts)</li>
                  <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                  <li><strong>With Your Consent:</strong> For any other purpose disclosed at the time of collection</li>
                  <li><strong>Protection:</strong> To protect rights, property, or safety of {brandName}, users, or the public</li>
                </ul>
              </section>

              <section aria-labelledby="data-retention">
                <h2 id="data-retention" className="font-display text-2xl font-medium text-foreground mb-4">5. Data Retention</h2>
                <p className="text-muted-foreground mb-4">
                  We retain personal information only as long as necessary for the purposes outlined in this policy:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Account data: While your account is active, plus 2 years after closure</li>
                  <li>Order & transaction records: 7 years (legal/tax requirements)</li>
                  <li>Enquiry records: 3 years</li>
                  <li>Marketing data: Until you unsubscribe or 2 years of inactivity</li>
                  <li>Analytics data: Aggregated/anonymized data retained indefinitely</li>
                </ul>
              </section>

              <section aria-labelledby="your-rights">
                <h2 id="your-rights" className="font-display text-2xl font-medium text-foreground mb-4">6. Your Rights</h2>
                <p className="text-muted-foreground mb-4">
                  Depending on your jurisdiction, you may have the following rights:
                </p>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                  <li><strong>Erasure:</strong> Request deletion (subject to legal obligations)</li>
                  <li><strong>Restriction:</strong> Limit processing of your data</li>
                  <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                  <li><strong>Objection:</strong> Object to processing for marketing or legitimate interests</li>
                  <li><strong>Withdraw Consent:</strong> Withdraw consent at any time (where processing is based on consent)</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  To exercise these rights, contact us at <a href="mailto:privacy@sheaura.com" className="underline hover:text-primary">privacy@sheaura.com</a>.
                  We'll respond within 30 days (or as required by applicable law).
                </p>
              </section>

              <section aria-labelledby="cookies">
                <h2 id="cookies" className="font-display text-2xl font-medium text-foreground mb-4">7. Cookies & Tracking Technologies</h2>
                <p className="text-muted-foreground mb-4">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                  <li>Enable essential website functionality (authentication, basket)</li>
                  <li>Analyze website performance and usage (analytics cookies)</li>
                  <li>Personalize your experience (preference cookies)</li>
                  <li>Deliver relevant advertising (marketing cookies, with consent)</li>
                </ul>
                <p className="text-muted-foreground">
                  You can manage cookie preferences through your browser settings or our cookie banner.
                  Disabling essential cookies may break website functionality.
                </p>
              </section>

              <section aria-labelledby="security">
                <h2 id="security" className="font-display text-2xl font-medium text-foreground mb-4">8. Data Security</h2>
                <p className="text-muted-foreground mb-4">
                  We implement appropriate technical and organizational measures to protect your data:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>TLS encryption for all data in transit</li>
                  <li>Encrypted storage for sensitive data</li>
                  <li>Regular security assessments and monitoring</li>
                  <li>Access controls and employee training</li>
                  <li>Secure payment processing via PCI-DSS compliant partners</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  However, no internet transmission or electronic storage is 100% secure.
                  We cannot guarantee absolute security, but we're committed to protecting your data.
                </p>
              </section>

              <section aria-labelledby="children">
                <h2 id="children" className="font-display text-2xl font-medium text-foreground mb-4">9. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our services are not directed to children under 18. We do not knowingly collect
                  personal information from minors. If you believe we have collected data from a child,
                  please contact us and we'll delete it promptly.
                </p>
              </section>

              <section aria-labelledby="international">
                <h2 id="international" className="font-display text-2xl font-medium text-foreground mb-4">10. International Transfers</h2>
                <p className="text-muted-foreground">
                  Your data may be transferred to and processed in countries other than your own,
                  including India (where our servers are located). We ensure appropriate safeguards
                  (standard contractual clauses, adequacy decisions) for such transfers.
                </p>
              </section>

              <section aria-labelledby="changes">
                <h2 id="changes" className="font-display text-2xl font-medium text-foreground mb-4">11. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. The updated version will be
                  posted on this page with a revised "Last Updated" date. Material changes will be
                  communicated via email or prominent website notice. Continued use after changes
                  constitutes acceptance.
                </p>
              </section>

              <section aria-labelledby="contact">
                <h2 id="contact" className="font-display text-2xl font-medium text-foreground mb-4">12. Contact Us</h2>
                <p className="text-muted-foreground">
                  For questions about this Privacy Policy or our data practices, contact:
                </p>
                <address className="not-italic text-muted-foreground mt-4 space-y-1">
                  <p><strong>{brandName}</strong></p>
                  <p>Email: <a href="mailto:privacy@sheaura.com" className="underline hover:text-primary">privacy@sheaura.com</a></p>
                  <p>Phone: <a href="tel:+919876543210" className="underline hover:text-primary">+91 98765 43210</a></p>
                  <p>Address: {settings?.contactAddress || '123 Luxury Lane, Bandra West, Mumbai 400050, India'}</p>
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