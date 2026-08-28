import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ShieldCheck, KeyRound, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth, useAdminLogin, useLogout } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'
  const { user, isAuthenticated } = useAuth()
  const adminLogin = useAdminLogin()
  const logout = useLogout()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!password.trim()) {
      toast.error('Please enter the admin password')
      return
    }

    setIsPending(true)
    try {
      await adminLogin.mutateAsync({ password: password.trim() })
      toast.success('Admin authenticated successfully!')
      navigate(redirect.startsWith('/admin') ? redirect : '/admin')
    } catch (err: any) {
      toast.error(err?.message || 'Invalid admin password. Access denied.')
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

  if (isAuthenticated && user?.role === 'admin') {
    return (
      <div className="container-sheaura py-20 text-center max-w-md mx-auto">
        <Card className="card-sheaura p-8 border border-border shadow-lg">
          <CardHeader className="p-0 mb-6">
            <div className="w-16 h-16 bg-amber-500/15 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-display">Admin Authenticated</CardTitle>
            <CardDescription className="text-muted-foreground mt-2 text-xs">
              Logged in as <strong className="text-foreground">{user.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm"
              onClick={() => navigate('/admin')}
            >
              Enter Admin Dashboard
            </Button>
            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={handleLogout}
            >
              Log Out of Admin
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
            <span>Admin Portal</span>
          </Badge>
          <CardTitle className="text-2xl sm:text-3xl font-display font-medium">Sheaura Admin</CardTitle>
          <CardDescription className="text-muted-foreground text-xs sm:text-sm mt-2">
            Enter your secret admin password to access the management dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-xs font-semibold text-foreground">
                Admin Password *
              </Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter secret admin password..."
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
              <span>{isPending ? 'Verifying Password...' : 'Unlock Admin Dashboard'}</span>
            </Button>
          </form>

          <div className="mt-6 p-3.5 bg-muted/40 rounded-xl text-[11px] text-muted-foreground leading-relaxed space-y-1">
            <p className="font-semibold text-foreground">🔒 Protected Area</p>
            <p>
              Visitors do not need passwords to browse ornaments or enquire via WhatsApp.
              Admin sessions are encrypted, CSRF-protected, and brute-force rate-limited.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
