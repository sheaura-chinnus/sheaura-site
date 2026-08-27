import { useState, useEffect } from 'react'
import { Save, Loader2, RefreshCw, Navigation, Compass, Search, Sparkles } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'

export function AdminNavigationFooterPage() {
  const { data: settings, isLoading, refetch } = useSiteSettings()

  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (settings) {
      setFormData({
        navRentalOrnamentsLabel: settings.navRentalOrnamentsLabel || 'Rental Ornaments',
        footerText: settings.footerText || '',
        copyrightText: settings.copyrightText || '',
        instagramUrl: settings.instagramUrl || '',
        facebookUrl: settings.facebookUrl || '',
        twitterUrl: settings.twitterUrl || '',
        seoMetaTitle: settings.seoMetaTitle || '',
        seoMetaDescription: settings.seoMetaDescription || '',
        seoSocialPreviewText: settings.seoSocialPreviewText || '',
      })
      setHasChanges(false)
    }
  }, [settings])

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const bulkUpdateMutation = trpc.siteSettings.bulkUpdateSettings.useMutation({
    onSuccess: () => {
      toast.success('Navigation, Footer & SEO settings saved!')
      setHasChanges(false)
      setIsSubmitting(false)
      refetch()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save settings')
      setIsSubmitting(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const payload = Object.entries(formData).map(([key, value]) => ({
      key,
      value: value.trim(),
    }))

    bulkUpdateMutation.mutate(payload)
  }

  const handleReset = () => {
    if (settings) {
      setFormData({
        navRentalOrnamentsLabel: settings.navRentalOrnamentsLabel || 'Rental Ornaments',
        footerText: settings.footerText || '',
        copyrightText: settings.copyrightText || '',
        instagramUrl: settings.instagramUrl || '',
        facebookUrl: settings.facebookUrl || '',
        twitterUrl: settings.twitterUrl || '',
        seoMetaTitle: settings.seoMetaTitle || '',
        seoMetaDescription: settings.seoMetaDescription || '',
        seoSocialPreviewText: settings.seoSocialPreviewText || '',
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
          <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">Navigation, Footer & SEO</h1>
          <p className="text-muted-foreground mt-1">
            Configure menu labels, footer copyright and descriptions, social links, and search engine metadata.
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
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-lg p-3 text-xs flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>You have unsaved changes. Click &ldquo;Save Settings&rdquo; to update the live website.</span>
        </div>
      )}

      {/* 1. Navigation Menu Labels */}
      <Card className="card-sheaura">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <span>Navigation Menu Labels</span>
          </CardTitle>
          <CardDescription>
            Customize the wording shown in the top header and mobile three-bar menu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="navRentalOrnamentsLabel">Rental Catalogue Menu Label</Label>
            <Input
              id="navRentalOrnamentsLabel"
              value={formData.navRentalOrnamentsLabel || ''}
              onChange={(e) => handleFieldChange('navRentalOrnamentsLabel', e.target.value)}
              placeholder="Rental Ornaments"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              This replaces generic jewellery terminology in customer navigation to clearly represent rental ornaments.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Footer Content & Social */}
      <Card className="card-sheaura">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            <span>Footer Information & Social Links</span>
          </CardTitle>
          <CardDescription>
            The text, copyright notice, and social media profiles displayed at the bottom of every page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="footerText">Footer Tagline / Short Description</Label>
            <Textarea
              id="footerText"
              value={formData.footerText || ''}
              onChange={(e) => handleFieldChange('footerText', e.target.value)}
              placeholder="Timeless elegance for every occasion. Curated fashion & costume jewellery, premium cosmetics, and occasion rental ornaments."
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="copyrightText">Copyright Notice</Label>
            <Input
              id="copyrightText"
              value={formData.copyrightText || ''}
              onChange={(e) => handleFieldChange('copyrightText', e.target.value)}
              placeholder="© 2026 Sheaura. All rights reserved."
              maxLength={200}
            />
          </div>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="instagramUrl">Instagram Profile URL</Label>
              <Input
                id="instagramUrl"
                value={formData.instagramUrl || ''}
                onChange={(e) => handleFieldChange('instagramUrl', e.target.value)}
                placeholder="https://instagram.com/sheaura"
                maxLength={255}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="facebookUrl">Facebook Page URL</Label>
              <Input
                id="facebookUrl"
                value={formData.facebookUrl || ''}
                onChange={(e) => handleFieldChange('facebookUrl', e.target.value)}
                placeholder="https://facebook.com/sheaura"
                maxLength={255}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="twitterUrl">X (Twitter) URL</Label>
              <Input
                id="twitterUrl"
                value={formData.twitterUrl || ''}
                onChange={(e) => handleFieldChange('twitterUrl', e.target.value)}
                placeholder="https://x.com/sheaura"
                maxLength={255}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Search Engine Optimization (SEO) */}
      <Card className="card-sheaura">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <span>Search Engine Optimization (SEO)</span>
          </CardTitle>
          <CardDescription>
            Title and description tags used by Google, WhatsApp, and social networks for site previews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="seoMetaTitle">Default Browser Title (Meta Title)</Label>
            <Input
              id="seoMetaTitle"
              value={formData.seoMetaTitle || ''}
              onChange={(e) => handleFieldChange('seoMetaTitle', e.target.value)}
              placeholder="Sheaura — Imitation Jewellery, Cosmetics & Rental Ornaments"
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="seoMetaDescription">Search Engine Description (Meta Description)</Label>
            <Textarea
              id="seoMetaDescription"
              value={formData.seoMetaDescription || ''}
              onChange={(e) => handleFieldChange('seoMetaDescription', e.target.value)}
              placeholder="Shop exquisite imitation jewellery, premium cosmetics, and grand occasion rental ornaments at Sheaura."
              rows={2}
              maxLength={300}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="seoSocialPreviewText">Social Share Preview Text</Label>
            <Input
              id="seoSocialPreviewText"
              value={formData.seoSocialPreviewText || ''}
              onChange={(e) => handleFieldChange('seoSocialPreviewText', e.target.value)}
              placeholder="Timeless elegance: explore fashion jewellery, cosmetics, and rental ornaments."
              maxLength={300}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action bar */}
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
              Save Navigation & SEO
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
