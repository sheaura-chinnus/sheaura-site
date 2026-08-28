import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Package,
  Tag,
  Mail,
  Settings,
  Image as ImageIcon,
  Home,
  Compass,
  Shield,
  FileText,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  KeyRound,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAuth, useDemoLogin, useLogout } from '@/hooks/useAuth'

// Full navigation items for Administrators
const adminNavigation = [
  { name: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Site Settings', href: '/admin/settings', icon: Settings },
  { name: 'Logo & Media', href: '/admin/logo-media', icon: ImageIcon },
  { name: 'Homepage Content', href: '/admin/homepage', icon: Home },
  { name: 'Navigation & Footer', href: '/admin/navigation', icon: Compass },
  { name: 'Policies', href: '/admin/policies', icon: Shield },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: Tag },
  { name: 'Enquiries / Orders', href: '/admin/enquiries', icon: Mail },
  { name: 'Audit Log', href: '/admin/audit-logs', icon: FileText },
]

// Restricted navigation for Shop Order Receivers (Enquiries ONLY)
const receiverNavigation = [
  { name: 'Enquiries / Orders', href: '/admin/enquiries', icon: Mail },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { user, isAuthenticated } = useAuth()
  const demoLogin = useDemoLogin()
  const logout = useLogout()

  const handleLogout = async () => {
    await logout.mutateAsync()
    navigate('/')
  }

  const handleAdminLogin = async () => {
    await demoLogin.mutateAsync({ role: 'admin' })
  }

  const handleGoogleLogin = () => {
    window.location.href = '/auth/google'
  }

  const isAdmin = user?.role === 'admin'
  const isReceiver = user?.role === 'shop_order_receiver'

  // Decide navigation items based on role
  const navigation = isReceiver ? receiverNavigation : adminNavigation

  // If user is a shop order receiver, prevent access to admin-only routes
  const isAllowedPath = isReceiver
    ? location.pathname.startsWith('/admin/enquiries')
    : true

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Admin navigation"
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <Link to="/admin/dashboard" className="font-display text-xl font-medium text-foreground">
            Sheaura Admin
          </Link>
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role badge in sidebar */}
        <div className="px-6 py-2 border-b border-border/50 bg-muted/20">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            Role: <span className={isAdmin ? 'text-amber-600' : isReceiver ? 'text-blue-600' : 'text-foreground'}>{user?.role || 'Guest'}</span>
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Admin sections">
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== '/admin/dashboard' && location.pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
              <AvatarFallback className="text-xs">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name || 'Guest User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || 'Not signed in'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-0 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-xl border border-border/80 bg-background text-foreground hover:bg-accent shadow-xs transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              aria-expanded={sidebarOpen}
            >
              <Menu className="h-5 w-5 stroke-[2.2] text-foreground" />
            </button>
            <h1 className="font-display text-xl font-medium text-foreground hidden sm:block">
              {navigation.find(n => location.pathname === n.href || location.pathname.startsWith(n.href))?.name || 'Admin'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {!isAdmin && (
              <Button
                size="sm"
                onClick={handleAdminLogin}
                disabled={demoLogin.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs sm:text-sm font-medium"
              >
                <KeyRound className="h-4 w-4" />
                <span>{demoLogin.isPending ? 'Logging in...' : 'Sign in as Admin (1-Click)'}</span>
              </Button>
            )}

            <Link to="/" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              View Store
            </Link>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
                      <AvatarFallback>
                        {user?.name?.charAt(0).toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1">
                    <p className="text-sm font-medium text-foreground truncate">{user?.name || 'Admin User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" onClick={handleGoogleLogin} className="gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Sign in with Google</span>
              </Button>
            )}
          </div>
        </header>

        {/* Guest Warning Banner */}
        {!isAdmin && !isReceiver && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldAlert className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <span>You are viewing the admin panel as guest. Click to authenticate with Admin privileges to edit site content.</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" onClick={handleAdminLogin} disabled={demoLogin.isPending} className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                1-Click Admin Access
              </Button>
            </div>
          </div>
        )}

        {/* Page Content with Permission Barrier */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {!isAllowedPath ? (
            <div className="max-w-md mx-auto my-12 p-8 text-center bg-card border border-border rounded-xl space-y-4">
              <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="font-display text-xl font-medium text-foreground">Access Restricted</h2>
              <p className="text-sm text-muted-foreground">
                Your role (<strong>Shop Order Receiver</strong>) is authorized to manage assigned customer enquiries and orders only. Access to site settings, logo/media, products, and audit logs is restricted to Administrators.
              </p>
              <Button onClick={() => navigate('/admin/enquiries')}>
                Go to Enquiries
              </Button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}