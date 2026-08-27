import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ShoppingBag, Search, LogOut, UserPlus, Settings, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useEnquiryBasket } from '@/hooks/useEnquiryBasket'
import { useAuth, useLogout } from '@/hooks/useAuth'
import { useSiteSettings } from '@/hooks/useSiteSettings'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Shop', href: '/shop' },
  { name: 'Rental Ornaments', href: '/rental-ornaments' },
  { name: 'Fashion Jewellery', href: '/shop?category=jewellery' },
  { name: 'Cosmetics', href: '/shop?category=cosmetics' },
  { name: 'Occasion Ornaments', href: '/shop?category=ornaments' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { itemCount } = useEnquiryBasket()
  const { user, isLoading, isAuthenticated } = useAuth()
  const { data: settings } = useSiteSettings()
  const logout = useLogout()

  const brandName = settings?.brandName || 'Sheaura'
  const logoUrl = settings?.logoUrl || ''
  const logoAltText = settings?.logoAltText || `${brandName} Logo`
  const announcementEnabled = settings?.announcementEnabled === 'true' && Boolean(settings?.announcementText)

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    if (href === '/rental-ornaments') {
      return location.pathname === '/rental-ornaments' || location.search.includes('mode=rental')
    }
    if (href.includes('?')) {
      const [path, query] = href.split('?')
      return location.pathname === path && location.search.includes(query)
    }
    return location.pathname.startsWith(href)
  }

  const handleLogout = async () => {
    await logout.mutateAsync()
    navigate('/')
  }

  const handleGoogleLogin = () => {
    const apiUrl = (import.meta as any).env?.VITE_API_URL || ''
    window.location.href = `${apiUrl}/auth/google`
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border transition-all duration-300">
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
                className="h-8 md:h-9 w-auto max-w-[150px] object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const fallbackEl = document.getElementById('header-brand-name-fallback')
                  if (fallbackEl) fallbackEl.style.display = 'inline-block'
                }}
              />
            ) : null}
            <span
              id="header-brand-name-fallback"
              className={cn(
                'font-display text-xl font-medium text-foreground tracking-tight',
                logoUrl ? 'hidden' : 'inline-block'
              )}
            >
              {brandName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-6 xl:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary whitespace-nowrap',
                  isActive(item.href) ? 'text-primary font-semibold' : 'text-foreground/80'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-lg text-foreground/60 hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Search products"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Enquiry Basket */}
            <Link
              to="/enquiry"
              className="relative p-2 rounded-lg text-foreground/60 hover:bg-accent hover:text-foreground transition-colors"
              aria-label={`Enquiry Basket (${itemCount} items)`}
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {user.role === 'admin' && (
                  <Link to="/admin">
                    <Button size="sm" variant="default" className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm">
                      <Settings className="h-3.5 w-3.5" />
                      <span>Admin Panel</span>
                    </Button>
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors" aria-label="Account menu">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                        <AvatarFallback>{user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                          {user.role === 'admin' && (
                            <span className="text-[10px] bg-amber-500/15 text-amber-600 font-semibold px-1.5 py-0.5 rounded uppercase">Admin</span>
                          )}
                        </div>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/enquiry" className="flex w-full items-center">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        My Enquiries
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex w-full items-center font-medium text-amber-600">
                          <Settings className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={handleGoogleLogin} className="gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Sign in</span>
              </Button>
            )}
          </div>

          {/* Three-Bar / Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg text-foreground hover:bg-accent transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Three-Bar Menu */}
        {isMenuOpen && (
          <div id="mobile-menu" className="lg:hidden py-4 border-t border-border animate-slide-down">
            <div className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'px-3 py-2.5 text-base font-medium rounded-lg transition-colors',
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-foreground hover:bg-accent'
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Separator className="my-2" />
              <div className="px-2">
                <Link
                  to="/enquiry"
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    <span>Enquiry Basket</span>
                  </span>
                  {itemCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </div>
              <div className="px-2 pt-2 space-y-2">
                {isAuthenticated && user ? (
                  <>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-3 py-2 text-base font-medium rounded-lg text-amber-600 bg-amber-500/10 hover:bg-amber-500/20"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="h-5 w-5" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-base font-medium rounded-lg text-destructive hover:bg-destructive/10 text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      Log out
                    </button>
                  </>
                ) : (
                  <Button variant="outline" className="w-full justify-center gap-2" onClick={handleGoogleLogin}>
                    <UserPlus className="h-4 w-4" />
                    <span>Sign in with Google</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search Modal */}
        {isSearchOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsSearchOpen(false)}
          >
            <div
              className="w-full max-w-md mx-4 bg-background rounded-xl shadow-xl overflow-hidden animate-slide-down"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center space-x-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value
                      if (value.trim()) {
                        setIsSearchOpen(false)
                        navigate(`/shop?search=${encodeURIComponent(value.trim())}`)
                      }
                    }
                  }}
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground">Type a keyword and press Enter to search catalogue.</p>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}