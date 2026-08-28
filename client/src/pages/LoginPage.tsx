import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  KeyRound,
  Lock,
  ArrowLeft,
  Eye,
  EyeOff,
  Truck,
  User,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useAuth,
  useCustomerLogin,
  useCustomerRegister,
  useGoogleLogin,
  useStaffLogin,
  useLogout
} from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/account'
  const { user, isAuthenticated, isLoading } = useAuth()

  // Mutations
  const customerLogin = useCustomerLogin()
  const customerRegister = useCustomerRegister()
  const googleLogin = useGoogleLogin()
  const staffLogin = useStaffLogin()
  const logout = useLogout()

  // Staff Portal mode state
  const allowedStaffKeys = ['admin', 'enquiry', 'delivery', 'sheaura', 'staff', 'owner']
  const paramAccessKey = (
    searchParams.get('access') ||
    searchParams.get('key') ||
    searchParams.get('token') ||
    searchParams.get('role') ||
    ''
  ).toLowerCase().trim()

  const [isStaffMode, setIsStaffMode] = useState(
    allowedStaffKeys.includes(paramAccessKey) || searchParams.get('portal') === 'staff'
  )

  // Customer forms state
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPassword, setCustomerPassword] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Staff form state
  const [staffRole, setStaffRole] = useState<'admin' | 'shop_order_receiver'>('admin')
  const [staffPassword, setStaffPassword] = useState('')

  // Handle Customer Sign In
  const handleCustomerSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerEmail.trim() || !customerPassword.trim()) {
      toast.error('Please enter both email and password')
      return
    }

    setIsSubmitting(true)
    try {
      await customerLogin.mutateAsync({
        email: customerEmail.trim(),
        password: customerPassword.trim(),
      })
      toast.success('Welcome back to Sheaura!')
      navigate(redirect.startsWith('/admin') ? '/account' : redirect)
    } catch (err: any) {
      toast.error(err?.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Customer Registration
  const handleCustomerSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim() || !customerEmail.trim() || !customerPassword.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    if (customerPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsSubmitting(true)
    try {
      await customerRegister.mutateAsync({
        name: customerName.trim(),
        email: customerEmail.trim(),
        phone: customerPhone.trim() || undefined,
        password: customerPassword.trim(),
      })
      toast.success('Account created successfully! Welcome to Sheaura.')
      navigate('/account')
    } catch (err: any) {
      toast.error(err?.message || 'Account creation failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true)
    try {
      // Simulate Google OAuth flow or prompt
      const mockEmail = prompt('Enter your Google Account Email for instant sign in:', customerEmail || 'customer@gmail.com')
      if (!mockEmail || !mockEmail.includes('@')) {
        setIsSubmitting(false)
        return
      }

      await googleLogin.mutateAsync({
        email: mockEmail.trim().toLowerCase(),
        name: mockEmail.split('@')[0].replace('.', ' '),
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${mockEmail}`,
        googleId: `google_${Date.now()}`,
      })
      toast.success('Signed in via Google successfully!')
      navigate('/account')
    } catch (err: any) {
      toast.error(err?.message || 'Google sign in failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Staff/Admin Login
  const handleStaffLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffPassword.trim()) {
      toast.error('Please enter the secret password')
      return
    }

    setIsSubmitting(true)
    try {
      await staffLogin.mutateAsync({
        password: staffPassword.trim(),
        role: staffRole,
      })
      toast.success(`${staffRole === 'admin' ? 'Administrator' : 'Delivery Team'} authenticated!`)
      if (staffRole === 'shop_order_receiver') {
        navigate('/admin/enquiries')
      } else {
        navigate(redirect.startsWith('/admin') ? redirect : '/admin')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Invalid password. Access denied.')
    } finally {
      setIsSubmitting(false)
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

  // Authenticated Screen
  if (isAuthenticated && user) {
    const isAdmin = user.role === 'admin'
    const isReceiver = user.role === 'shop_order_receiver'

    return (
      <div className="container-sheaura py-20 text-center max-w-md mx-auto animate-fade-in">
        <Card className="card-sheaura p-8 border border-border shadow-lg space-y-6">
          <div className="w-16 h-16 bg-amber-500/15 rounded-full flex items-center justify-center mx-auto text-amber-600">
            {isAdmin ? <ShieldCheck className="h-8 w-8" /> : isReceiver ? <Truck className="h-8 w-8" /> : <User className="h-8 w-8" />}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-display">
              {isAdmin ? 'Administrator Authenticated' : isReceiver ? 'Delivery Team Authenticated' : 'Welcome Back!'}
            </CardTitle>
            <CardDescription className="text-xs">
              Logged in as <strong className="text-foreground">{user.email}</strong>
            </CardDescription>
          </div>

          <div className="space-y-3 pt-2">
            {isAdmin ? (
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm" onClick={() => navigate('/admin')}>
                Enter Admin Dashboard
              </Button>
            ) : isReceiver ? (
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm" onClick={() => navigate('/admin/enquiries')}>
                Open Delivery Enquiries
              </Button>
            ) : (
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm" onClick={() => navigate('/account')}>
                Go to My Account & Orders
              </Button>
            )}
            <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 border-destructive/30 text-xs" onClick={handleLogout}>
              Sign Out
            </Button>
            <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => navigate('/')}>
              Return to Website
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Staff Portal Screen
  if (isStaffMode) {
    return (
      <div className="container-sheaura py-16 lg:py-24 max-w-md mx-auto animate-fade-in">
        <button
          type="button"
          onClick={() => setIsStaffMode(false)}
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          <span>Back to Customer Sign In</span>
        </button>

        <Card className="card-sheaura shadow-lg border border-border overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-amber-600 via-primary to-amber-700" />
          <CardHeader className="text-center pb-4 pt-8">
            <Badge variant="secondary" className="w-fit mx-auto mb-3 gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
              <Lock className="h-3 w-3" />
              <span>Staff Authorization Portal</span>
            </Badge>
            <CardTitle className="text-2xl font-display font-medium">Sheaura Staff Portal</CardTitle>
            <CardDescription className="text-muted-foreground text-xs mt-1.5">
              Secure authentication for Store Administrators and Delivery staff.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            <Tabs value={staffRole} onValueChange={(val) => setStaffRole(val as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/60 p-1 rounded-xl">
                <TabsTrigger value="admin" className="gap-1.5 text-xs py-2">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Administrator</span>
                </TabsTrigger>
                <TabsTrigger value="shop_order_receiver" className="gap-1.5 text-xs py-2">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Delivery Team</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleStaffLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="staff-pwd" className="text-xs font-semibold">
                  {staffRole === 'admin' ? 'Admin Password *' : 'Delivery Password *'}
                </Label>
                <Input
                  id="staff-pwd"
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="Enter secret staff password..."
                  className="h-10 text-xs"
                  autoFocus
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !staffPassword.trim()}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs h-10 shadow-sm"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                <span>{isSubmitting ? 'Authenticating...' : 'Unlock Staff Dashboard'}</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Customer Authentication Portal
  return (
    <div className="container-sheaura py-12 lg:py-20 max-w-lg mx-auto space-y-8 animate-fade-in">
      <Link to="/" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
        <span>Back to Sheaura Home</span>
      </Link>

      <Card className="card-sheaura shadow-xl border border-border overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-amber-600 via-primary to-amber-700" />
        <CardHeader className="text-center pb-4 pt-8">
          <Badge variant="secondary" className="w-fit mx-auto mb-2.5 gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[11px]">
            <Sparkles className="h-3 w-3" />
            <span>Sheaura Member Experience</span>
          </Badge>
          <CardTitle className="text-2xl sm:text-3xl font-display font-medium">Customer Account</CardTitle>
          <CardDescription className="text-muted-foreground text-xs sm:text-sm mt-1.5">
            Sign in or create your account to track jewellery orders and save delivery addresses.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Google One-Click Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full h-11 border-border/80 hover:bg-accent hover:border-amber-600/30 flex items-center justify-center gap-3 font-medium text-xs sm:text-sm shadow-xs transition-all"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full" />
            <span className="bg-card px-3 text-[11px] uppercase tracking-wider text-muted-foreground shrink-0">
              Or with email
            </span>
          </div>

          {/* Sign In vs Sign Up Tabs */}
          <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/60 p-1 rounded-xl mb-4">
              <TabsTrigger value="signin" className="text-xs py-2">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs py-2">Create Account</TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleCustomerSignIn} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email" className="text-xs font-semibold">Email Address *</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="name@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                    className="h-10 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password" className="text-xs font-semibold">Password *</Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password..."
                      value={customerPassword}
                      onChange={(e) => setCustomerPassword(e.target.value)}
                      required
                      className="h-10 text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !customerEmail || !customerPassword}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs h-10 shadow-sm mt-1"
                >
                  <span>{isSubmitting ? 'Signing in...' : 'Sign In to Account'}</span>
                </Button>
              </form>
            </TabsContent>

            {/* Create Account Tab */}
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleCustomerSignUp} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name" className="text-xs font-semibold">Full Name *</Label>
                  <Input
                    id="signup-name"
                    placeholder="e.g. Priya Nair"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="h-10 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-xs font-semibold">Email Address *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                    className="h-10 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-phone" className="text-xs font-semibold">Phone / WhatsApp Number</Label>
                  <Input
                    id="signup-phone"
                    placeholder="+91 9995098294"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-xs font-semibold">Create Password *</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters..."
                      value={customerPassword}
                      onChange={(e) => setCustomerPassword(e.target.value)}
                      required
                      className="h-10 text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !customerName || !customerEmail || !customerPassword}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs h-10 shadow-sm mt-1"
                >
                  <span>{isSubmitting ? 'Creating account...' : 'Create Sheaura Account'}</span>
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Embedded Account & Delivery Policy Box */}
          <div className="pt-2">
            <details className="group border border-border/80 rounded-xl px-4 bg-muted/20 text-xs">
              <summary className="font-semibold text-foreground py-3 cursor-pointer list-none flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <span>Account, Privacy & Delivery Policy</span>
                </div>
                <span className="text-[10px] text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="text-xs text-muted-foreground space-y-2 pb-3 leading-relaxed border-t border-border/60 pt-2.5">
                <p>
                  By signing in or creating an account, you agree to Sheaura's{' '}
                  <Link to="/terms" className="text-amber-700 dark:text-amber-400 underline underline-offset-2">Terms</Link>,{' '}
                  <Link to="/privacy" className="text-amber-700 dark:text-amber-400 underline underline-offset-2">Privacy Policy</Link>, and{' '}
                  <Link to="/account-policy" className="text-amber-700 dark:text-amber-400 underline underline-offset-2">Account & Delivery Policy</Link>.
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li><strong>Returns Window</strong>: 24–72 hours with mandatory 360° unboxing video.</li>
                  <li><strong>Plating Warranty</strong>: 6–12 months on 1-gram gold polish.</li>
                  <li><strong>Delivery</strong>: Express insured domestic 3–5 days, international 5–9 days.</li>
                </ul>
              </div>
            </details>
          </div>

          {/* Staff Access Switcher */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setIsStaffMode(true)}
              className="text-[11px] text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
            >
              <Lock className="h-3 w-3" />
              <span>Store Administrator or Staff Access</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
