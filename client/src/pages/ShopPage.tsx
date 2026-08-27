import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { Filter, X, ChevronDown, ShoppingBag } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductCard } from '@/components/product/ProductCard'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

// Categories are now loaded dynamically from the database

const MODE_OPTIONS = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rental', label: 'For Rent' },
  { value: 'both', label: 'Sale & Rental' },
]

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'low_stock', label: 'Low Stock' },
]

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const { data: settings } = useSiteSettings()
  const currency = settings?.currency || 'INR'

  // Dynamic categories from database
  const { data: dbCategories } = trpc.categories.getList.useQuery()
  const CATEGORIES = (dbCategories || []).map((cat: { slug: string; name: string }) => ({
    value: cat.slug,
    label: cat.name,
  }))

  // Parse search params
  const category = searchParams.get('category') || ''
  const mode = searchParams.get('mode') || ''
  const search = searchParams.get('search') || ''
  const featured = searchParams.get('featured') === 'true'
  const sortBy = searchParams.get('sortBy') || 'featured'
  const page = parseInt(searchParams.get('page') || '1')
  const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
  const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
  const availability = searchParams.get('availability') || ''

  const { data, isLoading, error } = trpc.products.getList.useQuery({
    category: category || undefined,
    mode: mode as 'sale' | 'rental' | 'both' | undefined,
    minPrice,
    maxPrice,
    availability: availability as 'available' | 'low_stock' | 'out_of_stock' | 'discontinued' | undefined,
    featured: featured || undefined,
    search: search || undefined,
    sortBy: sortBy as 'featured' | 'newest' | 'price_asc' | 'price_desc',
    page,
    limit: 12,
  })

  // Update URL when filters change
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

  const clearFilters = () => {
    setSearchParams({})
  }

  const hasActiveFilters = category || mode || search || featured || minPrice !== undefined || maxPrice !== undefined || availability

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <section className="py-12 lg:py-16 bg-muted/30" aria-labelledby="shop-title">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto text-center">
            <h1 id="shop-title" className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium text-foreground mb-4">
              {category ? CATEGORIES.find(c => c.value === category)?.label : 'Shop Collection'}
              {mode && ` — ${MODE_OPTIONS.find(m => m.value === mode)?.label}`}
            </h1>
            <p className="text-muted-foreground text-lg">
              {search
                ? `Search results for "${search}"`
                : featured
                ? 'Handpicked featured products'
                : category
                ? `Browse our curated ${CATEGORIES.find(c => c.value === category)?.label?.toLowerCase()} collection`
                : mode
                ? `Explore products available for ${MODE_OPTIONS.find(m => m.value === mode)?.label?.toLowerCase()}`
                : 'Discover our complete collection of rental ornaments, cosmetics, and more'
              }
            </p>
          </div>
        </div>
      </section>

      {/* Filters & Product Grid */}
      <section className="section-spacing">
        <div className="container-sheaura">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 flex-shrink-0" aria-label="Product filters">
              {/* Mobile Filter Toggle */}
              <button
                className="lg:hidden btn-outline w-full justify-between mb-4"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                aria-expanded={isFilterOpen}
              >
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </span>
                <ChevronDown className={cn('h-4 w-4 transition-transform', isFilterOpen && 'rotate-180')} />
              </button>

              <div className={cn('space-y-6', !isFilterOpen && 'hidden lg:block')}>
                {/* Search */}
                <div>
                  <label htmlFor="search" className="block text-sm font-medium mb-2">Search</label>
                  <Input
                    id="search"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => updateFilters({ search: e.target.value || undefined })}
                    className="w-full"
                  />
                </div>

                <Separator />

                {/* Category Filter */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium mb-2">Category</label>
                  <Select value={category} onValueChange={(v) => updateFilters({ category: v || undefined })}>
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mode Filter */}
                <div>
                  <label htmlFor="mode" className="block text-sm font-medium mb-2">Mode</label>
                  <Select value={mode} onValueChange={(v) => updateFilters({ mode: v || undefined })}>
                    <SelectTrigger id="mode" className="w-full">
                      <SelectValue placeholder="All Modes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Modes</SelectItem>
                      {MODE_OPTIONS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Availability Filter */}
                <div>
                  <label htmlFor="availability" className="block text-sm font-medium mb-2">Availability</label>
                  <Select value={availability} onValueChange={(v) => updateFilters({ availability: v || undefined })}>
                    <SelectTrigger id="availability" className="w-full">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {AVAILABILITY_OPTIONS.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice || ''}
                      onChange={(e) => updateFilters({ minPrice: e.target.value || undefined })}
                      className="w-20"
                      min="0"
                      step="100"
                    />
                    <span className="text-muted-foreground">—</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice || ''}
                      onChange={(e) => updateFilters({ maxPrice: e.target.value || undefined })}
                      className="w-20"
                      min="0"
                      step="100"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{currency}</p>
                </div>

                {/* Featured Filter */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => updateFilters({ featured: e.target.checked ? 'true' : undefined })}
                      className="rounded border-input"
                    />
                    <span className="text-sm">Featured only</span>
                  </label>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button variant="ghost" className="w-full justify-start" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {data ? `${data.total} product${data.total !== 1 ? 's' : ''} found` : 'Loading...'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="sort" className="text-sm text-muted-foreground hidden sm:block">Sort by:</label>
                  <Select value={sortBy} onValueChange={(v) => updateFilters({ sortBy: v })}>
                    <SelectTrigger id="sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Product Grid */}
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="product-card animate-pulse">
                      <div className="aspect-[3/4] bg-muted/50" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 bg-muted/50 rounded w-3/4" />
                        <div className="h-4 bg-muted/50 rounded w-1/2" />
                        <div className="h-6 bg-muted/50 rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-4">Failed to load products. Please try again.</p>
                  <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
              ) : data?.items.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-6">
                    {hasActiveFilters ? 'Try adjusting your filters or' : 'No products available at the moment.'}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {data.items.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {data && data.totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateFilters({ page: String(page - 1) })}
                        disabled={page === 1}
                      >
                        Previous
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
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}