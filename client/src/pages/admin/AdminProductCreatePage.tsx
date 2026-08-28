import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Plus, Trash2, FolderCheck, Check, Sparkles, Wand2, RefreshCw } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { slugify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'react-hot-toast'

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'low_stock', label: 'Limited Slots' },
  { value: 'out_of_stock', label: 'Unavailable' },
  { value: 'discontinued', label: 'Archived' },
]

export function AdminProductCreatePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id

  const { data: categories } = trpc.categories.adminGetList.useQuery({ limit: 100 })
  const { data: productData } = trpc.products.adminGetById.useQuery(
    { id: id! },
    { enabled: isEditing }
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<Array<{ url: string; altText: string; isPrimary: boolean; displayOrder: number }>>([])
  const [mainImageIndex, setMainImageIndex] = useState(0)

  const [formData, setFormData] = useState({
    name: '',
    itemCode: '',
    slug: '',
    shortDescription: '',
    description: '',
    categoryId: '',
    mode: 'rental' as 'sale' | 'rental' | 'both',
    salePrice: '',
    rentalPrice: '',
    rentalDurationDays: 7,
    depositAmount: '',
    stockQuantity: 1,
    availability: 'available' as string,
    isFeatured: false,
    isActive: true,
    tags: '',
    careInstructions: '',
    materials: '',
    dimensions: '',
    weight: '',
  })

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(isEditing)

  // Load product data when editing
  useEffect(() => {
    if (productData) {
      setIsSlugManuallyEdited(true)
      setFormData({
        name: productData.name || '',
        itemCode: productData.itemCode || '',
        slug: productData.slug || '',
        shortDescription: productData.shortDescription || '',
        description: productData.description || '',
        categoryId: productData.categoryId || '',
        mode: (productData.mode as any) || 'rental',
        salePrice: productData.salePrice || '',
        rentalPrice: productData.rentalPrice || '',
        rentalDurationDays: productData.rentalDurationDays || 7,
        depositAmount: productData.depositAmount || '',
        stockQuantity: productData.stockQuantity ?? 1,
        availability: productData.availability || 'available',
        isFeatured: productData.isFeatured || false,
        isActive: productData.isPublished !== false,
        tags: (productData.tags || []).join(', '),
        careInstructions: productData.careInstructions || '',
        materials: '',
        dimensions: '',
        weight: '',
      })
      if (productData.images && productData.images.length > 0) {
        setImages(
          productData.images.map((img: any, idx: number) => ({
            url: img.url,
            altText: img.altText || '',
            isPrimary: img.isPrimary,
            displayOrder: img.displayOrder || idx,
          }))
        )
      }
    }
  }, [productData])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setFormData(prev => ({
      ...prev,
      name: newName,
      slug: (!isSlugManuallyEdited || !prev.slug) ? slugify(newName) : prev.slug,
    }))
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true)
    setFormData(prev => ({
      ...prev,
      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
    }))
  }

  const handleRegenerateSlug = () => {
    const autoSlug = slugify(formData.name)
    setFormData(prev => ({ ...prev, slug: autoSlug }))
    setIsSlugManuallyEdited(false)
    if (autoSlug) {
      toast.success('Slug auto-generated from name')
    } else {
      toast.error('Please enter an ornament name first')
    }
  }

  const createMutation = trpc.products.createProduct.useMutation({
    onSuccess: () => {
      toast.success(isEditing ? 'Rental ornament updated successfully' : 'Rental ornament created successfully')
      navigate('/admin/products')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save product')
      setIsSubmitting(false)
    },
  })

  const updateMutation = trpc.products.updateProduct.useMutation({
    onSuccess: () => {
      toast.success('Rental ornament updated successfully')
      navigate('/admin/products')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update product')
      setIsSubmitting(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Ornament name is required')
      return
    }
    if (!formData.categoryId) {
      toast.error('Please select a rental catalogue collection for this ornament')
      return
    }

    setIsSubmitting(true)

    const finalSlug = slugify(formData.slug.trim()) || slugify(formData.name.trim()) || `ornament-${Date.now()}`

    const payload = {
      name: formData.name.trim(),
      itemCode: formData.itemCode.trim().toUpperCase() || undefined,
      slug: finalSlug,
      shortDescription: formData.shortDescription || undefined,
      description: formData.description || undefined,
      categoryId: formData.categoryId,
      mode: 'rental' as const,
      salePrice: formData.salePrice ? formData.salePrice : undefined,
      rentalPrice: formData.rentalPrice ? formData.rentalPrice : undefined,
      rentalDurationDays: formData.rentalDurationDays || undefined,
      depositAmount: formData.depositAmount ? formData.depositAmount : undefined,
      stockQuantity: Number(formData.stockQuantity) >= 0 ? Number(formData.stockQuantity) : 1,
      availability: formData.availability as any,
      isFeatured: formData.isFeatured,
      isPublished: formData.isActive,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      careInstructions: formData.careInstructions || undefined,
      images: images.filter(img => Boolean(img.url.trim())).map((img, idx) => ({
        url: img.url.trim(),
        altText: img.altText || formData.name,
        isPrimary: idx === mainImageIndex,
        displayOrder: idx,
      })),
    }

    if (isEditing) {
      updateMutation.mutate({ id: id!, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleImageUrlChange = (index: number, url: string) => {
    const newImages = [...images]
    newImages[index] = { ...newImages[index], url }
    setImages(newImages)
  }

  const addImage = () => {
    setImages([...images, { url: '', altText: '', isPrimary: images.length === 0, displayOrder: images.length }])
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
    if (mainImageIndex === index) {
      setMainImageIndex(0)
    } else if (mainImageIndex > index) {
      setMainImageIndex(mainImageIndex - 1)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/products')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">
              {isEditing ? 'Edit Rental Ornament' : 'Add Rental Ornament'}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              Configure ornament details, unique item code, and images
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/products')}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update' : 'Save'} Ornament
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Basic Info */}
        <Card className="card-sheaura">
          <CardHeader>
            <CardTitle className="font-display text-lg">Ornament Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium mb-1">Ornament Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g., Antique Temple Bridal Set"
                  required
                />
              </div>

              <div>
                <Label htmlFor="itemCode" className="block text-sm font-medium mb-1">Item Reference Code</Label>
                <Input
                  id="itemCode"
                  value={formData.itemCode}
                  onChange={(e) => setFormData({ ...formData, itemCode: e.target.value.toUpperCase() })}
                  placeholder="e.g., BRD-001"
                  className="font-mono uppercase"
                />
                <p className="text-xs text-muted-foreground mt-1">Used in WhatsApp enquiries (auto-generated if empty)</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="slug" className="block text-sm font-medium">Slug *</Label>
                  <button
                    type="button"
                    onClick={handleRegenerateSlug}
                    className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 flex items-center gap-1 font-medium cursor-pointer"
                    title="Auto-generate slug from ornament name"
                  >
                    <Wand2 className="h-3 w-3" />
                    <span>Auto-generate</span>
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={handleSlugChange}
                    placeholder="auto-generated from name"
                    className="font-mono text-xs pr-8"
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateSlug}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-amber-700 p-0.5"
                    title="Sync with name"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  URL: <span className="font-mono text-foreground font-semibold">/product/{formData.slug || 'slug-preview'}</span>
                </p>
              </div>
            </div>

            {/* Visual Catalogue / Collection Selector */}
            <div className="p-4 sm:p-5 rounded-xl bg-muted/30 border border-border/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                <div>
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <FolderCheck className="h-4 w-4 text-amber-600" />
                    <span>Select Rental Catalogue *</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose which rental collection this ornament belongs to for customer browsing.
                  </p>
                </div>
                <Link
                  to="/admin/categories"
                  target="_blank"
                  className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <Plus className="h-3 w-3" />
                  <span>New Catalogue</span>
                </Link>
              </div>

              {/* Visual Catalogue Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                {categories?.items?.map((cat) => {
                  const isSelected = formData.categoryId === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, categoryId: cat.id })}
                      className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-amber-600 bg-amber-500/10 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-border/80 bg-background hover:bg-accent/50 hover:border-border text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-sm font-medium ${isSelected ? 'text-amber-900 dark:text-amber-200 font-semibold' : 'text-foreground'}`}>
                          {cat.name}
                        </span>
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-border/80 shrink-0" />
                        )}
                      </div>
                      {cat.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1">
                          {cat.description}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Quick Dropdown Alternative */}
              <div className="pt-2">
                <Label htmlFor="categoryId" className="text-xs text-muted-foreground block mb-1">
                  Or select catalogue from list:
                </Label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                  <SelectTrigger id="categoryId" className="bg-background">
                    <SelectValue placeholder="Choose catalogue collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.items?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="stockQuantity" className="block text-sm font-medium mb-1">
                  Stock Quantity (Available) *
                </Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value, 10) || 0
                    setFormData({
                      ...formData,
                      stockQuantity: qty,
                      availability: qty === 0 ? 'out_of_stock' : (formData.availability === 'out_of_stock' ? 'available' : formData.availability),
                    })
                  }}
                  className="font-mono"
                  placeholder="1"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Number of rental pieces currently in store.
                </p>
              </div>

              <div>
                <Label htmlFor="availability" className="block text-sm font-medium mb-1">Availability Status *</Label>
                <Select value={formData.availability} onValueChange={(v) => setFormData({ ...formData, availability: v })}>
                  <SelectTrigger id="availability">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Auto-updated to Out of Stock on booking.
                </p>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-1">Service Classification</Label>
                <div className="p-2.5 rounded-lg border border-border/70 bg-muted/20 text-xs text-muted-foreground flex items-center gap-1.5 h-10">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span><strong className="text-foreground">Rental Ornament</strong></span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Enquiry-only on WhatsApp.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="shortDescription" className="block text-sm font-medium mb-1">Short Description</Label>
              <Textarea
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Brief description for catalogue cards"
                rows={2}
                maxLength={300}
              />
            </div>

            <div>
              <Label htmlFor="description" className="block text-sm font-medium mb-1">Full Description / Styling Details</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of craftsmanship, occasion recommendation, and styling advice"
                rows={5}
              />
            </div>

            <div>
              <Label htmlFor="careInstructions" className="block text-sm font-medium mb-1">Care & Handling Notes</Label>
              <Textarea
                id="careInstructions"
                value={formData.careInstructions}
                onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                placeholder="Guidelines for clients (e.g. keep away from water, perfumes, return in original box)"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card className="card-sheaura">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Ornament Images</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addImage}>
              <Plus className="h-4 w-4 mr-2" />
              Add Image URL
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {images.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No images added yet.</p>
                <Button type="button" variant="link" size="sm" onClick={addImage}>
                  Add first image URL
                </Button>
              </div>
            ) : (
              images.map((img, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card">
                  <div className="w-14 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {img.url ? (
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Empty</div>
                    )}
                  </div>
                  <Input
                    placeholder="https://... or /api/media/:id"
                    value={img.url}
                    onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                    className="flex-1 text-xs"
                  />
                  <Button
                    type="button"
                    variant={idx === mainImageIndex ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs shrink-0"
                    onClick={() => setMainImageIndex(idx)}
                  >
                    {idx === mainImageIndex ? 'Primary' : 'Make Primary'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive shrink-0"
                    onClick={() => removeImage(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Publishing & Visibility */}
        <Card className="card-sheaura">
          <CardHeader>
            <CardTitle className="font-display text-lg">Visibility & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive" className="text-sm font-medium">Published on Public Catalogue</Label>
                <p className="text-xs text-muted-foreground">When disabled, this piece is hidden from public visitors</p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isFeatured" className="text-sm font-medium">Featured Piece</Label>
                <p className="text-xs text-muted-foreground">Highlight this ornament on the homepage featured section</p>
              </div>
              <Switch
                id="isFeatured"
                checked={formData.isFeatured}
                onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}