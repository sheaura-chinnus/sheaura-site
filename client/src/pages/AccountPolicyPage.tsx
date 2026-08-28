import { Link } from 'react-router-dom'
import { ShieldCheck, UserCheck, Truck, Lock, MessageCircle, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSiteSettings } from '@/hooks/useSiteSettings'

export function AccountPolicyPage() {
  const { data: settings } = useSiteSettings()
  const whatsappNum = (settings?.whatsapp || '919995098294').replace(/\D/g, '')

  return (
    <div className="container-sheaura py-12 lg:py-16 max-w-4xl mx-auto space-y-12 animate-fade-in">
      {/* Header Banner */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="px-3.5 py-1 text-xs uppercase tracking-widest text-amber-700 dark:text-amber-300 border-amber-600/30 bg-amber-500/10">
          Customer Protection & Security
        </Badge>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground">
          Account & Delivery Policy
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
          Learn how Sheaura protects your personal information, manages secure customer accounts, and delivers handcrafted luxury imitation jewellery directly to your doorstep.
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-sheaura border-amber-600/20 bg-gradient-to-b from-amber-500/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <UserCheck className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-display">Fast & Secure Signup</CardTitle>
          </CardHeader>
          <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            One-click Google Sign-In or direct email account creation. Manage past orders, save domestic shipping addresses, and track consignments seamlessly.
          </CardContent>
        </Card>

        <Card className="card-sheaura border-amber-600/20 bg-gradient-to-b from-amber-500/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <Truck className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-display">Insured Express Delivery</CardTitle>
          </CardHeader>
          <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            24–48 hours handling with 3–5 business days insured delivery across India. International shipments to GCC, US, UK, and Canada delivered within 5–9 days via DHL/EMS.
          </CardContent>
        </Card>

        <Card className="card-sheaura border-amber-600/20 bg-gradient-to-b from-amber-500/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <Lock className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-display">Encrypted Data & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            256-bit encrypted data storage. Your passwords, delivery addresses, and phone numbers are strictly private and never shared with third parties.
          </CardContent>
        </Card>
      </div>

      {/* Detailed Policy Sections */}
      <div className="space-y-8">
        {/* Section 1 */}
        <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <UserCheck className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-display font-semibold text-foreground">1. Account Creation & Eligibility</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed pl-0 sm:pl-10">
            <p>
              Creating a customer account on Sheaura is free and allows you to access order tracking, re-ordering, saved shipping addresses, and exclusive member discounts.
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>You must provide accurate, current, and complete contact details (Full Name, Phone/WhatsApp number, and Delivery Address).</li>
              <li>You are responsible for maintaining the confidentiality of your login credentials and password.</li>
              <li>You may sign in instantly using your Google account via secure OAuth authentication.</li>
            </ul>
          </div>
        </div>

        {/* Section 2 */}
        <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Truck className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-display font-semibold text-foreground">2. Ordering, Shipping & Delivery Process</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed pl-0 sm:pl-10">
            <p>
              Sheaura offers two seamless order workflows:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1.5">
                <span className="font-semibold text-foreground text-xs uppercase tracking-wider block">Option A: Instant WhatsApp Concierge</span>
                <p className="text-xs">Transmit your selected jewellery codes directly to our personal bridal stylist for custom sizing, real photos, and customized order checkout.</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1.5">
                <span className="font-semibold text-foreground text-xs uppercase tracking-wider block">Option B: Online Payment & Delivery</span>
                <p className="text-xs">Complete checkout online with domestic delivery details, instant 5%–10% prepaid UPI/Card discounts, or Cash-on-Delivery.</p>
              </div>
            </div>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>Domestic Delivery</strong>: Handled within 24–48 hours, delivered in 3–5 business days with real-time SMS/WhatsApp tracking links.</li>
              <li><strong>International Delivery</strong>: 5–9 business days for GCC, US, UK, and Canada with export documentation.</li>
              <li><strong>Cash-on-Delivery (COD)</strong>: Flat ₹50 convenience fee; orders require automated WhatsApp OTP verification before warehouse dispatch.</li>
            </ul>
          </div>
        </div>

        {/* Section 3 */}
        <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-display font-semibold text-foreground">3. Returns, Exchanges & Unboxing Video Rule</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed pl-0 sm:pl-10">
            <p>
              To maintain the highest hygiene standards and protect our customers:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>All return or transit-damage requests must be initiated within <strong>24 to 72 hours</strong> of package delivery.</li>
              <li>A single continuous, unedited <strong>360° unboxing video</strong> starting from the sealed outer shipping label is mandatory for claims.</li>
              <li>Earrings, nose pins/rings, and custom bridal pieces are non-returnable due to hygiene regulations.</li>
              <li>Approved returns are fulfilled via <strong>Store Credit or 1-to-1 Replacement</strong>.</li>
            </ul>
          </div>
        </div>

        {/* Section 4 */}
        <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-display font-semibold text-foreground">4. Micro-Gold Plating Warranty & Care</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed pl-0 sm:pl-10">
            <p>
              Every Sheaura 1-gram micro gold-plated ornament comes with our <strong>6-Month to 1-Year Plating Guarantee</strong> covering premature discoloration under normal wear conditions.
            </p>
            <p>
              For full care recommendations (avoiding perfume, water, and storing in airtight velvet boxes), visit our dedicated <Link to="/warranty-policy" className="text-amber-700 dark:text-amber-400 font-semibold underline underline-offset-4">Plating Warranty & Care Guide</Link>.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-600 via-primary to-amber-700 text-white text-center space-y-5 shadow-xl">
        <h3 className="font-display text-2xl sm:text-3xl font-semibold">Ready to create your Sheaura shopping account?</h3>
        <p className="text-amber-100/90 text-sm max-w-xl mx-auto">
          Sign in or register in seconds with Google or Email to unlock order tracking and instant checkout discounts.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Button asChild size="lg" className="bg-white text-amber-900 hover:bg-amber-50 font-semibold px-8 shadow-md">
            <Link to="/login">Sign In / Create Account</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-white/40 text-white hover:bg-white/10 gap-2"
          >
            <a
              href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent('Hello Sheaura Concierge, I have a question regarding my account or order delivery.')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp Support</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
