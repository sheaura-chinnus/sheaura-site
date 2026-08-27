import { useState, useEffect } from 'react'
import { Save, Loader2, RefreshCw, Globe, Mail, Bell, BookOpen, Sparkles } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'react-hot-toast'

export function AdminSettingsPage() {
  const { data: settings, isLoading, refetch } = useSiteSettings()

  const [activeTab, setActiveTab] = useState<'brand' | 'contact' | 'announcement' | 'story'>('brand')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (settings) {
      setFormData({
        brandName: settings.brandName || 'Sheaura',
        brandTagline: settings.brandTagline || '',

        contactEmail: settings.contactEmail || '',
        contactPhone: settings.contactPhone || '',
        whatsappNumber: settings.whatsappNumber || '',
        locationServiceArea: settings.locationServiceArea || '',
        businessHours: settings.businessHours || '',

        aboutStory: settings.aboutStory || '',

        announcementEnabled: settings.announcementEnabled || 'false',
        announcementText: settings.announcementText || '',
        announcementCtaLabel: settings.announcementCtaLabel || '',
        announcementCtaLink: settings.announcementCtaLink || '',
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
      toast.success('Site settings saved successfully!')
      setHasChanges(false)
      setIsSubmitting(false)
      refetch()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save site settings')
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
        brandName: settings.brandName || 'Sheaura',
        brandTagline: settings.brandTagline || '',

        contactEmail: settings.contactEmail || '',
        contactPhone: settings.contactPhone || '',
        whatsappNumber: settings.whatsappNumber || '',
        locationServiceArea: settings.locationServiceArea || '',
        businessHours: settings.businessHours || '',

        aboutStory: settings.aboutStory || '',

        announcementEnabled: settings.announcementEnabled || 'false',
        announcementText: settings.announcementText || '',
        announcementCtaLabel: settings.announcementCtaLabel || '',
        announcementCtaLink: settings.announcementCtaLink || '',
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">General Site Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your store brand identity, contact information, customer announcement banner, and brand story.
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
          <span>You have unsaved changes. Click &ldquo;Save Settings&rdquo; to apply them to your store.</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="flex w-full overflow-x-auto gap-1 p-1">
          <TabsTrigger value="brand" className="gap-2 py-2 px-3 text-xs sm:text-sm whitespace-nowrap">
            <Globe className="h-4 w-4" />
            <span>Brand Identity</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-2 py-2 px-3 text-xs sm:text-sm whitespace-nowrap">
            <Mail className="h-4 w-4" />
            <span>Contact & Support</span>
          </TabsTrigger>
          <TabsTrigger value="announcement" className="gap-2 py-2 px-3 text-xs sm:text-sm whitespace-nowrap">
            <Bell className="h-4 w-4" />
            <span>Announcement Banner</span>
          </TabsTrigger>
          <TabsTrigger value="story" className="gap-2 py-2 px-3 text-xs sm:text-sm whitespace-nowrap">
            <BookOpen className="h-4 w-4" />
            <span>About Story</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Brand */}
        <TabsContent value="brand" className="mt-6 animate-fade-in">
          <Card className="card-sheaura">
            <CardHeader>
              <CardTitle className="font-display text-lg">Store Brand Identity</CardTitle>
              <CardDescription>
                Basic store information shown in the browser title, header, and search results.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="brandName">Brand Display Name</Label>
                <Input
                  id="brandName"
                  value={formData.brandName || ''}
                  onChange={(e) => handleFieldChange('brandName', e.target.value)}
                  placeholder="Sheaura"
                  maxLength={100}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="brandTagline">Brand Tagline</Label>
                <Input
                  id="brandTagline"
                  value={formData.brandTagline || ''}
                  onChange={(e) => handleFieldChange('brandTagline', e.target.value)}
                  placeholder="Exquisite Imitation Jewellery, Cosmetics & Occasion Rental Ornaments"
                  maxLength={255}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Contact */}
        <TabsContent value="contact" className="mt-6 animate-fade-in">
          <Card className="card-sheaura">
            <CardHeader>
              <CardTitle className="font-display text-lg">Customer Contact Details</CardTitle>
              <CardDescription>
                Official contact details displayed on the Contact page, footer, and enquiry confirmations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail">Official Support Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
                    placeholder="hello@sheaura.com"
                    maxLength={255}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactPhone">Phone Number</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone || ''}
                    onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
                    placeholder="+91 98765 43210"
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="whatsappNumber">WhatsApp Business Number</Label>
                  <Input
                    id="whatsappNumber"
                    type="tel"
                    value={formData.whatsappNumber || ''}
                    onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
                    placeholder="+91 98765 43210"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="businessHours">Business Hours</Label>
                  <Input
                    id="businessHours"
                    value={formData.businessHours || ''}
                    onChange={(e) => handleFieldChange('businessHours', e.target.value)}
                    placeholder="Mon - Sat: 10:00 AM - 8:00 PM IST"
                    maxLength={255}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="locationServiceArea">Location & Service Area</Label>
                <Input
                  id="locationServiceArea"
                  value={formData.locationServiceArea || ''}
                  onChange={(e) => handleFieldChange('locationServiceArea', e.target.value)}
                  placeholder="Mumbai, Maharashtra & Pan-India Service"
                  maxLength={255}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Announcement Banner */}
        <TabsContent value="announcement" className="mt-6 animate-fade-in">
          <Card className="card-sheaura">
            <CardHeader>
              <CardTitle className="font-display text-lg">Top Announcement Banner</CardTitle>
              <CardDescription>
                Promote upcoming bridal pop-ups, festive discounts, or shipping notices at the top of the screen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border">
                <div className="space-y-0.5">
                  <Label htmlFor="announcementSwitch" className="text-sm font-semibold cursor-pointer">
                    Enable Top Announcement Banner
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Display banner at the very top of all pages above the main navigation.
                  </p>
                </div>
                <Switch
                  id="announcementSwitch"
                  checked={formData.announcementEnabled === 'true'}
                  onCheckedChange={(checked) => handleFieldChange('announcementEnabled', checked ? 'true' : 'false')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="announcementText">Banner Text</Label>
                <Input
                  id="announcementText"
                  value={formData.announcementText || ''}
                  onChange={(e) => handleFieldChange('announcementText', e.target.value)}
                  placeholder="e.g. Complimentary insured shipping on all orders over ₹2,000"
                  maxLength={255}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="announcementCtaLabel">Optional Action Link Label</Label>
                  <Input
                    id="announcementCtaLabel"
                    value={formData.announcementCtaLabel || ''}
                    onChange={(e) => handleFieldChange('announcementCtaLabel', e.target.value)}
                    placeholder="Explore Now"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="announcementCtaLink">Action Link URL / Route</Label>
                  <Input
                    id="announcementCtaLink"
                    value={formData.announcementCtaLink || ''}
                    onChange={(e) => handleFieldChange('announcementCtaLink', e.target.value)}
                    placeholder="/shop"
                    maxLength={200}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: About Story */}
        <TabsContent value="story" className="mt-6 animate-fade-in">
          <Card className="card-sheaura">
            <CardHeader>
              <CardTitle className="font-display text-lg">About & Brand Story</CardTitle>
              <CardDescription>
                The story and craftsmanship philosophy displayed on the customer About page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="aboutStory">Brand Story (Plain text)</Label>
                <Textarea
                  id="aboutStory"
                  value={formData.aboutStory || ''}
                  onChange={(e) => handleFieldChange('aboutStory', e.target.value)}
                  placeholder="Share the story behind Sheaura's imitation jewellery and occasion collections..."
                  rows={8}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground">
                  Limit: 5,000 characters. Scripts and HTML are sanitized automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Bar */}
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
              Saving Settings...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </form>
  )
}