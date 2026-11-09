import { Link } from 'react-router-dom'
import { Package, Tag, Mail, ArrowUpRight, DollarSign, Settings } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'

const statsCards = [
  {
    name: 'Total Products',
    value: '0',
    icon: Package,
    href: '/admin/products',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    name: 'Categories',
    value: '0',
    icon: Tag,
    href: '/admin/categories',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    name: 'Enquiries',
    value: '0',
    icon: Mail,
    href: '/admin/enquiries',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    name: 'Revenue (Est.)',
    value: '₹0',
    icon: DollarSign,
    href: '/admin/enquiries',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
]

export function AdminDashboardPage() {
  const { data: productsStats } = trpc.products.adminGetList.useQuery({ limit: 1, page: 1 })
  const { data: categoriesStats } = trpc.categories.adminGetList.useQuery({ limit: 100 })
  const { data: enquiriesStats } = trpc.enquiries.getStats.useQuery()
  const { data: recentEnquiries } = trpc.enquiries.adminGetList.useQuery({ limit: 5 })

  const totalProducts = productsStats?.total || 0
  const totalCategories = categoriesStats?.total || 0
  const totalEnquiries = enquiriesStats?.totalEnquiries || 0
  const pendingEnquiries = enquiriesStats?.newEnquiries || 0
  const estimatedRevenue = enquiriesStats?.estimatedRevenue || 0

  const updatedStatsCards = [
    {
      ...statsCards[0],
      value: totalProducts.toLocaleString(),
    },
    {
      ...statsCards[1],
      value: totalCategories.toLocaleString(),
    },
    {
      ...statsCards[2],
      value: totalEnquiries.toLocaleString(),
    },
    {
      ...statsCards[3],
      value: formatCurrency(estimatedRevenue, 'INR'),
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your store performance</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/products/create">
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {updatedStatsCards.map((stat, index) => (
          <Card key={index} className="card-sheaura">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.bgColor)}>
                  <stat.icon className={cn('h-6 w-6', stat.color)} aria-hidden="true" />
                </div>
              </div>
              <div className="mt-4">
                <Link to={stat.href} className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors">
                  View details <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="card-sheaura">
            <CardHeader>
              <CardTitle className="font-display text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/admin/products/create">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Package className="h-4 w-4" />
                  Add New Product
                </Button>
              </Link>
              <Link to="/admin/categories">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Tag className="h-4 w-4" />
                  Manage Categories
                </Button>
              </Link>
              <Link to="/admin/enquiries">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Mail className="h-4 w-4" />
                  View Enquiries
                </Button>
              </Link>
              <Link to="/admin/settings">
                <Button variant="outline" className="w-full justify-start gap-3">
                  <Settings className="h-4 w-4" />
                  Site Settings
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pending Enquiries Alert */}
          {pendingEnquiries > 0 && (
            <Card className="card-sheaura border-warning">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Pending Enquiries</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You have <strong>{pendingEnquiries}</strong> enquir{pendingEnquiries === 1 ? 'y' : 'ies'} awaiting response
                    </p>
                    <Link to="/admin/enquiries?status=pending" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 mt-2 transition-colors">
                      Review now <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="card-sheaura">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg">Recent Orders & Enquiries</CardTitle>
              <Link to="/admin/enquiries" className="text-sm text-primary hover:text-primary/80 transition-colors">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {recentEnquiries?.items && recentEnquiries.items.length > 0 ? (
                <div className="space-y-4">
                  {recentEnquiries.items.map((item) => (
                    <Link
                      key={item.id}
                      to={`/admin/enquiries/${item.id}`}
                      className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/60 transition-colors block"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-500/10 text-blue-500">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.phone || item.email} • {new Date(item.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <Badge variant={
                        item.status === 'new' ? 'warning' :
                        item.status === 'fulfilled' ? 'success' :
                        item.status === 'cancelled' || item.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {item.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No orders or enquiries recorded yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Overview */}
          <Card className="card-sheaura mt-6">
            <CardHeader>
              <CardTitle className="font-display text-lg">Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-3xl font-bold text-foreground">{totalProducts}</p>
                  <p className="text-sm text-muted-foreground">Active Products</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-3xl font-bold text-foreground">{totalCategories}</p>
                  <p className="text-sm text-muted-foreground">Categories</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-3xl font-bold text-foreground">{totalEnquiries}</p>
                  <p className="text-sm text-muted-foreground">Total Enquiries</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-3xl font-bold text-foreground">{formatCurrency(estimatedRevenue, 'INR')}</p>
                  <p className="text-sm text-muted-foreground">Est. Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}