import { useState } from 'react'
import { Plus, Search, Edit, Trash2, GripVertical, ChevronUp, ChevronDown, Save, X, Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

export function AdminCategoriesPage() {
  const { data: categories, isLoading, refetch } = trpc.categories.list.useQuery({ limit: 100 })

  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    displayOrder: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success('Category created successfully')
      setIsCreating(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create category')
    },
  })

  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      toast.success('Category updated successfully')
      setEditingId(null)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update category')
    },
  })

  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      toast.success('Category deleted successfully')
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete category')
    },
  })

  const reorderMutation = trpc.categories.reorder.useMutation({
    onSuccess: () => {
      toast.success('Order updated')
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reorder')
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      displayOrder: categories?.length || 0,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Category name is required')
      return
    }

    setIsSubmitting(true)
    const payload = {
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: formData.description || undefined,
      imageUrl: formData.imageUrl || undefined,
      displayOrder: formData.displayOrder,
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const startEdit = (category: typeof categories[0]) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      displayOrder: category.displayOrder,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsCreating(false)
    resetForm()
  }

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate({ id })
    }
  }

  const moveUp = (category: typeof categories[0], index: number) => {
    if (index === 0) return
    const newOrder = [...(categories || [])]
    const [moved] = newOrder.splice(index, 1)
    newOrder.splice(index - 1, 0, moved)
    reorderMutation.mutate({ categories: newOrder.map((c, i) => ({ id: c.id, displayOrder: i })) })
  }

  const moveDown = (category: typeof categories[0], index: number) => {
    if (!categories || index === categories.length - 1) return
    const newOrder = [...categories]
    const [moved] = newOrder.splice(index, 1)
    newOrder.splice(index + 1, 0, moved)
    reorderMutation.mutate({ categories: newOrder.map((c, i) => ({ id: c.id, displayOrder: i })) })
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
          <h1 className="font-display text-3xl font-medium text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-1">Manage product categories and display order</p>
        </div>
        <Button onClick={() => { setIsCreating(true); setEditingId(null); resetForm(); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card className="card-sheaura">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">
              {editingId ? 'Edit Category' : 'Create Category'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={cancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="block text-sm font-medium mb-1">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Jewellery"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug" className="block text-sm font-medium mb-1">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="block text-sm font-medium mb-1">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Category description for customers"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="imageUrl" className="block text-sm font-medium mb-1">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="displayOrder" className="block text-sm font-medium mb-1">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingId ? 'Update' : 'Create'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <Card className="card-sheaura">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full" role="grid">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-48">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories?.map((category, index) => (
                  <tr key={category.id} className={cn('transition-colors', editingId === category.id && 'bg-primary/5')}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground w-8 text-center">{category.displayOrder + 1}</span>
                        <div className="flex flex-col">
                          <button
                            onClick={() => moveUp(category, index)}
                            disabled={index === 0 || isSubmitting}
                            className="p-1 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Move up"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => moveDown(category, index)}
                            disabled={!categories || index === categories.length - 1 || isSubmitting}
                            className="p-1 rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Move down"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === category.id ? (
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-48"
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium text-foreground">{category.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell max-w-xs">
                      {editingId === category.id ? (
                        <Input
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="max-w-xs"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground truncate max-w-xs">{category.description || '—'}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {category.imageUrl ? (
                        <img src={category.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <span className="text-xs text-muted-foreground">No image</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{category.slug}</td>
                    <td className="px-6 py-4 text-right">
                      {editingId === category.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={cancelEdit} disabled={isSubmitting}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
                            <Save className="h-3.5 w-3.5 mr-1.5" />
                            Save
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => startEdit(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(category.id, category.name)} disabled={deleteMutation.isPending}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!categories || categories.length === 0) && (
            <div className="p-12 text-center">
              <svg className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 className="text-lg font-medium text-foreground mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4">Create your first category to organize products.</p>
              <Button onClick={() => { setIsCreating(true); setEditingId(null); resetForm(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}