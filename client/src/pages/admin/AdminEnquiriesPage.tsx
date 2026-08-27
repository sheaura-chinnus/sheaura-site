import { Link, useSearchParams } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, Mail, Eye, MoreHorizontal, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'status', label: 'Status' },
]

const statusIcons = {
  new: Clock,
  contacted: Mail,
  reserved: CheckCircle,
  fulfilled: CheckCircle,
  cancelled: XCircle,
  rejected: XCircle,
}

const statusColors = {
  new: 'warning',
  contacted: 'secondary',
  reserved: 'default',
  fulfilled: 'success',
  cancelled: 'destructive',
  rejected: 'destructive',
} as const

export function AdminEnquiriesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = parseInt(searchParams.get('page') || '1')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const sortBy = searchParams.get('sortBy') || 'newest'

  const { data, isLoading } = trpc.enquiries.adminGetList.useQuery({
    search: search || undefined,
    status: status as any || undefined,
    sortBy: sortBy as any,
    page,
    limit: 20,
  })

  const updateStatusMutation = trpc.enquiries.updateEnquiryStatus.useMutation({
    onSuccess: () => {
      toast.success('Status updated')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update status')
    },
  })

  const updateFilters = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    params.set('page', '1')
    setSearchParams(params)
  }

  const getStatusBadge = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || AlertCircle
    const variant = statusColors[status as keyof typeof statusColors] || 'outline'
    return (
      <Badge variant={variant} className="gap-1 capitalize">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getNextStatuses = (currentStatus: string) => {
    const flow: Record<string, string[]> = {
      new: ['contacted', 'cancelled', 'rejected'],
      contacted: ['reserved', 'cancelled', 'rejected'],
      reserved: ['fulfilled', 'cancelled'],
      fulfilled: [],
      cancelled: [],
      rejected: [],
    }
    return flow[currentStatus] || []
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-muted w-48 rounded" />
          <div className="h-10 bg-muted w-32 rounded" />
        </div>
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-foreground">Enquiries</h1>
          <p className="text-muted-foreground mt-1">Manage customer enquiries and orders</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {data?.total || 0} total enquiries
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="card-sheaura">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search enquiries..."
                value={search}
                onChange={(e) => updateFilters({ search: e.target.value || undefined })}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Select value={status} onValueChange={(v) => updateFilters({ status: v || undefined })}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => updateFilters({ sortBy: v })}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enquiries Table */}
      <Card className="card-sheaura">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full" role="grid">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Enquiry ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Est. Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-48">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.items.map((enquiry) => (
                  <tr key={enquiry.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/admin/enquiries/${enquiry.id}`} className="font-mono text-sm font-medium text-foreground hover:text-primary transition-colors">
                        {enquiry.id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{enquiry.name}</p>
                        <p className="text-sm text-muted-foreground">{enquiry.email}</p>
                        <p className="text-sm text-muted-foreground">{enquiry.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">View details for items</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground">—</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(enquiry.status)}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">{formatDate(enquiry.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/enquiries/${enquiry.id}`} className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {getNextStatuses(enquiry.status).map((nextStatus) => {
                            const Icon = statusIcons[nextStatus as keyof typeof statusIcons] || Clock
                            return (
                              <DropdownMenuItem
                                key={nextStatus}
                                className="flex items-center gap-2"
                                onClick={() => updateStatusMutation.mutate({ id: enquiry.id, status: nextStatus as any })}
                                disabled={updateStatusMutation.isPending}
                              >
                                <Icon className="h-4 w-4" />
                                Mark as {nextStatus.replace('_', ' ')}
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {data?.items.length === 0 && (
            <div className="p-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No enquiries found</h3>
              <p className="text-muted-foreground">Enquiries will appear here when customers submit them.</p>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total} enquiries
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({ page: String(page - 1) })}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({ page: String(page + 1) })}
                  disabled={page === data.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}