import React, { useState } from 'react'
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
  Sparkles,
  Smartphone,
  Mail
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
  useLogout,
  useSendOtp,
  useVerifyOtp
} from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import { COUNTRIES, CountryOption } from '@/components/auth/AuthModal'
import { WelcomeIncentive } from '@/components/onboarding/WelcomeIncentive'

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
  const sendOtpMutation = useSendOtp()
  const verifyOtpMutation = useVerifyOtp()
  const logout = useLogout()

  // Welcome Incentive Modal
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false)

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

  // Customer Primary Tab: 'otp' | 'email'
  const [loginMethod, setLoginMethod] = useState<'otp' | 'email'>('otp')

  // Mobile OTP States
  const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone')
  const [otpPhone, setOtpPhone] = useState('')
  const [otpFullName, setOtpFullName] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[0])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', ''])
  const [countdown, setCountdown] = useState(30)
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null)

  // Email Auth States
  const [emailAuthMode, setEmailAuthMode] = useState<'signin' | 'signup'>('signin')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPassword, setCustomerPassword] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Staff form state
  const [staffRole, setStaffRole] = useState<'admin' | 'shop_order_receiver'>('admin')
  const [staffPassword, setStaffPassword] = useState('')

  // Countdown timer for OTP
  React.useEffect(() => {
    let timer: NodeJS.Timeout
    if (otpStep === 'otp' && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [otpStep, countdown])

  // OTP Handlers
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanDigits = otpPhone.replace(/\D/g, '')
    if (cleanDigits.length < 8) {
      toast.error('Please enter a valid mobile phone number')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await sendOtpMutation.mutateAsync({
        phone: cleanDigits,
        countryCode: selectedCountry.dialCode,
      })
      if (res.demoOtp) setDemoCodeHint(res.demoOtp)
      setOtpStep('otp')
      setCountdown(30)
      toast.success('OTP sent to ' + res.phone)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOtpDigitChange = (idx: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1)
    const newDigits = [...otpDigits]
    newDigits[idx] = char
    setOtpDigits(newDigits)
    if (char && idx < 3) {
      const nextInput = document.getElementById('login-otp-' + (idx + 1))
      nextInput?.focus()
    }
    if (char && idx === 3) {
      const fullCode = [...newDigits.slice(0, 3), char].join('')
      if (fullCode.length === 4) handleVerifyOtp(fullCode)
    }
  }

  const handleVerifyOtp = async (codeOverride?: string) => {
    const code = codeOverride || otpDigits.join('')
    if (code.length !== 4) {
      toast.error('Please enter the complete 4-digit code')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await verifyOtpMutation.mutateAsync({
        phone: otpPhone,
        countryCode: selectedCountry.dialCode,
        code,
        fullName: otpFullName.trim() || undefined,
      })
      toast.success(res.isNewUser ? 'Welcome to Sheaura! 10% OFF coupon unlocked.' : 'Welcome back!')
      if (res.isFirstOrder) {
        setIsWelcomeModalOpen(true)
      } else {
        navigate(redirect.startsWith('/admin') ? '/account' : redirect)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Invalid or expired OTP')
      setOtpDigits(['', '', '', ''])
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Customer Sign In (Email)
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

  // Handle Customer Registration (Email)
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
      setIsWelcomeModalOpen(true)
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
      const mockEmail = prompt('Enter your Google Account Email for instant sign in:', customerEmail || 'customer@gmail.com')
      if (!mockEmail || !mockEmail.includes('@')) {
        setIsSubmitting(false)
        return
      }
      await googleLogin.mutateAsync({
        email: mockEmail.trim().toLowerCase(),
        name: mockEmail.split('@')[0].replace('.', ' '),
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=' + mockEmail,
        googleId: 'google_' + Date.now(),
      })
      toast.success('Signed in via Google successfully!')
      navigate(redirect.startsWith('/admin') ? '/account' : redirect)
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
      toast.success((staffRole === 'admin' ? 'Administrator' : 'Delivery Team') + ' authenticated!')
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
            <Button variant="outline" className="w-full" onClick={() => logout.mutate()}>
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Staff Authorization Portal Mode
  if (isStaffMode) {
    return (
      <div className="container-sheaura py-12 lg:py-20 max-w-md mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsStaffMode(false)}
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            <span>Switch to Customer Login</span>
          </button>
        </div>
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
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs h-10 shadow-sm cursor-pointer"
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
      {/* Welcome Incentive Modal */}
      <WelcomeIncentive
        isOpen={isWelcomeModalOpen}
        onClose={() => {
          setIsWelcomeModalOpen(false)
          navigate('/account')
        }}
      />

      <Link to="/" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
        <span>Back to Sheaura Home</span>
      </Link>

      <Card className="card-sheaura shadow-xl border border-border overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-amber-600 via-primary to-amber-700" />
        <CardHeader className="text-center pb-4 pt-8">
          <Badge variant="secondary" className="w-fit mx-auto mb-2.5 gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[11px]">
            <Sparkles className="h-3 w-3 text-amber-600" />
            <span>Frictionless Member Access</span>
          </Badge>
          <CardTitle className="text-2xl sm:text-3xl font-display font-medium">Customer Sign In</CardTitle>
          <CardDescription className="text-muted-foreground text-xs sm:text-sm mt-1.5">
            One-tap zero-password authentication. Unlock an extra 10% OFF on your first order.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Primary Login Method Switcher */}
          <Tabs value={loginMethod} onValueChange={(v) => setLoginMethod(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/60 p-1.5 rounded-2xl mb-4">
              <TabsTrigger value="otp" className="gap-1.5 text-xs py-2">
                <Smartphone className="h-3.5 w-3.5" />
                <span>One-Tap Mobile OTP</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-1.5 text-xs py-2">
                <Mail className="h-3.5 w-3.5" />
                <span>Email & Password</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: One-Tap Mobile OTP Auth */}
            <TabsContent value="otp" className="space-y-4">
              {otpStep === 'phone' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  {/* Incentive Badge */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-emerald-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2 shadow-xs">
                    <Sparkles className="h-4 w-4 text-amber-600 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Enter mobile number to unlock <strong>10% OFF</strong> on your first order!</span>
                  </div>

                  <div>
                    <Label className="block text-xs font-semibold mb-1">Full Name (Optional)</Label>
                    <Input
                      value={otpFullName}
                      onChange={(e) => setOtpFullName(e.target.value)}
                      placeholder="e.g. Aishwarya Lakshmi"
                      className="h-10 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="block text-xs font-semibold mb-1">Mobile Phone *</Label>
                    <div className="flex gap-2">
                      {/* Country Selector */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="flex items-center gap-1.5 h-10 px-3 bg-muted/30 border border-border rounded-xl text-xs font-medium"
                        >
                          <span>{selectedCountry.flag}</span>
                          <span className="font-mono">{selectedCountry.dialCode}</span>
                        </button>
                        {showCountryDropdown && (
                          <div className="absolute left-0 top-12 z-50 w-48 bg-card border border-border rounded-xl shadow-xl py-1 max-h-48 overflow-y-auto">
                            {COUNTRIES.map((c) => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(c)
                                  setShowCountryDropdown(false)
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-muted"
                              >
                                <span>{c.flag}</span>
                                <span className="flex-1">{c.name}</span>
                                <span className="font-mono text-muted-foreground">{c.dialCode}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <Input
                        type="tel"
                        value={otpPhone}
                        onChange={(e) => setOtpPhone(e.target.value)}
                        placeholder="98765 43210"
                        className="h-10 text-xs font-medium tracking-wide flex-1"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !otpPhone.trim()}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs h-10 shadow-sm cursor-pointer"
                  >
                    <span>{isSubmitting ? 'Sending OTP...' : 'Send 4-Digit OTP'}</span>
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <span className="text-xs font-semibold text-foreground">Enter 4-Digit Code</span>
                    <p className="text-[11px] text-muted-foreground">Sent to {selectedCountry.dialCode} {otpPhone}</p>
                  </div>

                  <div className="flex justify-center gap-3">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={'login-otp-' + idx}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        className="w-12 h-12 text-center font-mono text-xl font-bold rounded-xl bg-card border-2 border-border focus:border-amber-600 outline-none shadow-sm"
                      />
                    ))}
                  </div>

                  {demoCodeHint && (
                    <p className="text-center text-[11px] text-amber-700 dark:text-amber-400 font-mono">
                      💡 Demo OTP: <strong>{demoCodeHint}</strong>
                    </p>
                  )}

                  <Button
                    onClick={() => handleVerifyOtp()}
                    disabled={isSubmitting}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs h-10 shadow-sm cursor-pointer"
                  >
                    <span>{isSubmitting ? 'Verifying...' : 'Verify & Unlock 10% OFF'}</span>
                  </Button>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <button type="button" onClick={() => setOtpStep('phone')} className="hover:underline">
                      Change Phone
                    </button>
                    {countdown > 0 ? (
                      <span className="font-mono">Resend in {countdown}s</span>
                    ) : (
                      <button type="button" onClick={() => handleSendOtp()} className="font-semibold text-amber-700 hover:underline">
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab 2: Email & Password Auth */}
            <TabsContent value="email" className="space-y-4">
              <Tabs value={emailAuthMode} onValueChange={(v) => setEmailAuthMode(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/60 p-1 rounded-xl mb-4">
                  <TabsTrigger value="signin" className="text-xs py-1.5">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="text-xs py-1.5">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-3.5">
                  <form onSubmit={handleCustomerSignIn} className="space-y-3">
                    <div className="space-y-1">
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
                    <div className="space-y-1">
                      <Label htmlFor="signin-password" className="text-xs font-semibold">Password *</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter password..."
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
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs h-10 shadow-sm mt-1 cursor-pointer"
                    >
                      <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-3.5">
                  <form onSubmit={handleCustomerSignUp} className="space-y-3">
                    <div className="space-y-1">
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
                    <div className="space-y-1">
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
                    <div className="space-y-1">
                      <Label htmlFor="signup-phone" className="text-xs font-semibold">Phone / WhatsApp</Label>
                      <Input
                        id="signup-phone"
                        placeholder="+91 9995098294"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="h-10 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="signup-password" className="text-xs font-semibold">Password *</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Minimum 6 characters..."
                        value={customerPassword}
                        onChange={(e) => setCustomerPassword(e.target.value)}
                        required
                        className="h-10 text-xs"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !customerName || !customerEmail || !customerPassword}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs h-10 shadow-sm mt-1 cursor-pointer"
                    >
                      <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>

          {/* Google One-Click Button */}
          <div className="relative flex items-center justify-center pt-1">
            <div className="border-t border-border w-full" />
            <span className="bg-card px-3 text-[11px] uppercase tracking-wider text-muted-foreground shrink-0">
              Or continue with
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full h-10 border-border/80 hover:bg-accent hover:border-amber-600/30 flex items-center justify-center gap-2.5 font-medium text-xs shadow-xs transition-all cursor-pointer"
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
            <span>Google Sign-In</span>
          </Button>

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
              className="text-[11px] text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
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