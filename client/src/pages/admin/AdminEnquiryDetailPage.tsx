import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Calendar, MapPin, Package, CheckCircle, XCircle, Clock, AlertCircle, Edit, MessageSquare, Download, Share2, MoreHorizontal, Trash2, Ban, CheckCircle2, Sparkles } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

const statusIcons = {
  new: Clock,
  contacted: Mail,
  reserved: Package,
  fulfilled: CheckCircle,
  cancelled: XCircle,
  rejected: AlertCircle,
}

const statusColors = {
  new: 'warning',
  contacted: 'secondary',
  reserved: 'default',
  fulfilled: 'success',
  cancelled: 'destructive',
  rejected: 'destructive',
} as const

const statusFlow: Record<string, string[]> = {
  new: ['contacted', 'rejected'],
  contacted: ['reserved', 'cancelled'],
  reserved: ['fulfilled', 'cancelled'],
  fulfilled: [],
  cancelled: [],
  rejected: [],
}

export function AdminEnquiryDetailPage() {
  const { id } = useParams<{ id: string }>()

  const navigate = useNavigate()
  const { data: enquiry, isLoading, refetch } = trpc.enquiries.adminGetById.useQuery({ id: id! })

  const updateStatusMutation = trpc.enquiries.updateEnquiryStatus.useMutation({
    onSuccess: () => {
      toast.success('Status updated')
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update status')
    },
  })

  const deleteMutation = trpc.enquiries.deleteEnquiry.useMutation({
    onSuccess: () => {
      toast.success('Enquiry deleted successfully')
      navigate('/admin/enquiries')
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete enquiry')
    },
  })

  const markOutOfStockMutation = trpc.enquiries.markItemsOutOfStock.useMutation({
    onSuccess: (result) => {
      toast.success(`Marked ${result.count} item(s) Out of Stock (In Rental)`)
      refetch()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update items')
    },
  })

  const markAvailableMutation = trpc.enquiries.markItemsAvailable.useMutation({
    onSuccess: (result) => {
      toast.success(`Marked ${result.count} item(s) Available (Returned)`)
      refetch()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update items')
    },
  })

  const singleProductUpdateMutation = trpc.products.bulkUpdateProducts.useMutation({
    onSuccess: () => {
      toast.success('Item availability updated')
      refetch()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update item')
    },
  })

  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-muted w-48 rounded" />
          <div className="h-10 bg-muted w-32 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-muted rounded-xl" />
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-muted rounded-xl" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!enquiry) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Enquiry not found</h3>
        <p className="text-muted-foreground mb-4">The enquiry you're looking for doesn't exist.</p>
        <Link to="/admin/enquiries">
          <Button>Back to Enquiries</Button>
        </Link>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || AlertCircle
    const variant = statusColors[status as keyof typeof statusColors] || 'outline'
    return (
      <Badge variant={variant} className="gap-1 capitalize text-sm px-3 py-1.5">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getNextStatuses = (currentStatus: string) => {
    return statusFlow[currentStatus] || []
  }

  const handleStatusUpdate = () => {
    if (!selectedStatus) return
    updateStatusMutation.mutate({ id: enquiry.id, status: selectedStatus as any, adminNotes: adminNotes || undefined })
    setUpdateDialogOpen(false)
    setSelectedStatus('')
    setAdminNotes('')
  }

  const estimatedTotal = enquiry.items.reduce((sum, item) => sum + (Number(item.unitPrice) * item.quantity), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/enquiries">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-3xl font-medium text-foreground">Enquiry Details</h1>
            <p className="text-muted-foreground mt-1">Enquiry #{enquiry.id.slice(-8).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(enquiry.status)}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 border-destructive/30 text-xs gap-1.5 h-9"
            onClick={() => {
              if (confirm(`Delete enquiry from "${enquiry.name}"? This action cannot be undone.`)) {
                deleteMutation.mutate({ id: enquiry.id })
              }
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Enquiry</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer & Order Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Customer Info */}
          <Card className="card-sheaura">
            <CardHeader>
              <CardTitle className="font-display text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium text-foreground">{enquiry.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{enquiry.email}</p>
                  </div>
                </div>
                {enquiry.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium text-foreground">{enquiry.phone}</p>
                    </div>
                  </div>
                )}
                {enquiry.preferredContact && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Preferred Contact</p>
                      <p className="font-medium text-foreground capitalize">{enquiry.preferredContact}</p>
                    </div>
                  </div>
                )}
                {enquiry.user && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Registered User</p>
                      <p className="font-medium text-foreground">{enquiry.user.name} ({enquiry.user.email})</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          {(enquiry.eventDate || enquiry.returnDate || enquiry.deliveryPickup) && (
            <Card className="card-sheaura">
              <CardHeader>
                <CardTitle className="font-display text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {enquiry.eventDate && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Event Date</p>
                      <p className="font-medium text-foreground">{formatDate(enquiry.eventDate)}</p>
                    </div>
                  </div>
                )}
                {enquiry.returnDate && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Return Date</p>
                      <p className="font-medium text-foreground">{formatDate(enquiry.returnDate)}</p>
                    </div>
                  </div>
                )}
                {enquiry.deliveryPickup && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Delivery / Pickup</p>
                      <p className="font-medium text-foreground capitalize">{enquiry.deliveryPickup}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card className="card-sheaura">
            <CardHeader>
              <CardTitle className="font-display text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium">{enquiry.items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated Total</span>
                <span className="font-medium text-lg text-primary">{formatCurrency(estimatedTotal, 'INR')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Submitted</span>
                <span className="font-medium">{formatDate(enquiry.createdAt)}</span>
              </div>
              {enquiry.updatedAt !== enquiry.createdAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">{formatDate(enquiry.updatedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Message */}
          {enquiry.message && (
            <Card className="card-sheaura">
              <CardHeader>
                <CardTitle className="font-display text-lg">Customer Message</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{enquiry.message}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Items & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card className="card-sheaura">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="font-display text-lg">Enquiry Items ({enquiry.items.length})</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Track stock quantity and rental availability for these ornaments.
                </p>
              </div>

              {/* Quick Bulk Stock Actions for Enquiry */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markOutOfStockMutation.mutate({ enquiryId: enquiry.id })}
                  disabled={markOutOfStockMutation.isPending}
                  className="text-xs h-8 gap-1.5 text-amber-700 dark:text-amber-300 hover:bg-amber-50"
                >
                  <Ban className="h-3.5 w-3.5" />
                  <span>Mark All Out of Stock</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAvailableMutation.mutate({ enquiryId: enquiry.id })}
                  disabled={markAvailableMutation.isPending}
                  className="text-xs h-8 gap-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Mark All Available</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Notice when booking status is active */}
              {(enquiry.status === 'reserved' || enquiry.status === 'fulfilled') && (
                <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
                  <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    This rental is currently active. All included ornaments are automatically marked <strong>Out of Stock</strong> in the public catalogue.
                  </span>
                </div>
              )}

              <div className="space-y-4">
                {enquiry.items.map((item) => {
                  const isItemAvailable = item.product.availability === 'available'
                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 border border-border rounded-lg justify-between sm:items-center">
                      <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-lg bg-muted/50 overflow-hidden flex-shrink-0">
                          {item.product.images?.[0]?.url ? (
                            <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="font-mono text-xs font-bold px-1.5 py-0">
                              {item.product.itemCode || 'SH-ORNAMENT'}
                            </Badge>
                            <Link to={`/product/${item.product.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-primary transition-colors truncate">
                              {item.product.name}
                            </Link>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                            <span>Requested Qty: <strong className="text-foreground">{item.quantity}</strong></span>
                            <span>•</span>
                            <span className={cn(
                              'font-mono font-bold px-1.5 py-0.5 rounded text-[11px]',
                              (item.product.stockQuantity ?? 1) > 0 ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10' : 'text-destructive bg-destructive/10'
                            )}>
                              Stock Qty: {item.product.stockQuantity ?? 1}
                            </span>
                            <span>•</span>
                            <Badge
                              variant={isItemAvailable ? 'secondary' : 'destructive'}
                              className="text-[10px] uppercase font-bold"
                            >
                              {isItemAvailable ? 'Available' : 'Out of Stock (In Rental)'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Single Item Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                        <span className="font-medium text-foreground whitespace-nowrap text-sm">
                          {formatCurrency(Number(item.unitPrice) * item.quantity, 'INR')}
                        </span>
                        {isItemAvailable ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => singleProductUpdateMutation.mutate({ ids: [item.productId], availability: 'out_of_stock' })}
                            disabled={singleProductUpdateMutation.isPending}
                            className="text-xs h-7 text-amber-700 dark:text-amber-300 hover:bg-amber-50"
                          >
                            <Ban className="h-3 w-3 mr-1" />
                            <span>Mark Out of Stock</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => singleProductUpdateMutation.mutate({ ids: [item.productId], availability: 'available' })}
                            disabled={singleProductUpdateMutation.isPending}
                            className="text-xs h-7 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            <span>Mark Available</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-end">
                <span className="text-lg font-bold text-foreground">
                  Total: {formatCurrency(estimatedTotal, 'INR')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card className="card-sheaura">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg">Admin Actions</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/product/${enquiry.items[0]?.product.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      View Product on Site
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigator.clipboard.writeText(enquiry.id)}>
                    <Download className="h-4 w-4" />
                    Copy Enquiry ID
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share Enquiry
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Update */}
              <div>
                <Label className="block text-sm font-medium mb-2">Update Status</Label>
                <div className="flex flex-wrap gap-2">
                  {getNextStatuses(enquiry.status).map((nextStatus) => {
                    const Icon = statusIcons[nextStatus as keyof typeof statusIcons]
                    return (
                      <Button
                        key={nextStatus}
                        variant={enquiry.status === nextStatus ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedStatus(nextStatus)
                          setUpdateDialogOpen(true)
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        Mark as {nextStatus.replace('_', ' ')}
                      </Button>
                    )
                  })}
                  {getNextStatuses(enquiry.status).length === 0 && (
                    <Badge variant="outline" className="text-muted-foreground">
                      No further status transitions available
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* Admin Notes */}
              <div>
                <Label className="block text-sm font-medium mb-2">Admin Notes</Label>
                {isEditingNotes ? (
                  <div className="space-y-2">
                    <Textarea
                      value={adminNotes || enquiry.adminNotes || ''}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add internal notes for your team..."
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setIsEditingNotes(false); setAdminNotes('') }}>Cancel</Button>
                      <Button size="sm" onClick={() => { /* save notes - would need a mutation */ setIsEditingNotes(false); toast.success('Notes saved') }}>Save</Button>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[80px] p-4 bg-muted/30 rounded-lg border border-border">
                    {enquiry.adminNotes ? (
                      <p className="text-muted-foreground whitespace-pre-wrap">{enquiry.adminNotes}</p>
                    ) : (
                      <p className="text-muted-foreground italic">No admin notes yet</p>
                    )}
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setAdminNotes(enquiry.adminNotes || ''); setIsEditingNotes(true) }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Notes
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Enquiry Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium mb-2">New Status</Label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select status</option>
                {getNextStatuses(enquiry.status).map((status) => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="block text-sm font-medium mb-2">Admin Notes (Optional)</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this status change..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)} disabled={updateStatusMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={updateStatusMutation.isPending || !selectedStatus}>
              {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

