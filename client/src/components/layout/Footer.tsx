import { Link } from 'react-router-dom'
import { Instagram, Phone, Mail, ArrowRight, Facebook, Twitter } from 'lucide-react'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { useContactInfo } from '@/hooks/useContactInfo'

const footerLinks = {
  shop: [
    { name: 'All Products', href: '/shop' },
    { name: 'Jewellery', href: '/shop?category=jewellery' },
    { name: 'Cosmetics', href: '/shop?category=cosmetics' },
    { name: 'Ornaments', href: '/shop?category=ornaments' },
    { name: 'Rental Collection', href: '/shop?mode=rental' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Rental Process', href: '/about#rental-process' },
    { name: 'Care Guide', href: '/about#care-guide' },
  ],
  support: [
    { name: 'FAQs', href: '/contact#faqs' },
    { name: 'Delivery & Pickup', href: '/contact#delivery' },
    { name: 'Deposit Policy', href: '/contact#deposit' },
    { name: 'Returns', href: '/contact#returns' },
  ],
}

export function Footer() {
  const { data: settings } = useSiteSettings()
  const contact = useContactInfo()

  const instagram = settings?.instagram || ''

  return (
    <footer className="bg-muted/50 border-t border-border" role="contentinfo">
      <div className="container-sheaura section-spacing">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="font-display text-2xl font-medium text-foreground mb-4 block">Sheaura</Link>
            <p className="text-sm text-muted-foreground mb-6">
              Timeless elegance for every occasion. Curated fashion & costume jewellery, premium cosmetics, and occasion ornaments.
            </p>
            <div className="flex space-x-4">
              {instagram && instagram !== '[INSTAGRAM URL]' && (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <nav aria-label="Shop links">
            <h3 className="font-medium text-foreground mb-4">Shop</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1"
                  >
                    {link.name}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company links">
            <h3 className="font-medium text-foreground mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1"
                  >
                    {link.name}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Support */}
          <nav aria-label="Support links">
            <h3 className="font-medium text-foreground mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1"
                  >
                    {link.name}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="font-medium text-foreground mb-4">Contact Us</h3>
            <address className="not-italic space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
                {contact.phoneHref ? (
                  <a href={contact.phoneHref} className="hover:text-primary transition-colors">{contact.phone}</a>
                ) : (
                  <span>{contact.phone}</span>
                )}
              </div>
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
                {contact.emailHref ? (
                  <a href={contact.emailHref} className="hover:text-primary transition-colors">{contact.email}</a>
                ) : (
                  <span>{contact.email}</span>
                )}
              </div>
              {contact.whatsappHref && (
                <a
                  href={contact.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 text-sm hover:text-primary transition-colors"
                >
                  <svg className="h-5 w-5 text-green-500 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378 9.86 9.86 0 01-.438-.053l-.476-.044-5.453 1.428 1.467-5.414-.046-.45a9.89 9.89 0 01-1.428-.514 10.07 10.07 0 01.138-1.971 9.86 9.86 0 013.022-3.995 9.875 9.875 0 015.271-.24c3.348.114 6.138 2.258 6.871 5.62.42 1.97-.472 3.975-1.886 5.385-2.874 2.873-7.094 3.153-9.691 1.46" />
                  </svg>
                  <span>WhatsApp</span>
                </a>
              )}
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Sheaura. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center space-x-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/rental-policy" className="hover:text-primary transition-colors">Rental Policy</Link>
              <Link to="/shipping-policy" className="hover:text-primary transition-colors">Shipping Policy</Link>
              <Link to="/payment-policy" className="hover:text-primary transition-colors">Payment Policy</Link>
              <Link to="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}