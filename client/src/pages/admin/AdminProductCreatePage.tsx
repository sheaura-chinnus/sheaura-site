import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Plus, Trash2, Eye } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

const MODE_OPTIONS = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rental', label: 'For Rental' },
  { value: 'both', label: 'Sale & Rental' },
]

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'discontinued', label: 'Discontinued' },
]

export function AdminProductCreatePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id

  const { data: categories } = trpc.categories.adminGetList.useQuery({ limit: 100 })
  // const { data: product } = trpc.products.adminGetById.useQuery({ id: id || '' }, { enabled: isEditing }) // TODO: populate form when editing

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<Array<{ url: string; altText: string; isPrimary: boolean; displayOrder: number }>>([])
  const [mainImageIndex, setMainImageIndex] = useState(0)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    shortDescription: '',
    description: '',
    categoryId: '',
    mode: 'sale' as 'sale' | 'rental' | 'both',
    salePrice: '',
    rentalPrice: '',
    rentalDurationDays: 7,
    depositAmount: '',
    availability: 'available' as string,
    isFeatured: false,
    isActive: true,
    tags: '',
    careInstructions: '',
    materials: '',
    dimensions: '',
    weight: '',
  })

  // Load product data when editing
  // Note: In a real app, you'd use useEffect to populate formData from product data

  const createMutation = trpc.products.createProduct.useMutation({
    onSuccess: () => {
      toast.success(isEditing ? 'Product updated successfully' : 'Product created successfully')
      navigate('/admin/products')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save product')
    },
  })

  const updateMutation = trpc.products.updateProduct.useMutation({
    onSuccess: () => {
      toast.success('Product updated successfully')
      navigate('/admin/products')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update product')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Product name is required')
      return
    }
    if (!formData.categoryId) {
      toast.error('Category is required')
      return
    }
    if (formData.mode === 'sale' || formData.mode === 'both') {
      if (!formData.salePrice || parseFloat(formData.salePrice) <= 0) {
        toast.error('Valid sale price is required for sale mode')
        return
      }
    }
    if (formData.mode === 'rental' || formData.mode === 'both') {
      if (!formData.rentalPrice || parseFloat(formData.rentalPrice) <= 0) {
        toast.error('Valid rental price is required for rental mode')
        return
      }
    }

    setIsSubmitting(true)

    const payload = {
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      shortDescription: formData.shortDescription || undefined,
      description: formData.description || undefined,
      categoryId: formData.categoryId,
      mode: formData.mode,
      salePrice: (formData.mode === 'sale' || formData.mode === 'both') ? formData.salePrice : undefined,
      rentalPrice: (formData.mode === 'rental' || formData.mode === 'both') ? formData.rentalPrice : undefined,
      rentalDurationDays: formData.rentalDurationDays || undefined,
      depositAmount: formData.depositAmount ? formData.depositAmount : undefined,
      availability: formData.availability as any,
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      careInstructions: formData.careInstructions || undefined,
      materials: formData.materials || undefined,
      dimensions: formData.dimensions || undefined,
      weight: formData.weight || undefined,
      images: images.map((img, idx) => ({
        url: img.url,
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

  const setPrimaryImage = (index: number) => {
    setMainImageIndex(index)
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
            <h1 className="font-display text-3xl font-medium text-foreground">
              {isEditing ? 'Edit Product' : 'Create Product'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditing ? 'Update product details' : 'Add a new product to your catalogue'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update' : 'Create'} Product
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Basic Info */}
        <Card className="card-sheaura">
          <CardHeader>
            <CardTitle className="font-display text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium mb-1">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Diamond Solitaire Necklace"
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug" className="block text-sm font-medium mb-1">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="auto-generated from name"
                />
                <p className="text-xs text-muted-foreground mt-1">URL-friendly identifier (auto-generated if empty)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="categoryId" className="block text-sm font-medium mb-1">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.items?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mode" className="block text-sm font-medium mb-1">Mode *</Label>
                <Select value={formData.mode} onValueChange={(v) => setFormData({ ...formData, mode: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="shortDescription" className="block text-sm font-medium mb-1">Short Description</Label>
              <Textarea
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Brief description for product cards (max 200 chars)"
                rows={3}
                maxLength={200}
              />
            </div>

            <div>
              <Label htmlFor="description" className="block text-sm font-medium mb-1">Full Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed product description for product page"
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="card-sheaura">
          <CardHeader>
            <CardTitle className="font-display text-lg">Pricing & Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {(formData.mode === 'sale' || formData.mode === 'both') && (
                <div>
                  <Label htmlFor="salePrice" className="block text-sm font-medium mb-1">Sale Price (₹) *</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              )}

              {(formData.mode === 'rental' || formData.mode === 'both') && (
                <div>
                  <Label htmlFor="rentalPrice" className="block text-sm font-medium mb-1">Rental Price (₹) *</Label>
                  <Input
                    id="rentalPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.rentalPrice}
                    onChange={(e) => setFormData({ ...formData, rentalPrice: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              )}

              {(formData.mode === 'rental' || formData.mode === 'both') && (
                <div>
                  <Label htmlFor="rentalDurationDays" className="block text-sm font-medium mb-1">Rental Duration (days)</Label>
                  <Input
                    id="rentalDurationDays"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.rentalDurationDays}
                    onChange={(e) => setFormData({ ...formData, rentalDurationDays: parseInt(e.target.value) || 7 })}
                    placeholder="7"
                  />
                </div>
              )}

              {(formData.mode === 'rental' || formData.mode === 'both') && (
                <div>
                  <Label htmlFor="depositAmount" className="block text-sm font-medium mb-1">Deposit Amount (₹)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.depositAmount}
                    onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Refundable security deposit</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="availability" className="block text-sm font-medium mb-1">Availability *</Label>
                <Select value={formData.availability} onValueChange={(v) => setFormData({ ...formData, availability: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card className="card-sheaura">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Product Images</CardTitle>
            <Button variant="outline" size="sm" onClick={addImage}>
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </CardHeader>
          <CardContent>
            {images.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-4">No images added yet</p>
                <Button variant="outline" onClick={addImage}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Image
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group border border-border rounded-lg overflow-hidden">
                    {image.url ? (
                      <img src={image.url} alt={image.altText} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-muted/50 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <input
                        type="url"
                        value={image.url}
                        onChange={(e) => handleImageUrlChange(index, e.target.value)}
                        placeholder="Image URL"
                        className="w-full px-2 py-1 text-sm bg-background/90 rounded"
                      />
                    </div>
                    <div className="absolute top-1 right-1 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(index)}
                        className={cn(
                          'p-1.5 rounded-full transition-colors',
                          mainImageIndex === index
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background/90 hover:bg-accent'
                        )}
                        title={mainImageIndex === index ? 'Primary image' : 'Set as primary'}
                      >
                        <span className="text-xs font-bold">{mainImageIndex === index ? '★' : '☆'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-1.5 rounded-full bg-background/90 hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Remove image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {mainImageIndex === index && (
                      <Badge variant="secondary" className="absolute bottom-1 left-1 gap-1">
                        <Eye className="h-2.5 w-2.5" />
                        Primary
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags & Details */}
        <Card className="card-sheaura">
          <CardHeader>
            <CardTitle className="font-display text-lg">Tags & Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="tags" className="block text-sm font-medium mb-1">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="diamond, gold, wedding, engagement"
              />
              <p className="text-xs text-muted-foreground mt-1">Used for filtering and search</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="materials" className="block text-sm font-medium mb-1">Materials</Label>
                <Input
                  id="materials"
                  value={formData.materials}
                  onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                  placeholder="18K Gold, VS1 Diamonds"
                />
              </div>
              <div>
                <Label htmlFor="dimensions" className="block text-sm font-medium mb-1">Dimensions</Label>
                <Input
                  id="dimensions"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  placeholder='Length: 18", Width: 2mm'
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="weight" className="block text-sm font-medium mb-1">Weight</Label>
                <Input
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="15.5 grams"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="careInstructions" className="block text-sm font-medium mb-1">Care Instructions</Label>
              <Textarea
                id="careInstructions"
                value={formData.careInstructions}
                onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                placeholder="Store in a cool, dry place. Avoid contact with chemicals..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="card-sheaura">
          <CardHeader>
            <CardTitle className="font-display text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Featured Product</p>
                <p className="text-sm text-muted-foreground">Show in featured section on homepage</p>
              </div>
              <Switch
                checked={formData.isFeatured}
                onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Active</p>
                <p className="text-sm text-muted-foreground">Visible on the storefront</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}