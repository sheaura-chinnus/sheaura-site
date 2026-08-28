import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Star, StarOff, X, CheckCircle2, Ban } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

const ADMIN_STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'available', label: 'Available' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'discontinued', label: 'Discontinued' },
]

const MODE_OPTIONS = [
  { value: '', label: 'All Modes' },
  { value: 'rental', label: 'Rental' },
  { value: 'sale', label: 'Sale' },
  { value: 'both', label: 'Both' },
]

const ADMIN_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
]

export function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Fetch categories for filter dropdown
  const { data: categoriesList } = trpc.categories.getList.useQuery()

  const page = parseInt(searchParams.get('page') || '1')
  const urlSearch = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const mode = searchParams.get('mode') || ''
  const categoryFilter = searchParams.get('category') || ''
  const featuredFilter = searchParams.get('featured') || ''
  const sortBy = searchParams.get('sortBy') || 'newest'

  // Local debounced search state
  const [searchInput, setSearchInput] = useState(urlSearch)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== urlSearch) {
        updateFilters({ search: searchInput.trim() || undefined })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Find category ID from slug
  const selectedCategoryId = categoryFilter
    ? categoriesList?.find((c: { slug: string }) => c.slug === categoryFilter)?.id
    : undefined

  const { data, isLoading, refetch } = trpc.products.adminGetList.useQuery({
    search: urlSearch || undefined,
    availability: status as any || undefined,
    categoryId: selectedCategoryId,
    mode: mode as any || undefined,
    isPublished: undefined,
    isFeatured: featuredFilter === 'true' ? true : featuredFilter === 'false' ? false : undefined,
    sortBy: sortBy as any,
    page,
    limit: 20,
  })

  const deleteMutation = trpc.products.archiveProduct.useMutation({
    onSuccess: () => {
      toast.success('Product deleted successfully')
      setDeleteConfirm(null)
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete product')
      setDeleteConfirm(null)
    },
  })

  // 1-Click Toggle / Remove Featured mutation
  const toggleFeaturedMutation = trpc.products.toggleFeaturedStatus.useMutation({
    onSuccess: (updatedProduct) => {
      if (updatedProduct.isFeatured) {
        toast.success(`"${updatedProduct.name}" featured on main page`)
      } else {
        toast.success(`"${updatedProduct.name}" removed from main page featured items`)
      }
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update featured status')
    },
  })

  // Bulk remove featured mutation for category
  const removeCategoryFeaturedMutation = trpc.products.removeFeaturedFromCategory.useMutation({
    onSuccess: (result) => {
      toast.success(`Removed ${result.count} product(s) from main page featured section`)
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove featured products')
    },
  })

  // Bulk update mutation (catalogue category, availability, isFeatured)
  const bulkUpdateMutation = trpc.products.bulkUpdateProducts.useMutation({
    onSuccess: (result) => {
      toast.success(`Updated ${result.count} ornament(s) successfully`)
      setSelectedIds(new Set())
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update ornaments')
    },
  })

  // Bulk delete mutation
  const bulkDeleteMutation = trpc.products.bulkDeleteProducts.useMutation({
    onSuccess: (result) => {
      toast.success(`Deleted ${result.count} ornament(s) successfully`)
      setSelectedIds(new Set())
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete ornaments')
    },
  })

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const currentPageIds = data?.items?.map((p: { id: string }) => p.id) || []
  const isAllSelected = currentPageIds.length > 0 && currentPageIds.every((id: string) => selectedIds.has(id))

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const next = new Set(selectedIds)
      currentPageIds.forEach((id: string) => next.delete(id))
      setSelectedIds(next)
    } else {
      const next = new Set(selectedIds)
      currentPageIds.forEach((id: string) => next.add(id))
      setSelectedIds(next)
    }
  }

  const handleBulkUpdate = (updates: {
    categoryId?: string
    availability?: 'available' | 'low_stock' | 'out_of_stock' | 'discontinued'
    isFeatured?: boolean
  }) => {
    if (selectedIds.size === 0) return
    bulkUpdateMutation.mutate({
      ids: Array.from(selectedIds),
      ...updates,
    })
  }

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return
    if (confirm(`Are you sure you want to permanently delete ${selectedIds.size} selected ornament(s)? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate({ ids: Array.from(selectedIds) })
    }
  }

  // Clear all products mutation (wipe out demo stock)
  const clearAllMutation = trpc.products.clearAllProducts.useMutation({
    onSuccess: (result) => {
      toast.success(`Cleared ${result.count} ornament(s) from catalogue`)
      setSelectedIds(new Set())
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to clear stock')
    },
  })

  const handleClearAllStock = () => {
    if (confirm('Are you sure you want to delete ALL current ornaments from the catalogue? This will clear all current demo stock so you can upload your real ornaments.')) {
      clearAllMutation.mutate()
    }
  }

  const handleQuickAvailability = (id: string, availability: 'available' | 'low_stock' | 'out_of_stock') => {
    bulkUpdateMutation.mutate({
      ids: [id],
      availability,
    })
  }

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

  const handleDelete = (id: string) => {
    setDeleteConfirm(id)
  }

  const confirmDelete = (id: string) => {
    deleteMutation.mutate({ id })
  }

  const handleToggleFeatured = (id: string, currentFeatured: boolean) => {
    toggleFeaturedMutation.mutate({ id, isFeatured: !currentFeatured })
  }

  const handleBulkRemoveFeatured = () => {
    const categoryName = categoryFilter
      ? categoriesList?.find((c: { slug: string }) => c.slug === categoryFilter)?.name || 'this category'
      : 'all categories'
    if (confirm(`Are you sure you want to remove all featured products in ${categoryName} from the main page?`)) {
      removeCategoryFeaturedMutation.mutate({ categoryId: selectedCategoryId })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'destructive' | 'outline'> = {
      available: 'success',
      low_stock: 'warning',
      out_of_stock: 'destructive',
      discontinued: 'outline',
    }
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status.replace('_', ' ')}
      </Badge>
    )
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
          <h1 className="font-display text-2xl font-bold text-foreground">Catalogue Ornaments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage rental ornaments, unique item codes, and main page featured highlights.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {data && data.total > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllStock}
              disabled={clearAllMutation.isPending}
              className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All Stock</span>
            </Button>
          )}
          <Link to="/admin/products/create">
            <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm">
              <Plus className="h-4 w-4" />
              <span>Add Ornament</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="card-sheaura">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search by name, slug, or item code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2.5 sm:gap-3 items-center">
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={(v) => updateFilters({ category: v || undefined })}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {(categoriesList || []).map((cat: { slug: string; name: string }) => (
                    <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Featured Filter (Allows viewing/managing main page items) */}
              <Select value={featuredFilter} onValueChange={(v) => updateFilters({ featured: v || undefined })}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Featured Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Products</SelectItem>
                  <SelectItem value="true">⭐ Main Page Featured</SelectItem>
                  <SelectItem value="false">Regular Products</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={status} onValueChange={(v) => updateFilters({ status: v || undefined })}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Mode Filter */}
              <Select value={mode} onValueChange={(v) => updateFilters({ mode: v || undefined })}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  {MODE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Filter */}
              <Select value={sortBy} onValueChange={(v) => updateFilters({ sortBy: v || undefined })}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Quick Action: Bulk remove featured from category or all */}
              {featuredFilter === 'true' && data && data.items.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkRemoveFeatured}
                  disabled={removeCategoryFeaturedMutation.isPending}
                  className="h-10 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <StarOff className="h-3.5 w-3.5 mr-1" />
                  <span>Remove All {categoryFilter ? 'in Category' : ''} from Main Page</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 animate-in fade-in-50 duration-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-white text-xs font-bold shadow-xs">
              {selectedIds.size}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {selectedIds.size} {selectedIds.size === 1 ? 'ornament' : 'ornaments'} selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Move to Catalogue */}
            <Select onValueChange={(categoryId) => handleBulkUpdate({ categoryId })}>
              <SelectTrigger className="h-8 text-xs w-[160px] bg-background">
                <SelectValue placeholder="Move to Catalogue..." />
              </SelectTrigger>
              <SelectContent>
                {(categoriesList || []).map((cat: { id: string; name: string }) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Bulk Update Availability */}
            <Select onValueChange={(availability) => handleBulkUpdate({ availability: availability as any })}>
              <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
                <SelectValue placeholder="Set Availability..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="low_stock">Limited Slots</SelectItem>
                <SelectItem value="out_of_stock">Unavailable (Rented)</SelectItem>
                <SelectItem value="discontinued">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Bulk Feature on Main Page */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1 bg-background text-amber-700 dark:text-amber-300 hover:bg-amber-50"
              onClick={() => handleBulkUpdate({ isFeatured: true })}
              disabled={bulkUpdateMutation.isPending}
            >
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>Feature ({selectedIds.size})</span>
            </Button>

            {/* Bulk Unfeature */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1 bg-background"
              onClick={() => handleBulkUpdate({ isFeatured: false })}
              disabled={bulkUpdateMutation.isPending}
            >
              <StarOff className="h-3.5 w-3.5" />
              <span>Unfeature</span>
            </Button>

            {/* Bulk Delete */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1 text-destructive hover:bg-destructive/10 border-destructive/30 bg-background"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </Button>

            {/* Clear Selection */}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs px-2 text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedIds(new Set())}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              <span>Clear</span>
            </Button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <Card className="card-sheaura">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full" role="grid">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      aria-label="Select all ornaments on this page"
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer align-middle"
                    />
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Item Code</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ornament</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock Qty</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Availability</th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Main Page Featured</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Published</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.items.map((product) => {
                  const isSelected = selectedIds.has(product.id)
                  return (
                  <tr key={product.id} className={cn('hover:bg-muted/30 transition-colors', isSelected && 'bg-amber-500/5')}>
                    <td className="w-10 px-3 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(product.id)}
                        aria-label={`Select ${product.name}`}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer align-middle"
                      />
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="font-mono text-xs font-bold px-2 py-0.5">
                        {product.itemCode || 'SH-ORNAMENT'}
                      </Badge>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 rounded-lg bg-muted/50 overflow-hidden flex-shrink-0">
                          {product.primaryImage?.url ? (
                            <img src={product.primaryImage.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                              Sheaura
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link to={`/admin/products/${product.id}/edit`} className="font-medium text-foreground hover:text-primary transition-colors block truncate max-w-xs">
                            {product.name}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate max-w-xs">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-foreground">{product.category?.name || '—'}</span>
                    </td>

                    {/* Stock Quantity Column */}
                    <td className="px-4 sm:px-6 py-4 text-center whitespace-nowrap">
                      <span className={cn(
                        'font-mono text-xs font-bold px-2.5 py-1 rounded-md inline-block',
                        (product.stockQuantity ?? 1) > 0
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-destructive/10 text-destructive border border-destructive/20'
                      )}>
                        {(product.stockQuantity ?? 1)} {(product.stockQuantity ?? 1) === 1 ? 'unit' : 'units'}
                      </span>
                    </td>

                    {/* Availability Column */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(product.availability)}
                    </td>

                    {/* 1-Click Toggle / Remove Featured Button */}
                    <td className="px-4 sm:px-6 py-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(product.id, !!product.isFeatured)}
                        disabled={toggleFeaturedMutation.isPending}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-xs min-h-[32px]',
                          product.isFeatured
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                            : 'text-muted-foreground hover:bg-accent border border-border/50 hover:text-foreground'
                        )}
                        title={product.isFeatured ? 'Click to remove from main page' : 'Click to feature on main page'}
                        aria-label={product.isFeatured ? `Remove ${product.name} from featured` : `Feature ${product.name}`}
                      >
                        <Star className={cn('h-3.5 w-3.5', product.isFeatured ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground')} />
                        <span className="text-[11px] font-semibold">{product.isFeatured ? 'Featured' : 'Regular'}</span>
                      </button>
                    </td>

                    <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                      <Badge variant={product.isPublished ? 'secondary' : 'outline'} className="text-xs">
                        {product.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[36px] min-w-[36px]">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              View on Site
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/products/${product.id}/edit`} className="flex items-center gap-2">
                              <Edit className="h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>

                          {/* Quick Availability Actions */}
                          {product.availability === 'available' ? (
                            <DropdownMenuItem
                              onClick={() => handleQuickAvailability(product.id, 'out_of_stock')}
                              className="flex items-center gap-2 text-amber-700 dark:text-amber-300 cursor-pointer"
                            >
                              <Ban className="h-4 w-4" />
                              <span>Mark Out of Stock (In Rental)</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleQuickAvailability(product.id, 'available')}
                              className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Mark Available (Returned)</span>
                            </DropdownMenuItem>
                          )}

                          {/* Quick Toggle in Action Menu */}
                          <DropdownMenuItem
                            onClick={() => handleToggleFeatured(product.id, !!product.isFeatured)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            {product.isFeatured ? (
                              <>
                                <StarOff className="h-4 w-4 text-amber-600" />
                                <span>Remove from Featured</span>
                              </>
                            ) : (
                              <>
                                <Star className="h-4 w-4 text-amber-600" />
                                <span>Feature on Main Page</span>
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive flex items-center gap-2"
                            onClick={() => handleDelete(product.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {data?.items.length === 0 && (
            <div className="p-12 text-center">
              <StarOff className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="text-lg font-medium text-foreground mb-2">No ornaments match your filters</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {featuredFilter === 'true'
                  ? 'There are currently no featured ornaments matching this category.'
                  : 'Try adjusting your search query or category filters.'}
              </p>
              {featuredFilter === 'true' && (
                <Button variant="outline" size="sm" onClick={() => updateFilters({ featured: undefined })}>
                  View All Products
                </Button>
              )}
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.total)} of {data.total} products
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({ page: String(page - 1) })}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({ page: String(page + 1) })}
                  disabled={page >= data.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-display text-lg font-bold text-foreground">Confirm Delete</h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this product? It will be archived and hidden from customers.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleteMutation.isPending}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => confirmDelete(deleteConfirm)} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Product'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}