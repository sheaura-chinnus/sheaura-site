import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User,
  ShoppingBag,
  MapPin,
  Mail,
  ShieldCheck,
  LogOut,
  Truck,
  MessageCircle,
  ChevronRight,
  Edit2,
  Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth, useLogout, useUpdateCustomerProfile } from '@/hooks/useAuth'
import { trpc } from '@/lib/trpc'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'react-hot-toast'

export function AccountPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const logout = useLogout()
  const updateProfile = useUpdateCustomerProfile()

  const { data: myOrders, isLoading: ordersLoading, refetch: refetchOrders } = trpc.enquiries.getMyOrders.useQuery(
    undefined,
    { enabled: isAuthenticated }
  )

  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [addressForm, setAddressForm] = useState({
    name: user?.name || '',
    phone: (user as any)?.phone || '',
    deliveryAddress: (user as any)?.deliveryAddress || '',
    city: (user as any)?.city || '',
    state: (user as any)?.state || '',
    pincode: (user as any)?.pincode || '',
  })

  // Update address form if user data loads
  const handleEditOpen = () => {
    setAddressForm({
      name: user?.name || '',
      phone: (user as any)?.phone || '',
      deliveryAddress: (user as any)?.deliveryAddress || '',
      city: (user as any)?.city || '',
      state: (user as any)?.state || '',
      pincode: (user as any)?.pincode || '',
    })
    setIsEditingAddress(true)
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProfile.mutateAsync(addressForm)
      toast.success('Delivery profile updated successfully!')
      setIsEditingAddress(false)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile')
    }
  }

  const handleLogout = async () => {
    try {
      await logout.mutateAsync()
      toast.success('Logged out successfully')
      navigate('/')
    } catch {
      toast.error('Logout failed')
    }
  }

  if (authLoading) {
    return (
      <div className="container-sheaura py-24 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-amber-600 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container-sheaura py-20 text-center max-w-md mx-auto animate-fade-in">
        <Card className="card-sheaura p-8 border border-border shadow-lg space-y-6">
          <div className="w-16 h-16 bg-amber-500/15 rounded-full flex items-center justify-center mx-auto text-amber-600">
            <User className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-medium text-foreground">Sign In to Your Account</h2>
            <p className="text-xs text-muted-foreground">
              Sign in or create a customer account to view your past jewellery orders, live delivery tracking, and saved addresses.
            </p>
          </div>
          <div className="space-y-3">
            <Button asChild className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm">
              <Link to="/login">Sign In / Create Account</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/shop">Browse Jewellery Collection</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20">Order Received</Badge>
      case 'contacted':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/20">Confirmed / Processing</Badge>
      case 'reserved':
        return <Badge variant="secondary" className="bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/20">Packed & In Transit</Badge>
      case 'fulfilled':
        return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20">Delivered</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container-sheaura py-10 lg:py-16 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Top Profile Summary Bar */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-amber-600/30">
            <AvatarImage src={user?.image || undefined} alt={user?.name || 'Customer'} />
            <AvatarFallback className="bg-amber-500/15 text-amber-700 text-xl font-bold font-display">
              {user?.name?.charAt(0).toUpperCase() || 'S'}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
                {user?.name || 'Valued Shopper'}
              </h1>
              <Badge variant="outline" className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20">
                Member
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              <span>{user?.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {user?.role === 'admin' && (
            <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
              <Link to="/admin">Admin Dashboard</Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-destructive hover:bg-destructive/10 border-destructive/30 text-xs gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Tabs: My Orders vs Delivery Profile vs Policies */}
      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted/60 p-1 rounded-2xl max-w-md">
          <TabsTrigger value="orders" className="gap-2 text-xs sm:text-sm py-2">
            <ShoppingBag className="h-4 w-4" />
            <span>My Orders</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="gap-2 text-xs sm:text-sm py-2">
            <MapPin className="h-4 w-4" />
            <span>Delivery Info</span>
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-2 text-xs sm:text-sm py-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Policies</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: My Orders & Tracking */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-foreground">Order & Enquiry History</h2>
            <Button variant="ghost" size="sm" onClick={() => refetchOrders()} className="text-xs text-muted-foreground">
              Refresh Orders
            </Button>
          </div>

          {ordersLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-8 w-8 rounded-full border-4 border-amber-600 border-t-transparent mx-auto" />
            </div>
          ) : !myOrders || myOrders.length === 0 ? (
            <Card className="card-sheaura p-12 text-center space-y-4 border-dashed">
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-600">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-display font-medium text-foreground">No orders placed yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Explore our handcrafted 1-gram gold plated jewellery and bridal sets to place your first order.
                </p>
              </div>
              <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium">
                <Link to="/shop">Explore Jewellery Catalogue</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {myOrders.map((order: any) => {
                const totalAmount = order.items.reduce((sum: number, item: any) => {
                  return sum + (Number(item.unitPrice || 0) * (item.quantity || 1))
                }, 0)

                return (
                  <Card key={order.id} className="card-sheaura border border-border shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-4 sm:p-5 bg-muted/30 border-b border-border flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            Order #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground block">Total Amount</span>
                          <span className="text-sm font-bold text-foreground font-display">
                            {formatCurrency(totalAmount)}
                          </span>
                        </div>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                        >
                          <a
                            href={`https://wa.me/919995098294?text=${encodeURIComponent(`Hello Sheaura, I would like to track my order #${order.id.slice(0, 8).toUpperCase()}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>Track on WhatsApp</span>
                          </a>
                        </Button>
                      </div>
                    </div>

                    {/* Items List */}
                    <CardContent className="p-4 sm:p-5 space-y-3">
                      <div className="divide-y divide-border">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">
                                  Jewel
                                </div>
                              )}
                              <div className="space-y-0.5">
                                <Link
                                  to={`/product/${item.productSlug}`}
                                  className="text-xs sm:text-sm font-medium text-foreground hover:text-amber-700 transition-colors line-clamp-1"
                                >
                                  {item.productName}
                                </Link>
                                <span className="text-[11px] text-muted-foreground block">
                                  Code: {item.itemCode || 'SH-N/A'} • Qty: {item.quantity}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-foreground shrink-0 font-display">
                              {formatCurrency(Number(item.unitPrice || 0) * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Delivery Address & Notes if available */}
                      {(order.shippingAddress || order.deliveryPickup) && (
                        <div className="mt-3 pt-3 border-t border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-muted-foreground gap-2">
                          <span className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span>
                              {order.shippingAddress
                                ? `Delivering to: ${order.shippingAddress}, ${order.city || ''} ${order.pincode || ''}`
                                : `Method: Express Insured Courier`}
                            </span>
                          </span>
                          {order.paymentMethod && (
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {order.paymentMethod.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Saved Delivery Profile */}
        <TabsContent value="addresses" className="space-y-6">
          <Card className="card-sheaura border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="space-y-1">
                <CardTitle className="text-lg font-display">Saved Delivery Address</CardTitle>
                <CardDescription className="text-xs">
                  Your default shipping destination for domestic 3–5 day insured deliveries.
                </CardDescription>
              </div>
              {!isEditingAddress && (
                <Button size="sm" variant="outline" onClick={handleEditOpen} className="gap-1.5 text-xs">
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Details</span>
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-6">
              {isEditingAddress ? (
                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="cust-name" className="text-xs font-semibold">Full Name *</Label>
                      <Input
                        id="cust-name"
                        value={addressForm.name}
                        onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                        required
                        className="h-10 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cust-phone" className="text-xs font-semibold">Phone / WhatsApp *</Label>
                      <Input
                        id="cust-phone"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        placeholder="+91 9995098294"
                        className="h-10 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cust-address" className="text-xs font-semibold">Street Address / House No. *</Label>
                    <Input
                      id="cust-address"
                      value={addressForm.deliveryAddress}
                      onChange={(e) => setAddressForm({ ...addressForm, deliveryAddress: e.target.value })}
                      placeholder="Apartment, building, street, area..."
                      className="h-10 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="cust-city" className="text-xs font-semibold">City / District</Label>
                      <Input
                        id="cust-city"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="h-10 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cust-state" className="text-xs font-semibold">State</Label>
                      <Input
                        id="cust-state"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        className="h-10 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cust-pincode" className="text-xs font-semibold">PIN Code</Label>
                      <Input
                        id="cust-pincode"
                        value={addressForm.pincode}
                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                        placeholder="682001"
                        className="h-10 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button type="submit" disabled={updateProfile.isLoading} className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5">
                      <Save className="h-3.5 w-3.5" />
                      <span>{updateProfile.isLoading ? 'Saving...' : 'Save Delivery Profile'}</span>
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setIsEditingAddress(false)} className="text-xs">
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {(user as any)?.deliveryAddress ? (
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{user?.name}</span>
                        <Badge variant="outline" className="text-[10px]">Default Destination</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {(user as any)?.deliveryAddress}<br />
                        {[(user as any)?.city, (user as any)?.state, (user as any)?.pincode].filter(Boolean).join(', ')}
                      </p>
                      {(user as any)?.phone && (
                        <p className="text-xs text-foreground font-medium pt-1">
                          Phone: {(user as any)?.phone}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-muted/20 rounded-2xl border border-dashed border-border space-y-3">
                      <MapPin className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-xs text-muted-foreground">
                        No delivery address saved yet. Save your address for 1-click checkout!
                      </p>
                      <Button size="sm" onClick={handleEditOpen} className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                        Add Delivery Address
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Customer Policies */}
        <TabsContent value="policies" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/warranty-policy" className="p-5 rounded-2xl bg-card border border-border hover:border-amber-600/40 transition-colors space-y-2 group">
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-foreground text-sm group-hover:text-amber-700">Plating Warranty & Care</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-muted-foreground">
                6-Month to 1-Year guarantee on 1-gram micro gold polish & maintenance tips.
              </p>
            </Link>

            <Link to="/refund-policy" className="p-5 rounded-2xl bg-card border border-border hover:border-amber-600/40 transition-colors space-y-2 group">
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-foreground text-sm group-hover:text-amber-700">Return & Exchange Policy</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-muted-foreground">
                24–72 hour return window with mandatory 360° unboxing video requirement.
              </p>
            </Link>

            <Link to="/shipping-policy" className="p-5 rounded-2xl bg-card border border-border hover:border-amber-600/40 transition-colors space-y-2 group">
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-foreground text-sm group-hover:text-amber-700">Shipping & Delivery Times</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-muted-foreground">
                3–5 days domestic express courier and 5–9 days international DHL/EMS shipping.
              </p>
            </Link>

            <Link to="/account-policy" className="p-5 rounded-2xl bg-card border border-border hover:border-amber-600/40 transition-colors space-y-2 group">
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-foreground text-sm group-hover:text-amber-700">Account & Security Policy</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-muted-foreground">
                Learn about personal data encryption, Google login, and order verification.
              </p>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
