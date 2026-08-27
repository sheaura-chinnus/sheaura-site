import { useState, useEffect } from 'react'
import { Save, Loader2, RefreshCw, Eye, Layout, Type, Sparkles } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'react-hot-toast'

export function AdminHomepageContentPage() {
  const { data: settings, isLoading, refetch } = useSiteSettings()

  const [formData, setFormData] = useState<Record<string, string>>({})
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({
    hero: true,
    trustBadges: true,
    categories: true,
    featuredProducts: true,
    rentalProcess: true,
    cta: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Populate form data once settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        heroEyebrow: settings.heroEyebrow || '',
        heroHeading: settings.heroHeading || '',
        heroSupportingText: settings.heroSupportingText || '',
        heroPrimaryCtaLabel: settings.heroPrimaryCtaLabel || '',
        heroPrimaryCtaLink: settings.heroPrimaryCtaLink || '',
        heroSecondaryCtaLabel: settings.heroSecondaryCtaLabel || '',
        heroSecondaryCtaLink: settings.heroSecondaryCtaLink || '',

        sectionRentalOrnamentsTitle: settings.sectionRentalOrnamentsTitle || '',
        sectionRentalOrnamentsDesc: settings.sectionRentalOrnamentsDesc || '',
        sectionSaleProductsTitle: settings.sectionSaleProductsTitle || '',
        sectionSaleProductsDesc: settings.sectionSaleProductsDesc || '',
        sectionCosmeticsTitle: settings.sectionCosmeticsTitle || '',
        sectionCosmeticsDesc: settings.sectionCosmeticsDesc || '',
        sectionOccasionItemsTitle: settings.sectionOccasionItemsTitle || '',
        sectionOccasionItemsDesc: settings.sectionOccasionItemsDesc || '',
      })

      if (settings.homepageSectionVisibility) {
        try {
          const parsed = JSON.parse(settings.homepageSectionVisibility)
          setSectionVisibility((prev) => ({ ...prev, ...parsed }))
        } catch {
          // ignore parse error
        }
      }
      setHasChanges(false)
    }
  }, [settings])

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleVisibilityToggle = (sectionKey: string, enabled: boolean) => {
    setSectionVisibility((prev) => ({ ...prev, [sectionKey]: enabled }))
    setHasChanges(true)
  }

  const bulkUpdateMutation = trpc.siteSettings.bulkUpdateSettings.useMutation({
    onSuccess: () => {
      toast.success('Homepage content saved successfully!')
      setHasChanges(false)
      setIsSubmitting(false)
      refetch()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save homepage content')
      setIsSubmitting(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const payload = [
      ...Object.entries(formData).map(([key, value]) => ({ key, value: value.trim() })),
      { key: 'homepageSectionVisibility', value: JSON.stringify(sectionVisibility) },
    ]

    bulkUpdateMutation.mutate(payload)
  }

  const handleReset = () => {
    if (settings) {
      setFormData({
        heroEyebrow: settings.heroEyebrow || '',
        heroHeading: settings.heroHeading || '',
        heroSupportingText: settings.heroSupportingText || '',
        heroPrimaryCtaLabel: settings.heroPrimaryCtaLabel || '',
        heroPrimaryCtaLink: settings.heroPrimaryCtaLink || '',
        heroSecondaryCtaLabel: settings.heroSecondaryCtaLabel || '',
        heroSecondaryCtaLink: settings.heroSecondaryCtaLink || '',

        sectionRentalOrnamentsTitle: settings.sectionRentalOrnamentsTitle || '',
        sectionRentalOrnamentsDesc: settings.sectionRentalOrnamentsDesc || '',
        sectionSaleProductsTitle: settings.sectionSaleProductsTitle || '',
        sectionSaleProductsDesc: settings.sectionSaleProductsDesc || '',
        sectionCosmeticsTitle: settings.sectionCosmeticsTitle || '',
        sectionCosmeticsDesc: settings.sectionCosmeticsDesc || '',
        sectionOccasionItemsTitle: settings.sectionOccasionItemsTitle || '',
        sectionOccasionItemsDesc: settings.sectionOccasionItemsDesc || '',
      })
      setHasChanges(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted w-64 rounded" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">Homepage Content Editor</h1>
          <p className="text-muted-foreground mt-1">
            Customize the headlines, text, buttons, and section visibility displayed on the customer landing page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isSubmitting}
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Reset
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !hasChanges}
            size="sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-lg p-3 text-xs flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>You have unsaved changes. Remember to click &ldquo;Save Changes&rdquo; to publish updates to the live site.</span>
        </div>
      )}

      {/* 1. Hero Section Content */}
      <Card className="card-sheaura">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Type className="h-5 w-5 text-primary" />
            <span>Hero Headline & Introduction</span>
          </CardTitle>
          <CardDescription>
            The primary banner message visitors see when they open the website.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="heroEyebrow">Hero Badge / Eyebrow Text</Label>
            <Input
              id="heroEyebrow"
              value={formData.heroEyebrow || ''}
              onChange={(e) => handleFieldChange('heroEyebrow', e.target.value)}
              placeholder="e.g. New Occasion & Festive Collection"
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="heroHeading">Main Hero Heading</Label>
            <Input
              id="heroHeading"
              value={formData.heroHeading || ''}
              onChange={(e) => handleFieldChange('heroHeading', e.target.value)}
              placeholder="e.g. Timeless Elegance with Curated Imitation Jewellery & Rental Ornaments"
              maxLength={255}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="heroSupportingText">Hero Supporting Paragraph</Label>
            <Textarea
              id="heroSupportingText"
              value={formData.heroSupportingText || ''}
              onChange={(e) => handleFieldChange('heroSupportingText', e.target.value)}
              placeholder="Describe your collections of imitation jewellery, cosmetics, and occasion rental ornaments..."
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="heroPrimaryCtaLabel">Primary Button Label</Label>
              <Input
                id="heroPrimaryCtaLabel"
                value={formData.heroPrimaryCtaLabel || ''}
                onChange={(e) => handleFieldChange('heroPrimaryCtaLabel', e.target.value)}
                placeholder="Shop Collection"
                maxLength={50}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="heroPrimaryCtaLink">Primary Button Link</Label>
              <Input
                id="heroPrimaryCtaLink"
                value={formData.heroPrimaryCtaLink || ''}
                onChange={(e) => handleFieldChange('heroPrimaryCtaLink', e.target.value)}
                placeholder="/shop"
                maxLength={200}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="heroSecondaryCtaLabel">Secondary Button Label</Label>
              <Input
                id="heroSecondaryCtaLabel"
                value={formData.heroSecondaryCtaLabel || ''}
                onChange={(e) => handleFieldChange('heroSecondaryCtaLabel', e.target.value)}
                placeholder="Rental Ornaments"
                maxLength={50}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="heroSecondaryCtaLink">Secondary Button Link</Label>
              <Input
                id="heroSecondaryCtaLink"
                value={formData.heroSecondaryCtaLink || ''}
                onChange={(e) => handleFieldChange('heroSecondaryCtaLink', e.target.value)}
                placeholder="/rental-ornaments"
                maxLength={200}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Homepage Section Visibility */}
      <Card className="card-sheaura">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <span>Section Visibility Control</span>
          </CardTitle>
          <CardDescription>
            Toggle individual homepage sections on or off using safe allowlisted options.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {[
            { key: 'hero', label: 'Hero Banner', desc: 'Main headline, badge, and primary action buttons' },
            { key: 'trustBadges', label: 'Trust & Value Badges', desc: 'Craftsmanship, delivery, styling, and support promises' },
            { key: 'categories', label: 'Explore by Category Grid', desc: 'Imitation jewellery, cosmetics, and ornaments category cards' },
            { key: 'featuredProducts', label: 'Featured Collection Showcase', desc: 'Grid of handpicked featured items from catalogue' },
            { key: 'rentalProcess', label: 'How Rental Works Guide', desc: '4-step guide explaining the rental reservation and return workflow' },
            { key: 'cta', label: 'Bottom Call to Action Banner', desc: 'Gradient banner encouraging catalogue browsing and enquiries' },
          ].map((sec) => (
            <div key={sec.key} className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{sec.label}</p>
                <p className="text-xs text-muted-foreground">{sec.desc}</p>
              </div>
              <Switch
                checked={sectionVisibility[sec.key] !== false}
                onCheckedChange={(checked) => handleVisibilityToggle(sec.key, checked)}
                aria-label={`Toggle ${sec.label}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 3. Section Titles & Descriptions */}
      <Card className="card-sheaura">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary" />
            <span>Section Headings & Copy</span>
          </CardTitle>
          <CardDescription>
            Customize headings for each major section to accurately represent your catalogue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rental ornaments section */}
          <div className="space-y-2 p-4 bg-muted/30 rounded-xl border border-border">
            <h3 className="text-sm font-semibold text-foreground">Rental Ornaments Section</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sectionRentalOrnamentsTitle" className="text-xs">Section Heading</Label>
                <Input
                  id="sectionRentalOrnamentsTitle"
                  value={formData.sectionRentalOrnamentsTitle || ''}
                  onChange={(e) => handleFieldChange('sectionRentalOrnamentsTitle', e.target.value)}
                  placeholder="Rental Ornaments"
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="sectionRentalOrnamentsDesc" className="text-xs">Supporting Description</Label>
                <Input
                  id="sectionRentalOrnamentsDesc"
                  value={formData.sectionRentalOrnamentsDesc || ''}
                  onChange={(e) => handleFieldChange('sectionRentalOrnamentsDesc', e.target.value)}
                  placeholder="Curated bridal and occasion ornaments for special celebrations"
                  maxLength={500}
                />
              </div>
            </div>
          </div>

          {/* Sale products section */}
          <div className="space-y-2 p-4 bg-muted/30 rounded-xl border border-border">
            <h3 className="text-sm font-semibold text-foreground">Fashion & Costume Jewellery Section</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sectionSaleProductsTitle" className="text-xs">Section Heading</Label>
                <Input
                  id="sectionSaleProductsTitle"
                  value={formData.sectionSaleProductsTitle || ''}
                  onChange={(e) => handleFieldChange('sectionSaleProductsTitle', e.target.value)}
                  placeholder="Fashion & Costume Jewellery"
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="sectionSaleProductsDesc" className="text-xs">Supporting Description</Label>
                <Input
                  id="sectionSaleProductsDesc"
                  value={formData.sectionSaleProductsDesc || ''}
                  onChange={(e) => handleFieldChange('sectionSaleProductsDesc', e.target.value)}
                  placeholder="Intricately designed imitation jewellery crafted for modern celebrations"
                  maxLength={500}
                />
              </div>
            </div>
          </div>

          {/* Cosmetics section */}
          <div className="space-y-2 p-4 bg-muted/30 rounded-xl border border-border">
            <h3 className="text-sm font-semibold text-foreground">Cosmetics & Beauty Section</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sectionCosmeticsTitle" className="text-xs">Section Heading</Label>
                <Input
                  id="sectionCosmeticsTitle"
                  value={formData.sectionCosmeticsTitle || ''}
                  onChange={(e) => handleFieldChange('sectionCosmeticsTitle', e.target.value)}
                  placeholder="Cosmetics & Beauty"
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="sectionCosmeticsDesc" className="text-xs">Supporting Description</Label>
                <Input
                  id="sectionCosmeticsDesc"
                  value={formData.sectionCosmeticsDesc || ''}
                  onChange={(e) => handleFieldChange('sectionCosmeticsDesc', e.target.value)}
                  placeholder="Curated beauty products and makeup essentials to enhance your radiance"
                  maxLength={500}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save bar */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border py-4 flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges || isSubmitting}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset Changes
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !hasChanges}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Homepage Content
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
