import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ShieldCheck, KeyRound, Lock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth, useDemoLogin } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'
  const { user, isAuthenticated } = useAuth()
  const demoLogin = useDemoLogin()
  const [isPending, setIsPending] = useState(false)

  const handleAdminLogin = async () => {
    setIsPending(true)
    try {
      await demoLogin.mutateAsync({ role: 'admin' })
      toast.success('Authenticated successfully as Admin!')
      navigate(redirect.startsWith('/admin') ? redirect : '/admin')
    } catch (err: any) {
      toast.error(err?.message || 'Authentication failed. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  if (isAuthenticated && user?.role === 'admin') {
    return (
      <div className="container-sheaura py-20 text-center max-w-md mx-auto">
        <Card className="card-sheaura p-8 border border-border">
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
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium"
              onClick={() => navigate('/admin')}
            >
              Enter Admin Dashboard
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
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
            Secure sign-in for catalogue, media, and site content management.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          <div className="p-4 bg-muted/40 rounded-xl text-xs text-muted-foreground leading-relaxed">
            <p>
              Visitors do not need to sign in or create accounts to view rental ornaments or enquire via WhatsApp.
              This portal is restricted to authorized Sheaura managers.
            </p>
          </div>

          <Button
            disabled={isPending}
            onClick={handleAdminLogin}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium gap-2 h-11 shadow-sm"
          >
            <KeyRound className="h-4 w-4" />
            <span>{isPending ? 'Authenticating...' : 'Sign In to Admin Dashboard'}</span>
          </Button>

          <p className="text-[11px] text-center text-muted-foreground/80 mt-2">
            All administrative sessions are encrypted, CSRF-protected, and audit-logged.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
