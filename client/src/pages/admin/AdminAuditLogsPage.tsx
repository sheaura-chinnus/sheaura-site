import { useState } from 'react'
import { FileText, Filter, Calendar, User, RefreshCw } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function AdminAuditLogsPage() {
  const [entityType, setEntityType] = useState<string>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = trpc.auditLogs.adminGetList.useQuery({
    page,
    limit: 25,
    entityType: entityType !== 'all' ? entityType : undefined,
  })

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATED') || action.includes('ADDED') || action.includes('UPLOADED')) {
      return 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30'
    }
    if (action.includes('DELETED') || action.includes('REMOVED')) {
      return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30'
    }
    if (action.includes('UPDATED') || action.includes('REPLACED')) {
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30'
    }
    return 'bg-muted text-muted-foreground'
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">Audit Log History</h1>
          <p className="text-muted-foreground mt-1">
            Immutable log of administrative operations, setting changes, logo updates, and product revisions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="card-sheaura">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by Entity:</span>
            <Select value={entityType} onValueChange={(val) => { setEntityType(val); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="site_setting">Site Settings</SelectItem>
                <SelectItem value="media_asset">Media & Logo</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="category">Categories</SelectItem>
                <SelectItem value="enquiry">Enquiries</SelectItem>
                <SelectItem value="user">User Roles</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Total records: {data?.total ?? 0}
          </p>
        </CardContent>
      </Card>

      {/* Logs Table / List */}
      <Card className="card-sheaura">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Audit Events</span>
          </CardTitle>
          <CardDescription>
            Chronological audit events recorded server-side without secret leakage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4 py-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-muted/60 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : data?.items && data.items.length > 0 ? (
            <div className="divide-y divide-border">
              {data.items.map((log) => {
                const dateFormatted = new Date(log.createdAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })

                return (
                  <div key={log.id} className="py-3.5 space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`font-mono text-xs font-semibold ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </Badge>
                        <span className="text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded">
                          {log.entityType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.user?.name || log.user?.email || 'System'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {dateFormatted}
                        </span>
                      </div>
                    </div>

                    {/* Summary of changes */}
                    {(log.newData || log.oldData) && (
                      <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border border-border/50 font-mono break-all line-clamp-2 hover:line-clamp-none transition-all">
                        {log.newData ? `New: ${log.newData}` : ''}
                        {log.oldData ? ` | Old: ${log.oldData}` : ''}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No audit logs recorded for this criteria.
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-border mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
