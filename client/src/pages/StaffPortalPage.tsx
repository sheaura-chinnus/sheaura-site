import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  KeyRound,
  Lock,
  ArrowLeft,
  Truck,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth, useStaffLogin, useLogout } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

export function StaffPortalPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'
  const { user, isAuthenticated, isLoading } = useAuth()
  const staffLogin = useStaffLogin()
  const logout = useLogout()

  const [staffRole, setStaffRole] = useState<'admin' | 'shop_order_receiver'>('admin')
  const [staffPassword, setStaffPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffPassword.trim()) {
      toast.error('Please enter the security password')
      return
    }

    setIsSubmitting(true)
    try {
      await staffLogin.mutateAsync({
        password: staffPassword.trim(),
        role: staffRole,
      })
      toast.success(`${staffRole === 'admin' ? 'Administrator' : 'Delivery Team'} authenticated successfully!`)
      if (staffRole === 'shop_order_receiver') {
        navigate('/admin/enquiries')
      } else {
        navigate(redirect.startsWith('/admin') ? redirect : '/admin/dashboard')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Access Denied: Invalid security password')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D1917] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    )
  }

  // If already authenticated as staff
  if (isAuthenticated && user && (user.role === 'admin' || user.role === 'shop_order_receiver')) {
    const isAdmin = user.role === 'admin'
    return (
      <div className="min-h-screen bg-[#0D1917] text-white flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#162723] border border-amber-500/30 text-white shadow-2xl p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-400 border border-amber-500/30">
            {isAdmin ? <ShieldCheck className="h-8 w-8" /> : <Truck className="h-8 w-8" />}
          </div>
          <div className="space-y-1.5">
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">
              Active Staff Session
            </Badge>
            <h2 className="text-2xl font-display font-medium text-amber-100">
              {isAdmin ? 'Administrator Portal' : 'Delivery Management Portal'}
            </h2>
            <p className="text-xs text-white/60">
              Authenticated as <strong className="text-amber-300 font-mono">{user.email}</strong>
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {isAdmin ? (
              <Button
                onClick={() => navigate('/admin/dashboard')}
                className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-700 hover:to-amber-700 text-black font-semibold h-11 text-xs cursor-pointer shadow-lg shadow-amber-900/40"
              >
                Enter Admin Dashboard
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/admin/enquiries')}
                className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-700 hover:to-amber-700 text-black font-semibold h-11 text-xs cursor-pointer shadow-lg shadow-amber-900/40"
              >
                Open Delivery Enquiries Queue
              </Button>
            )}
            <Button
              variant="outline"
              disabled={logout.isPending}
              onClick={async () => {
                try {
                  await logout.mutateAsync()
                  toast.success('Signed out from Staff Portal')
                } catch {
                  toast.error('Sign out failed')
                }
              }}
              className="w-full h-11 text-xs border-white/20 text-white hover:bg-white/10 cursor-pointer"
            >
              {logout.isPending ? 'Signing Out...' : 'Sign Out from Staff Portal'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D1917] text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between pb-6">
        <Link
          to="/"
          className="inline-flex items-center text-xs text-amber-400/80 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          <span>Back to Store</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="max-w-md mx-auto w-full my-auto animate-fade-in">
        <Card className="bg-[#142420] border border-amber-500/30 text-white shadow-xl overflow-hidden rounded-2xl">
          <div className="h-1 bg-amber-600" />

          <CardHeader className="text-center pb-4 pt-6 space-y-2">
            <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 mx-auto">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-display font-medium text-amber-100 tracking-tight">
                Staff Portal
              </CardTitle>
              <CardDescription className="text-white/60 text-xs">
                Store administration and order management.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-5">
            {/* Role Selection Tabs */}
            <Tabs value={staffRole} onValueChange={(v) => setStaffRole(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/40 p-1 rounded-xl border border-white/10">
                <TabsTrigger
                  value="admin"
                  className="gap-2 text-xs py-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white font-medium transition-all"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Administrator</span>
                </TabsTrigger>
                <TabsTrigger
                  value="shop_order_receiver"
                  className="gap-2 text-xs py-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white font-medium transition-all"
                >
                  <Truck className="h-4 w-4" />
                  <span>Delivery Team</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Role Info Pill */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                {staffRole === 'admin' ? (
                  <span>
                    <strong>Admin Privileges:</strong> Full control over product catalogue, pricing, media, settings, and policies.
                  </span>
                ) : (
                  <span>
                    <strong>Delivery Team Privileges:</strong> Access to customer order queues and dispatch fulfillment status.
                  </span>
                )}
              </div>
            </div>

            {/* Password Form */}
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="staff-portal-password" className="text-xs font-semibold text-white/80">
                  {staffRole === 'admin' ? 'Administrator Password *' : 'Staff Password *'}
                </Label>
                <div className="relative">
                  <Input
                    id="staff-portal-password"
                    type={showPassword ? 'text' : 'password'}
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="h-11 bg-black/40 border-white/20 focus:border-amber-500 text-white text-xs pr-10 rounded-xl font-mono"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !staffPassword.trim()}
                className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="h-4 w-4" />
                <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
              </Button>
            </form>

            {/* Security Notice */}
            <div className="pt-2 border-t border-white/10 flex items-start gap-2 text-[10px] text-white/50 leading-normal">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>
                Staff access is authenticated and operations are recorded in the audit log.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-white/40 pt-6">
        <span>© {new Date().getFullYear()} Sheaura Luxury Jewels • Staff Operations</span>
      </div>
    </div>
  )
}
