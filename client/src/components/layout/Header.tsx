import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ShoppingBag, User, Search, LogOut, UserPlus, Settings } from 'lucide-react'
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

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Shop', href: '/shop' },
  { name: 'Jewellery', href: '/shop?category=jewellery' },
  { name: 'Cosmetics', href: '/shop?category=cosmetics' },
  { name: 'Ornaments', href: '/shop?category=ornaments' },
  { name: 'Rent', href: '/shop?mode=rental' },
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
  const logout = useLogout()

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
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

  if (isLoading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border transition-all duration-300">
        <nav className="container-sheaura" aria-label="Main navigation">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center space-x-2" aria-label="Sheaura Home">
              <span className="font-display text-xl font-medium text-foreground">Sheaura</span>
            </Link>
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          </div>
        </nav>
      </header>
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border transition-all duration-300">
      <nav className="container-sheaura" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" aria-label="Sheaura Home">
            <span className="font-display text-xl font-medium text-foreground">Sheaura</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  isActive(item.href) ? 'text-primary' : 'text-foreground/80'
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
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Enquiry Basket */}
            <Link to="/enquiry" className="relative p-2 rounded-lg text-foreground/60 hover:bg-accent hover:text-foreground transition-colors">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated && user ? (
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
                      <Link to="/account" onClick={() => setIsMenuOpen(false)} className="flex w-full items-center">
                        <User className="h-4 w-4 mr-2" />
                        My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/enquiry" onClick={() => setIsMenuOpen(false)} className="flex w-full items-center">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        My Enquiries
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="flex w-full items-center font-medium text-amber-600">
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
                <span>Sign in with Google</span>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-foreground hover:bg-accent transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div id="mobile-menu" className="md:hidden py-4 border-t border-border animate-slide-down">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'px-2 py-2 text-base font-medium rounded-lg transition-colors',
                    isActive(item.href) ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Separator className="my-2" />
              <div className="flex items-center space-x-4 px-2">
                <Link to="/enquiry" className="flex-1 flex items-center justify-center space-x-2">
                  <ShoppingBag className="h-5 w-5" />
                  <span>Enquiry Basket</span>
                  {itemCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </div>
              <div className="px-2 space-y-2">
                {isAuthenticated && user ? (
                  <>
                    <Link to="/account" className="flex items-center gap-2 px-2 py-2 text-base font-medium rounded-lg text-foreground hover:bg-accent" onClick={() => setIsMenuOpen(false)}>
                      <User className="h-5 w-5" />
                      My Account
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="flex items-center gap-2 px-2 py-2 text-base font-medium rounded-lg text-foreground hover:bg-accent" onClick={() => setIsMenuOpen(false)}>
                        <Settings className="h-5 w-5" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-2 py-2 text-base font-medium rounded-lg text-destructive hover:bg-destructive/10">
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
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setIsSearchOpen(false)}>
            <div className="w-full max-w-md mx-4 bg-background rounded-xl shadow-xl overflow-hidden animate-slide-down" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-border flex items-center space-x-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value
                      if (value.trim()) {
                        setIsSearchOpen(false)
                        window.location.href = `/shop?search=${encodeURIComponent(value.trim())}`
                      }
                    }
                  }}
                />
                <button onClick={() => setIsSearchOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Press Enter to search</p>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}