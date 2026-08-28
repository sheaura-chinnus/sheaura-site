import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ShieldCheck, KeyRound, Lock, ArrowLeft, Eye, EyeOff, Truck, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth, useStaffLogin, useLogout } from '@/hooks/useAuth'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { toast } from 'react-hot-toast'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'
  const { user, isAuthenticated, isLoading } = useAuth()
  const staffLogin = useStaffLogin()
  const logout = useLogout()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'admin' | 'shop_order_receiver'>(
    searchParams.get('role') === 'enquiry' || searchParams.get('access') === 'enquiry' || searchParams.get('access') === 'delivery'
      ? 'shop_order_receiver'
      : 'admin'
  )

  // Secret access keys allowed for staff login portal
  const allowedKeys = ['admin', 'enquiry', 'delivery', 'sheaura', 'staff', 'owner']
  const accessKey = (
    searchParams.get('access') ||
    searchParams.get('key') ||
    searchParams.get('token') ||
    searchParams.get('role') ||
    searchParams.get('staff') ||
    ''
  ).toLowerCase().trim()

  const hasAuthorizedAccess = allowedKeys.includes(accessKey) || (isAuthenticated && (user?.role === 'admin' || user?.role === 'shop_order_receiver'))

  const handleStaffLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!password.trim()) {
      toast.error('Please enter the access password')
      return
    }

    setIsPending(true)
    try {
      await staffLogin.mutateAsync({
        password: password.trim(),
        role: selectedRole,
      })
      toast.success(`${selectedRole === 'admin' ? 'Administrator' : 'Delivery Enquiry'} authenticated!`)
      if (selectedRole === 'shop_order_receiver') {
        navigate('/admin/enquiries')
      } else {
        navigate(redirect.startsWith('/admin') ? redirect : '/admin')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Invalid password. Access denied.')
    } finally {
      setIsPending(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout.mutateAsync()
      toast.success('Logged out successfully')
    } catch {
      toast.error('Logout failed')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-amber-600 border-t-transparent" />
      </div>
    )
  }

  // If a public customer/visitor tries to reach /login without the staff secret key, show 404 Not Found
  if (!hasAuthorizedAccess) {
    return <NotFoundPage />
  }

  // If already authenticated as Admin or Delivery Enquiry
  if (isAuthenticated && (user?.role === 'admin' || user?.role === 'shop_order_receiver')) {
    const isAdmin = user.role === 'admin'
    return (
      <div className="container-sheaura py-20 text-center max-w-md mx-auto animate-fade-in">
        <Card className="card-sheaura p-8 border border-border shadow-lg">
          <CardHeader className="p-0 mb-6">
            <div className="w-16 h-16 bg-amber-500/15 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
              {isAdmin ? <ShieldCheck className="h-8 w-8" /> : <Truck className="h-8 w-8" />}
            </div>
            <CardTitle className="text-2xl font-display">
              {isAdmin ? 'Administrator Authenticated' : 'Delivery & Enquiry Portal'}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2 text-xs">
              Logged in as <strong className="text-foreground">{user.email}</strong> ({isAdmin ? 'Full Store Admin' : 'Order & Delivery Team'})
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm"
              onClick={() => navigate(isAdmin ? '/admin' : '/admin/enquiries')}
            >
              {isAdmin ? 'Enter Admin Dashboard' : 'Open Delivery Enquiries'}
            </Button>
            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={handleLogout}
            >
              Log Out
            </Button>
            <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => navigate('/')}>
              Return to Website
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container-sheaura py-16 lg:py-24 max-w-md mx-auto animate-fade-in">
      <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Sheaura Home
      </Link>

      <Card className="card-sheaura shadow-lg border border-border overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-amber-600 via-primary to-amber-600" />
        <CardHeader className="text-center pb-4 pt-8">
          <Badge variant="secondary" className="w-fit mx-auto mb-3 gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            <Lock className="h-3 w-3" />
            <span>Authorized Personnel Only</span>
          </Badge>
          <CardTitle className="text-2xl sm:text-3xl font-display font-medium">Sheaura Staff Portal</CardTitle>
          <CardDescription className="text-muted-foreground text-xs sm:text-sm mt-2">
            Secure login for Sheaura Administrators and Delivery / Order Enquiry managers.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {/* Role Tabs */}
          <Tabs
            value={selectedRole}
            onValueChange={(val) => setSelectedRole(val as 'admin' | 'shop_order_receiver')}
            className="w-full mb-6"
          >
            <TabsList className="grid w-full grid-cols-2 bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="admin" className="gap-1.5 text-xs sm:text-sm py-2">
                <ShieldCheck className="h-4 w-4" />
                <span>Administrator</span>
              </TabsTrigger>
              <TabsTrigger value="shop_order_receiver" className="gap-1.5 text-xs sm:text-sm py-2">
                <Truck className="h-4 w-4" />
                <span>Delivery & Orders</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleStaffLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-password" className="text-xs font-semibold text-foreground">
                {selectedRole === 'admin' ? 'Administrator Password *' : 'Delivery Enquiry Password *'}
              </Label>
              <div className="relative">
                <Input
                  id="staff-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter secret staff password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 h-11"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending || !password.trim()}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium gap-2 h-11 shadow-sm mt-2"
            >
              <KeyRound className="h-4 w-4" />
              <span>
                {isPending
                  ? 'Authenticating...'
                  : selectedRole === 'admin'
                  ? 'Unlock Admin Dashboard'
                  : 'Open Delivery Enquiries'}
              </span>
            </Button>
          </form>

          <div className="mt-6 p-3.5 bg-muted/40 rounded-xl text-[11px] text-muted-foreground leading-relaxed space-y-1">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
              <span>Strict Security & Obscurity Barrier</span>
            </p>
            <p>
              This portal is invisible to regular store clients. Public visitors browsing the site will encounter a standard 404 Not Found error.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
