import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { Filter, X, ChevronDown, Gem } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductCard } from '@/components/product/ProductCard'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured Collection' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'In Stock' },
  { value: 'low_stock', label: 'Limited Quantity' },
]

export function ShopPage(_props: { defaultMode?: 'sale' | 'rental' | 'both' } = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Dynamic categories from database
  const { data: dbCategories } = trpc.categories.getList.useQuery()
  const CATEGORIES = (dbCategories || []).map((cat: { slug: string; name: string }) => ({
    value: cat.slug,
    label: cat.name,
  }))

  // Parse search params
  const category = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''
  const featured = searchParams.get('featured') === 'true'
  const sortBy = searchParams.get('sortBy') || 'featured'
  const page = parseInt(searchParams.get('page') || '1')
  const availability = searchParams.get('availability') || ''

  const { data, isLoading, error } = trpc.products.getList.useQuery({
    category: category || undefined,
    mode: undefined, // Show all jewellery collections
    availability: availability as 'available' | 'low_stock' | 'out_of_stock' | 'discontinued' | undefined,
    featured: featured || undefined,
    search: search || undefined,
    sortBy: sortBy as 'featured' | 'newest' | 'price_asc' | 'price_desc',
    page,
    limit: 12,
  })

  // Update URL when filters change
  const updateFilters = (newFilters: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(newFilters).forEach(([key, value]) => {
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

  const hasActiveFilters = category || search || featured || availability

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <section className="py-12 lg:py-16 bg-amber-50/40 dark:bg-muted/20 border-b border-amber-900/10" aria-labelledby="shop-title">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest block mb-2">
              Exquisite Handcrafted Jewellery
            </span>
            <h1 id="shop-title" className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-950 dark:text-amber-200 mb-4">
              {category
                ? `${CATEGORIES.find(c => c.value === category)?.label || 'Category'} Collection`
                : 'Fashion & Imitation Jewellery Catalogue'}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
              {search
                ? `Showing jewellery pieces matching "${search}"`
                : 'Browse our curated collection of antique chokers, temple bridal sets, and celebration jewellery. Click to order on WhatsApp with your chosen item codes.'
              }
            </p>
          </div>
        </div>
      </section>

      {/* Filters & Catalogue Grid */}
      <section className="section-spacing">
        <div className="container-sheaura">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 flex-shrink-0" aria-label="Catalogue filters">
              {/* Mobile Filter Toggle */}
              <button
                className="lg:hidden w-full justify-between mb-4 flex items-center px-4 h-12 rounded-2xl border border-amber-900/15 bg-card shadow-sm active:bg-amber-50 transition-colors"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                aria-expanded={isFilterOpen}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-300">
                  <Filter className="h-4 w-4 text-amber-700" />
                  <span>Filter Jewellery {hasActiveFilters ? '(Active)' : ''}</span>
                </span>
                <ChevronDown className={cn('h-4 w-4 transition-transform text-muted-foreground', isFilterOpen && 'rotate-180')} />
              </button>

              <div className={cn('space-y-6', !isFilterOpen ? 'hidden lg:block' : 'block p-5 bg-card rounded-2xl border border-amber-900/15 shadow-sm mb-6 lg:mb-0 lg:p-0 lg:bg-transparent lg:border-0 lg:shadow-none')}>
                {/* Search by Name or Item Code */}
                <div>
                  <label htmlFor="search" className="block text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-2">Search</label>
                  <Input
                    id="search"
                    placeholder="Search name or item code (e.g. SH-001)..."
                    value={search}
                    onChange={(e) => updateFilters({ search: e.target.value || undefined })}
                    className="w-full text-sm rounded-xl"
                  />
                </div>

                <Separator />

                {/* Category Filter */}
                <div>
                  <label htmlFor="category" className="block text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-2">Category</label>
                  <Select value={category} onValueChange={(v) => updateFilters({ category: v || undefined })}>
                    <SelectTrigger id="category" className="w-full text-sm rounded-xl">
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

                {/* Availability Filter */}
                <div>
                  <label htmlFor="availability" className="block text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-2">Availability</label>
                  <Select value={availability} onValueChange={(v) => updateFilters({ availability: v || undefined })}>
                    <SelectTrigger id="availability" className="w-full text-sm rounded-xl">
                      <SelectValue placeholder="All Availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {AVAILABILITY_OPTIONS.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-xs text-amber-800 hover:text-amber-900 hover:bg-amber-500/10 rounded-xl">
                    <X className="h-3.5 w-3.5 mr-1" />
                    Reset Filters
                  </Button>
                )}
              </div>
            </aside>

            {/* Product Grid Area */}
            <main className="flex-1" aria-label="Jewellery catalogue">
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-amber-900/10">
                <p className="text-sm text-muted-foreground">
                  {isLoading ? (
                    'Loading catalogue...'
                  ) : (
                    <span>
                      Showing <strong className="text-amber-900 dark:text-amber-300">{data?.items.length || 0}</strong> of{' '}
                      <strong className="text-amber-900 dark:text-amber-300">{data?.total || 0}</strong> jewellery pieces
                    </span>
                  )}
                </p>

                {/* Sort Dropdown */}
                <div className="flex items-center space-x-2">
                  <label htmlFor="sort" className="text-xs font-medium text-muted-foreground whitespace-nowrap">Sort by:</label>
                  <Select value={sortBy} onValueChange={(v) => updateFilters({ sortBy: v })}>
                    <SelectTrigger id="sort" className="w-[190px] h-9 text-xs rounded-xl border-amber-900/15">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-xs">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Grid content */}
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse space-y-3 p-4 rounded-2xl border border-amber-900/10">
                      <div className="aspect-[4/5] bg-muted/60 rounded-xl" />
                      <div className="h-4 bg-muted/60 rounded w-1/3" />
                      <div className="h-5 bg-muted/60 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <p className="text-destructive mb-4">Failed to load jewellery catalogue.</p>
                  <Button onClick={() => window.location.reload()} className="rounded-xl">Retry</Button>
                </div>
              ) : data?.items.length === 0 ? (
                <div className="text-center py-16 bg-amber-50/20 rounded-3xl border border-dashed border-amber-900/20 p-8">
                  <Gem className="h-10 w-10 mx-auto text-amber-700/50 mb-3" />
                  <h3 className="font-display text-lg font-bold text-amber-950 dark:text-amber-200 mb-1">No Jewellery Pieces Found</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Try adjusting your search query or reset filters to discover our designs.
                  </p>
                  <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-xl border-amber-700/30">
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {data?.items.map((product) => (
                    <ProductCard key={product.id} product={product as any} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => updateFilters({ page: String(page - 1) })}
                    className="rounded-xl"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Page {page} of {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= data.totalPages}
                    onClick={() => updateFilters({ page: String(page + 1) })}
                    className="rounded-xl"
                  >
                    Next
                  </Button>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>
    </div>
  )
}