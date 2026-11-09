import { useState } from 'react'
import { Users, Search, Shield, ShieldAlert, ShieldCheck, UserCheck, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'user', label: 'Customer (user)' },
  { value: 'shop_order_receiver', label: 'Order Concierge (staff)' },
  { value: 'admin', label: 'Administrator (admin)' },
]

export function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'user' | 'shop_order_receiver' | 'admin' | 'all'>('all')
  const [page, setPage] = useState(1)

  // Role modification dialog state
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string | null; email: string | null; role: string } | null>(null)
  const [targetRole, setTargetRole] = useState<'user' | 'shop_order_receiver' | 'admin'>('user')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data, isLoading, refetch } = trpc.auth.adminGetUsers.useQuery({
    page,
    limit: 20,
    search: search.trim() || undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
  })

  const updateRoleMutation = trpc.auth.adminUpdateUserRole.useMutation({
    onSuccess: () => {
      toast.success(`Role updated successfully for ${selectedUser?.name || selectedUser?.email || 'user'}`)
      setIsDialogOpen(false)
      setSelectedUser(null)
      refetch()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update user role')
    },
  })

  const handleOpenRoleDialog = (user: { id: string; name: string | null; email: string | null; role: string }) => {
    if (user.id === currentUser?.id) {
      toast.error('You cannot change your own administrator role.')
      return
    }
    setSelectedUser(user)
    setTargetRole(user.role as 'user' | 'shop_order_receiver' | 'admin')
    setIsDialogOpen(true)
  }

  const handleConfirmRoleChange = () => {
    if (!selectedUser) return
    updateRoleMutation.mutate({
      userId: selectedUser.id,
      role: targetRole,
    })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-amber-600 hover:bg-amber-700 text-white gap-1 text-xs">
            <ShieldAlert className="h-3 w-3" />
            <span>Admin</span>
          </Badge>
        )
      case 'shop_order_receiver':
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 gap-1 text-xs">
            <ShieldCheck className="h-3 w-3" />
            <span>Order Concierge</span>
          </Badge>
        )
      case 'user':
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1 text-xs">
            <UserCheck className="h-3 w-3" />
            <span>Customer</span>
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground flex items-center gap-2.5">
            <Users className="h-7 w-7 text-amber-600" />
            <span>User & Access Management</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage registered customer accounts, staff concierge members, and administrator roles.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="self-start sm:self-auto gap-1.5">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="card-sheaura">
        <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 text-sm rounded-xl"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Filter role:</span>
            <Select
              value={roleFilter}
              onValueChange={(val: 'user' | 'shop_order_receiver' | 'admin' | 'all') => {
                setRoleFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[180px] h-9 text-xs rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="card-sheaura overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/80">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">Registered Users</CardTitle>
              <CardDescription className="text-xs">
                Total accounts found: <strong>{data?.total ?? 0}</strong>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : data?.items && data.items.length > 0 ? (
            <div className="divide-y divide-border">
              {data.items.map((user) => {
                const isCurrent = user.id === currentUser?.id
                return (
                  <div
                    key={user.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Avatar className="h-10 w-10 border border-amber-600/20 shrink-0">
                        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name || ''} />}
                        <AvatarFallback className="bg-amber-100 text-amber-900 font-semibold text-xs dark:bg-amber-950 dark:text-amber-200">
                          {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {user.name || 'Valued Shopper'}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] font-medium bg-amber-500/10 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/20">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email || 'No email associated'}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                          Registered: {new Date(user.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-border/50">
                      <div>{getRoleBadge(user.role)}</div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenRoleDialog(user)}
                        disabled={isCurrent}
                        className="text-xs h-8 rounded-lg border-amber-700/20 hover:border-amber-600"
                      >
                        Change Role
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 p-4 text-muted-foreground text-sm">
              No users found matching the query.
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.page <= 1}
                  className="h-8 text-xs gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={data.page >= data.totalPages}
                  className="h-8 text-xs gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Change Confirmation Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600" />
              <span>Update User Permissions</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Change role and system permissions for <strong>{selectedUser?.name || selectedUser?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label htmlFor="user-role-select" className="text-xs font-semibold text-foreground">Select New Role:</label>
              <Select
                value={targetRole}
                onValueChange={(val: 'user' | 'shop_order_receiver' | 'admin') => setTargetRole(val)}
              >
                <SelectTrigger id="user-role-select" className="w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Customer (user) — standard shopping access</SelectItem>
                  <SelectItem value="shop_order_receiver">Order Concierge (staff) — view & manage orders only</SelectItem>
                  <SelectItem value="admin">Administrator (admin) — full system control</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl text-xs text-muted-foreground border border-border space-y-1">
              <p className="font-semibold text-foreground">Role Permissions:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li><strong>Customer:</strong> Public catalogue, cart, checkout, profile, and personal order tracking.</li>
                <li><strong>Order Concierge:</strong> View assigned customer orders and manage fulfillment status.</li>
                <li><strong>Admin:</strong> Manage inventory, products, categories, site settings, media, and all users.</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={updateRoleMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRoleChange}
              disabled={updateRoleMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {updateRoleMutation.isPending ? 'Updating...' : 'Save Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
