import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ShoppingBag, Search, ArrowRight, MessageCircle, ShieldCheck, Sparkles, MapPin, Phone } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useEnquiryList } from '@/hooks/useEnquiryBasket'
import { useSiteSettings } from '@/hooks/useSiteSettings'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Fashion Jewellery', href: '/shop' },
  { name: 'How to Order', href: '/#how-to-order' },
  { name: 'About Sheaura', href: '/about' },
  { name: 'Contact & WhatsApp', href: '/contact' },
  { name: 'Policies', href: '/shipping-policy' },
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
  const whatsappNum = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || '919995098294'

  // Lock body scroll when menu is open
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

  // Close menu on navigation or Esc key
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
        setIsSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-amber-900/10 shadow-xs transition-all duration-300">
      {/* Optional Announcement Banner */}
      {announcementEnabled && (
        <aside aria-label="Announcement" className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-white py-1.5 px-4 text-xs sm:text-sm text-center font-medium flex items-center justify-center gap-2">
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
              className="font-display text-xl sm:text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-300 uppercase"
            >
              {brandName}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-7">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-amber-700 dark:hover:text-amber-400',
                  isActive(item.href)
                    ? 'text-amber-800 dark:text-amber-300 font-semibold border-b-2 border-amber-600 pb-0.5'
                    : 'text-muted-foreground'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-xl text-muted-foreground hover:text-amber-900 hover:bg-amber-500/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Search jewellery catalogue"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Jewellery Order / Enquiry List Button */}
            <Link
              to="/enquiry"
              className="relative p-2 rounded-xl text-muted-foreground hover:text-amber-900 hover:bg-amber-500/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={`Jewellery Order List, ${itemCount} items`}
            >
              <ShoppingBag className="h-5 w-5 text-amber-900 dark:text-amber-300" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-amber-700 text-white text-[10px] sm:text-xs font-bold shadow-sm">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Three-Bar Menu Toggle Button (Visible on ALL devices) */}
            <button
              type="button"
              className={cn(
                "p-2.5 rounded-xl border border-amber-900/20 bg-amber-500/10 text-amber-950 dark:text-amber-200 hover:bg-amber-500/20 active:bg-amber-500/30 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-600 shrink-0 cursor-pointer",
                isMenuOpen && "bg-amber-700 text-white border-amber-700 shadow-md"
              )}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-expanded={isMenuOpen}
              aria-controls="main-menu-drawer"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 stroke-[2.2]" />
              ) : (
                <Menu className="h-6 w-6 stroke-[2.2]" />
              )}
            </button>
          </div>
        </div>

        {/* 3-Bar Full Menu Drawer (100% Solid Opaque on Mobile & Desktop) */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
            {/* Backdrop for closing */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
              onClick={() => setIsMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Solid Opaque Drawer Sheet */}
            <div
              id="main-menu-drawer"
              className={cn(
                "relative z-50 w-full sm:max-w-md bg-background border-l border-amber-900/20 shadow-2xl flex flex-col justify-between overflow-y-auto overscroll-contain animate-slide-in-right",
                announcementEnabled ? "top-[calc(4rem+2rem)] h-[calc(100dvh-6rem)]" : "top-16 h-[calc(100dvh-4rem)]"
              )}
              style={{
                backgroundColor: 'hsl(var(--background))',
                opacity: 1,
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Site Navigation Menu"
            >
              <div className="p-5 sm:p-6 space-y-5">
                {/* Header in Drawer */}
                <div className="flex items-center justify-between pb-3 border-b border-amber-900/10">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-700" />
                    <span className="font-display text-base font-bold text-amber-950 dark:text-amber-200">
                      Sheaura Menu
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-amber-500/10 cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Quick Search */}
                <div className="relative">
                  <Input
                    type="search"
                    placeholder="Search jewellery (e.g. SH-001, Choker)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        setIsMenuOpen(false)
                        navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
                      }
                    }}
                    className="w-full pl-10 pr-12 h-11 text-sm bg-amber-50/40 dark:bg-muted/30 border-amber-900/15 rounded-xl"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-amber-700 text-white text-xs font-semibold"
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
                          ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 font-semibold'
                          : 'text-foreground hover:bg-amber-500/10 active:bg-amber-500/20'
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>{item.name}</span>
                      <ArrowRight className="h-4 w-4 opacity-40" />
                    </Link>
                  ))}
                </div>

                <Separator className="bg-amber-900/10" />

                {/* Order List Card */}
                <Link
                  to="/enquiry"
                  className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-600/25 hover:bg-amber-500/15 active:bg-amber-500/20 transition-colors min-h-[54px]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-700 text-white shrink-0">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-display font-semibold text-amber-950 dark:text-amber-200 block text-sm">Order & Enquiry List</span>
                      <span className="text-xs text-muted-foreground">View selected jewellery codes</span>
                    </div>
                  </div>
                  {itemCount > 0 ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 text-white text-xs font-bold shadow-sm">
                      {itemCount}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">0 items</span>
                  )}
                </Link>

                {/* WhatsApp Direct Connect */}
                <a
                  href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent('Hello Sheaura, I am browsing your fashion jewellery collection and would like to place an order.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors min-h-[54px]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-display font-semibold text-foreground block text-sm">WhatsApp Concierge</span>
                      <span className="text-xs text-muted-foreground">+91 9995098294</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-emerald-700" />
                </a>

                {/* Policies & Assistance Links */}
                <div className="pt-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2 px-1">
                    Customer Care & Policies
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Link
                      to="/shipping-policy"
                      className="p-2 rounded-lg text-muted-foreground hover:text-amber-900 hover:bg-amber-500/10 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Shipping Policy
                    </Link>
                    <Link
                      to="/refund-policy"
                      className="p-2 rounded-lg text-muted-foreground hover:text-amber-900 hover:bg-amber-500/10 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Returns & Refunds
                    </Link>
                    <Link
                      to="/payment-policy"
                      className="p-2 rounded-lg text-muted-foreground hover:text-amber-900 hover:bg-amber-500/10 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Payment Methods
                    </Link>
                    <Link
                      to="/privacy"
                      className="p-2 rounded-lg text-muted-foreground hover:text-amber-900 hover:bg-amber-500/10 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Privacy Policy
                    </Link>
                  </div>
                </div>
              </div>

              {/* Bottom Drawer Footer */}
              <div className="p-5 border-t border-amber-900/10 bg-amber-50/30 dark:bg-muted/20 text-center space-y-1.5 mt-auto">
                <p className="text-xs font-bold text-amber-950 dark:text-amber-200">Sheaura Fashion Jewellery</p>
                <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-amber-700" /> Kerala, India</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-amber-700" /> +91 9995098294</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium pt-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Pan-India Velvet Box Dispatch</span>
                </div>
              </div>
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
              className="w-full max-w-md bg-background rounded-3xl shadow-2xl overflow-hidden animate-slide-down border border-amber-900/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 flex items-center gap-3 border-b border-border">
                <Search className="h-5 w-5 text-amber-700 shrink-0" />
                <Input
                  autoFocus
                  placeholder="Search jewellery by name or item code (e.g. SH-001)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      setIsSearchOpen(false)
                      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
                    }
                  }}
                  className="border-0 focus-visible:ring-0 text-sm sm:text-base h-10 px-0 shadow-none bg-transparent"
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 bg-amber-50/30 dark:bg-muted/20 text-xs text-muted-foreground">
                <p>Press Enter to view results, or search by code like &quot;SH-001&quot;, &quot;choker&quot;, or &quot;temple&quot;.</p>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}