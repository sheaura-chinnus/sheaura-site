import { Link } from 'react-router-dom'
import { Instagram, Phone, Mail, MessageCircle } from 'lucide-react'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { useContactInfo } from '@/hooks/useContactInfo'

const footerLinks = {
  catalogue: [
    { name: 'Rental Ornaments', href: '/rental-ornaments' },
    { name: 'Bridal Ornaments', href: '/rental-ornaments?category=bridal' },
    { name: 'Occasion Accessories', href: '/rental-ornaments?category=occasion' },
    { name: 'Enquiry List', href: '/enquiry' },
  ],
  company: [
    { name: 'About Sheaura', href: '/about' },
    { name: 'How Rental Works', href: '/about#how-it-works' },
    { name: 'Care Guidelines', href: '/about#care-guide' },
    { name: 'Contact Us', href: '/contact' },
  ],
  policies: [
    { name: 'Rental Policy', href: '/rental-policy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Refund & Deposit Policy', href: '/refund-policy' },
  ],
}

export function Footer() {
  const { data: settings } = useSiteSettings()
  const contact = useContactInfo()

  const instagram = settings?.instagramUrl || settings?.instagram || ''

  return (
    <footer className="bg-muted/50 border-t border-border" role="contentinfo">
      <div className="container-sheaura section-spacing">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="font-display text-2xl font-medium text-foreground mb-3 block">
              {settings?.brandName || 'Sheaura'}
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 max-w-sm leading-relaxed">
              {settings?.footerText || 'Curated imitation, fashion, and occasion ornament rental catalogue. Browse exclusive pieces and enquire directly on WhatsApp with your chosen item codes.'}
            </p>
            <p className="text-[11px] text-muted-foreground/80 mb-5 italic">
              * Sheaura offers high quality imitation, fashion, and costume ornaments for occasion rental. We do not sell or rent real gold, fine diamonds, or precious gemstones.
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
            </div>
          </div>

          {/* Catalogue */}
          <nav aria-label="Catalogue links">
            <h3 className="font-medium text-sm text-foreground mb-3">Catalogue</h3>
            <ul className="space-y-2.5">
              {footerLinks.catalogue.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company links">
            <h3 className="font-medium text-sm text-foreground mb-3">About Sheaura</h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="font-medium text-sm text-foreground mb-3">Enquiries & WhatsApp</h3>
            <address className="not-italic space-y-2.5 text-xs sm:text-sm text-muted-foreground">
              {contact.whatsappHref && (
                <div>
                  <a
                    href={contact.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp Direct</span>
                  </a>
                </div>
              )}
              <div className="flex items-start space-x-2">
                <Phone className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                {contact.phoneHref ? (
                  <a href={contact.phoneHref} className="hover:text-primary transition-colors">{contact.phone}</a>
                ) : (
                  <span>{contact.phone}</span>
                )}
              </div>
              <div className="flex items-start space-x-2">
                <Mail className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                {contact.emailHref ? (
                  <a href={contact.emailHref} className="hover:text-primary transition-colors">{contact.email}</a>
                ) : (
                  <span>{contact.email}</span>
                )}
              </div>
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-border/80">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-muted-foreground">
            <p>
              {settings?.copyrightText || `© ${new Date().getFullYear()} ${settings?.brandName || 'Sheaura'}. Rental Ornaments Catalogue. All rights reserved.`}
            </p>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {footerLinks.policies.map((pol) => (
                <Link key={pol.name} to={pol.href} className="hover:text-primary transition-colors">
                  {pol.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}