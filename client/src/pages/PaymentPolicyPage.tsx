import { Link } from 'react-router-dom'
import { useContactInfo } from '@/hooks/useContactInfo'

export function PaymentPolicyPage() {
  const contact = useContactInfo()
  const brandName = contact.brandName
  const lastUpdated = 'August 24, 2026'
  const effectiveDate = 'August 24, 2026'

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-muted/30" aria-labelledby="payment-hero">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto text-center">
            <h1 id="payment-hero" className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground mb-6">
              Payment Policy
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
                  This Payment Policy describes how {brandName} processes payments for jewellery purchases and custom orders.
                  It works alongside our <Link to="/terms" className="underline hover:text-primary">Terms of Service</Link>,
                  <Link to="/shipping-policy" className="underline hover:text-primary">Shipping Policy</Link>, and
                  <Link to="/refund-policy" className="underline hover:text-primary">Refund Policy</Link>.
                </p>
                <p>
                  All payments are processed through secure, PCI-DSS compliant payment gateways and UPI rails. We never store
                  card details or credentials on our servers.
                </p>
              </section>

              <section aria-labelledby="accepted-methods">
                <h2 id="accepted-methods" className="font-display text-2xl font-medium text-foreground mb-4">2. Accepted Payment Methods</h2>

                <h3 className="font-medium text-lg text-foreground mb-2 mt-6">2.1 Online Payments (Instant)</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                  <li><strong>Credit/Debit Cards:</strong> Visa, Mastercard, RuPay, American Express, Diners Club</li>
                  <li><strong>UPI:</strong> All UPI apps (Google Pay, PhonePe, Paytm, BHIM, etc.)</li>
                  <li><strong>Net Banking:</strong> 50+ Indian banks supported</li>
                  <li><strong>Wallets:</strong> Paytm, Amazon Pay, PhonePe, MobiKwik</li>
                  <li><strong>EMI:</strong> Available on select credit cards for eligible orders</li>
                </ul>

                <h3 className="font-medium text-lg text-foreground mb-2 mt-6">2.2 Offline Payments & Bank Transfer</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                  <li><strong>Bank Transfer (NEFT/RTGS/IMPS):</strong> Account details provided by our concierge</li>
                  <li><strong>Direct UPI Transfer:</strong> Verified Sheaura Business UPI handle</li>
                </ul>
              </section>

              <section aria-labelledby="payment-flow">
                <h2 id="payment-flow" className="font-display text-2xl font-medium text-foreground mb-4">3. Payment Flow</h2>

                <h3 className="font-medium text-lg text-foreground mb-2 mt-6">3.1 Order Confirmation</h3>
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-4">
                  <li>Select jewellery items and submit enquiry on WhatsApp or website</li>
                  <li>Our styling concierge confirms availability, pricing, and dispatch slot</li>
                  <li>Receive secure UPI / Gateway payment link via WhatsApp</li>
                  <li>Payment confirmed → Order processed → Velvet box dispatch scheduled</li>
                </ol>

                <h3 className="font-medium text-lg text-foreground mb-2 mt-6">3.2 Custom Orders & Bridal Sets</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                  <li>Custom made-to-order sets require a 50% advance upon confirmation</li>
                  <li>Remaining balance is cleared before dispatch with live video preview verification</li>
                </ul>
              </section>

              <section aria-labelledby="security">
                <h2 id="security" className="font-display text-2xl font-medium text-foreground mb-4">4. Payment Security</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>PCI-DSS Compliance:</strong> All payments via certified Level 1 partners (Razorpay, Stripe)</li>
                  <li><strong>Tokenization:</strong> Card details tokenized. We store only last 4 digits + expiry</li>
                  <li><strong>Encryption:</strong> TLS 1.3 for all payment pages. End-to-end encryption</li>
                  <li><strong>3D Secure:</strong> 2FA (OTP) mandatory for all card transactions</li>
                  <li><strong>Fraud Prevention:</strong> AVS, velocity checks, risk scoring on every transaction</li>
                  <li><strong>No Storage:</strong> Full PAN, CVV, PIN never touch our servers or logs</li>
                </ul>
              </section>

              <section aria-labelledby="taxes">
                <h2 id="taxes" className="font-display text-2xl font-medium text-foreground mb-4">5. Taxes & Fees</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>GST:</strong> Included in displayed prices (18% for jewellery, 28% for cosmetics, etc.)</li>
                  <li><strong>TCS (Tax Collected at Source):</strong> 1% on jewellery &gt;₹5 lakh (auto-deducted, claimable in ITR)</li>
                  <li><strong>Payment Gateway Fees:</strong> Absorbed by us for standard methods. Passed on for:</li>
                  <ul className="list-circle list-inside space-y-1 ml-4 text-muted-foreground">
                    <li>International cards: +2.5%</li>
                    <li>Amex/Diners: +1.5%</li>
                    <li>PayPal: +3.5%</li>
                    <li>COD: ₹99 handling</li>
                  </ul>
                  <li><strong>Bank Transfer Fees:</strong> Buyer bears all sender/intermediary bank charges</li>
                </ul>
              </section>

              <section aria-labelledby="failed-payments">
                <h2 id="failed-payments" className="font-display text-2xl font-medium text-foreground mb-4">6. Failed & Declined Payments</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Retry:</strong> Auto-retry once after 15 minutes for transient failures</li>
                  <li><strong>New Link:</strong> Request fresh payment link (valid 24 hours)</li>
                  <li><strong>Order Hold:</strong> Order held for 48 hours after failure. Then cancelled</li>
                  <li><strong>Common Reasons:</strong> Insufficient funds, card expired, 3D Secure failure, bank decline</li>
                  <li><strong>Contact Bank:</strong> For "Do Not Honor" or "Transaction Not Permitted" — contact your bank</li>
                </ul>
              </section>

              <section aria-labelledby="refunds-payments">
                <h2 id="refunds-payments" className="font-display text-2xl font-medium text-foreground mb-4">7. Refunds to Payment Method</h2>
                <p className="text-muted-foreground mb-4">
                  Refunds processed per our <Link to="/refund-policy" className="underline hover:text-primary">Refund Policy</Link>.
                  Timelines by method:
                </p>
                <table className="w-full text-sm text-muted-foreground mb-6">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-foreground">Method</th>
                      <th className="text-left py-2 px-3 font-medium text-foreground">Refund Timeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="py-2 px-3">Credit/Debit Card</td><td className="py-2 px-3">5-10 business days (bank dependent)</td></tr>
                    <tr><td className="py-2 px-3">UPI</td><td className="py-2 px-3">24-48 hours</td></tr>
                    <tr><td className="py-2 px-3">Net Banking</td><td className="py-2 px-3">3-5 business days</td></tr>
                    <tr><td className="py-2 px-3">Wallet</td><td className="py-2 px-3">24-48 hours</td></tr>
                    <tr><td className="py-2 px-3">Bank Transfer</td><td className="py-2 px-3">3-5 business days (requires your bank details)</td></tr>
                    <tr><td className="py-2 px-3">COD</td><td className="py-2 px-3">Bank transfer (provide account details)</td></tr>
                  </tbody>
                </table>
              </section>

              <section aria-labelledby="disputes">
                <h2 id="disputes" className="font-display text-2xl font-medium text-foreground mb-4">8. Payment Disputes & Chargebacks</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li>Contact us first at <a href="mailto:payments@sheaura.com" className="underline hover:text-primary">payments@sheaura.com</a> — we resolve most issues directly</li>
                  <li>Chargebacks filed without contacting us may result in account restriction</li>
                  <li>Valid disputes: duplicate charge, wrong amount, service not delivered</li>
                  <li>We provide transaction proof to payment partners for investigation</li>
                  <li>Fraudulent chargebacks reported to authorities and credit bureaus</li>
                </ul>
              </section>

              <section aria-labelledby="receipts">
                <h2 id="receipts" className="font-display text-2xl font-medium text-foreground mb-4">9. Receipts & Invoices</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Payment Receipt:</strong> Digital receipt provided on successful payment</li>
                  <li><strong>GST Invoice:</strong> Dispatched with order package and shared on WhatsApp/email</li>
                  <li><strong>Corporate & Bulk:</strong> Custom invoice formats available on request</li>
                </ul>
              </section>

              <section aria-labelledby="wallets">
                <h2 id="wallets" className="font-display text-2xl font-medium text-foreground mb-4">10. Store Credit & Gift Cards</h2>
                <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                  <li><strong>Store Credit:</strong> Issued for returns/exchanges. Valid 12 months. Non-transferable</li>
                  <li><strong>Gift Cards:</strong> Purchase online. Valid 12 months. Redeemable at checkout</li>
                  <li><strong>Loyalty Points:</strong> Earned on purchases. Redeemable for discounts (terms apply)</li>
                  <li><strong>Referral Credits:</strong> ₹500 for each successful referral. Valid 6 months</li>
                </ul>
              </section>

              <section aria-labelledby="contact">
                <h2 id="contact" className="font-display text-2xl font-medium text-foreground mb-4">11. Contact Us</h2>
                <p className="text-muted-foreground">
                  For payment queries, failed transactions, or billing issues:
                </p>
                <address className="not-italic text-muted-foreground mt-4 space-y-1">
                  <p><strong>{brandName} Payments</strong></p>
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