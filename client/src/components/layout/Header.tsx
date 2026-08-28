import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ShoppingBag, Search, ArrowRight, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useEnquiryList } from '@/hooks/useEnquiryBasket'
import { useSiteSettings } from '@/hooks/useSiteSettings'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Rental Ornaments', href: '/rental-ornaments' },
  { name: 'How Rental Works', href: '/#rental-process' },
  { name: 'About Sheaura', href: '/about' },
  { name: 'Contact & WhatsApp', href: '/contact' },
  { name: 'Rental Policies', href: '/rental-policy' },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { itemCount } = useEnquiryList()
  const { data: settings } = useSiteSettings()

  const brandName = settings?.brandName || 'Sheaura'
  const logoUrl = settings?.siteLogoMediaId
    ? `/api/media/${settings.siteLogoMediaId}`
    : settings?.siteLogoUrl || null
  const logoAltText = settings?.siteLogoAltText || `${brandName} Logo`
  const announcementEnabled = settings?.announcementEnabled === 'true' && !!settings?.announcementText

  // Lock body scroll when mobile menu is open to ensure smooth scrolling inside menu
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  // Close mobile menu on page navigation
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    if (href.includes('#')) {
      const [path] = href.split('#')
      return location.pathname === path
    }
    return location.pathname.startsWith(href)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-xs transition-all duration-300">
      {/* Optional Announcement Banner */}
      {announcementEnabled && (
        <aside aria-label="Announcement" className="bg-primary text-primary-foreground py-1.5 px-4 text-xs sm:text-sm text-center font-medium flex items-center justify-center gap-2">
          <span>{settings.announcementText}</span>
          {settings.announcementCtaLabel && settings.announcementCtaLink && (
            <Link
              to={settings.announcementCtaLink}
              className="underline hover:opacity-80 font-semibold inline-flex items-center gap-0.5 ml-1"
            >
              {settings.announcementCtaLabel}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </aside>
      )}

      <nav className="container-sheaura" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand Name */}
          <Link to="/" className="flex items-center gap-2.5" aria-label={`${brandName} Home`}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={logoAltText}
                className="h-8 md:h-9 w-auto max-w-[130px] sm:max-w-[160px] object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const fallbackEl = document.getElementById('header-brand-name-fallback')
                  if (fallbackEl) fallbackEl.style.display = 'inline-block'
                }}
              />
            ) : null}
            <span
              id="header-brand-name-fallback"
              style={{ display: logoUrl ? 'none' : 'inline-block' }}
              className="font-display text-xl sm:text-2xl font-bold tracking-tight text-primary uppercase"
            >
              {brandName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-7">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  isActive(item.href)
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Search rental catalogue"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Rental Enquiry List Button */}
            <Link
              to="/enquiry"
              className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={`Rental Enquiry List, ${itemCount} items`}
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] sm:text-xs font-bold shadow-sm">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Three-Bar / Mobile Menu Toggle Button */}
            <button
              className={cn(
                "lg:hidden p-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-accent hover:text-primary transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-xs focus:outline-none focus:ring-2 focus:ring-primary shrink-0",
                isMenuOpen && "bg-primary text-primary-foreground border-primary"
              )}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 stroke-[2.2]" />
              ) : (
                <Menu className="h-6 w-6 stroke-[2.2]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Three-Bar Menu Full Drawer (100% Solid Opaque & Scrollable) */}
        {isMenuOpen && (
          <div
            id="mobile-menu"
            className={cn(
              "lg:hidden fixed inset-x-0 bottom-0 z-50 bg-background overflow-y-auto overscroll-contain border-t border-border shadow-2xl flex flex-col justify-between",
              announcementEnabled ? "top-[calc(4rem+2rem)]" : "top-16"
            )}
            style={{
              backgroundColor: 'hsl(var(--background))',
              opacity: 1,
              height: announcementEnabled ? 'calc(100dvh - 6rem)' : 'calc(100dvh - 4rem)',
            }}
          >
            <div className="container-sheaura py-5 space-y-4">
              {/* Quick Mobile Search */}
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search rental ornaments or codes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      setIsMenuOpen(false)
                      navigate(`/rental-ornaments?search=${encodeURIComponent(searchQuery.trim())}`)
                    }
                  }}
                  className="w-full pl-10 pr-12 h-11 text-sm bg-muted/40 rounded-xl"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      navigate(`/rental-ornaments?search=${encodeURIComponent(searchQuery.trim())}`)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium"
                  >
                    Go
                  </button>
                )}
              </div>

              {/* Primary Navigation Links */}
              <div className="flex flex-col space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 text-base font-medium rounded-xl transition-colors min-h-[48px]',
                      isActive(item.href)
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground hover:bg-accent active:bg-accent/80'
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>{item.name}</span>
                    <ArrowRight className="h-4 w-4 opacity-40" />
                  </Link>
                ))}
              </div>

              <Separator />

              {/* Rental Enquiry List Mobile Card */}
              <Link
                to="/enquiry"
                className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 active:bg-emerald-500/20 transition-colors min-h-[54px]"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-display font-medium text-foreground block text-sm">Rental Enquiry List</span>
                    <span className="text-xs text-muted-foreground">View selected item codes</span>
                  </div>
                </div>
                {itemCount > 0 ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold shadow-sm">
                    {itemCount}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">0 items</span>
                )}
              </Link>

              {/* WhatsApp Direct Connect in Menu */}
              {settings?.whatsappNumber && (
                <a
                  href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello Sheaura, I am browsing your rental ornaments catalogue and have an enquiry.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border hover:bg-muted/70 transition-colors min-h-[54px]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-display font-medium text-foreground block text-sm">Direct WhatsApp Enquiry</span>
                      <span className="text-xs text-muted-foreground">{settings.whatsappNumber}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </a>
              )}
            </div>

            {/* Bottom Drawer Footer */}
            <div className="p-6 border-t border-border/80 bg-muted/20 text-center space-y-1 mt-auto">
              <p className="text-xs font-medium text-foreground">Sheaura Rental Ornaments</p>
              <p className="text-[11px] text-muted-foreground">
                Exquisite Imitation & Occasion Jewellery on Rent
              </p>
            </div>
          </div>
        )}

        {/* Search Modal */}
        {isSearchOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 bg-black/50 backdrop-blur-sm animate-fade-in px-4"
            onClick={() => setIsSearchOpen(false)}
          >
            <div
              className="w-full max-w-md bg-background rounded-xl shadow-xl overflow-hidden animate-slide-down border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 flex items-center gap-2 border-b border-border">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <Input
                  autoFocus
                  placeholder="Search rental ornaments by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      setIsSearchOpen(false)
                      navigate(`/rental-ornaments?search=${encodeURIComponent(searchQuery.trim())}`)
                    }
                  }}
                  className="border-0 focus-visible:ring-0 text-sm sm:text-base h-10 px-0 shadow-none"
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 bg-muted/20 text-xs text-muted-foreground">
                <p>Press Enter to view results, or search by code like &quot;SH-001&quot; or category name.</p>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}