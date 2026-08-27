import { useState } from 'react'
import { Save, Loader2, RefreshCw, Globe, Mail, Shield, Truck, CreditCard, Settings } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

const SETTING_GROUPS = {
  brand: {
    label: 'Brand',
    icon: Globe,
    fields: [
      { key: 'brandName', label: 'Brand Name', type: 'text', placeholder: 'Sheaura' },
      { key: 'brandTagline', label: 'Brand Tagline', type: 'text', placeholder: 'Timeless Elegance, Curated for You' },
      { key: 'heroTitle', label: 'Hero Title', type: 'text', placeholder: 'Discover Exquisite Jewellery & Cosmetics' },
      { key: 'heroSubtitle', label: 'Hero Subtitle', type: 'textarea', placeholder: 'Curated collections of premium jewellery, cosmetics, and ornaments available for purchase or rental.' },
    ],
  },
  contact: {
    label: 'Contact Information',
    icon: Mail,
    fields: [
      { key: 'email', label: 'Email', type: 'email', placeholder: 'hello@sheaura.com' },
      { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 98765 43210' },
      { key: 'whatsapp', label: 'WhatsApp Number', type: 'tel', placeholder: '+91 98765 43210' },
      { key: 'instagram', label: 'Instagram Handle', type: 'text', placeholder: '@sheaura' },
      { key: 'address', label: 'Physical Address', type: 'textarea', placeholder: '123 Luxury Lane, Mumbai, Maharashtra 400001' },
    ],
  },
  localization: {
    label: 'Localization',
    icon: Globe,
    fields: [
      { key: 'currency', label: 'Currency Code', type: 'text', placeholder: 'INR' },
      { key: 'country', label: 'Country Code', type: 'text', placeholder: 'IN' },
      { key: 'timezone', label: 'Timezone', type: 'text', placeholder: 'Asia/Kolkata' },
    ],
  },
  policies: {
    label: 'Policies',
    icon: Shield,
    fields: [
      { key: 'depositPolicy', label: 'Deposit Policy', type: 'textarea', placeholder: 'Refundable security deposit policy for rentals...' },
      { key: 'deliveryPolicy', label: 'Delivery Policy', type: 'textarea', placeholder: 'Pan-India delivery within 5-7 business days...' },
      { key: 'returnPolicy', label: 'Return Policy', type: 'textarea', placeholder: '14-day return policy for unused items...' },
      { key: 'rentalPolicy', label: 'Rental Policy', type: 'textarea', placeholder: 'Rental terms and conditions...' },
      { key: 'privacyPolicy', label: 'Privacy Policy', type: 'textarea', placeholder: 'Privacy policy content...' },
      { key: 'termsOfService', label: 'Terms of Service', type: 'textarea', placeholder: 'Terms of service content...' },
    ],
  },
  payment: {
    label: 'Payment',
    icon: CreditCard,
    fields: [
      { key: 'razorpayKeyId', label: 'Razorpay Key ID (Public)', type: 'text', placeholder: 'rzp_live_...' },
      { key: 'razorpayKeySecret', label: 'Razorpay Key Secret (Private)', type: 'password', placeholder: '••••••••' },
      { key: 'stripePublishableKey', label: 'Stripe Publishable Key', type: 'text', placeholder: 'pk_live_...' },
      { key: 'stripeSecretKey', label: 'Stripe Secret Key', type: 'password', placeholder: '••••••••' },
    ],
  },
  shipping: {
    label: 'Shipping',
    icon: Truck,
    fields: [
      { key: 'freeShippingThreshold', label: 'Free Shipping Threshold (₹)', type: 'number', placeholder: '50000' },
      { key: 'standardShippingCost', label: 'Standard Shipping Cost (₹)', type: 'number', placeholder: '299' },
      { key: 'expressShippingCost', label: 'Express Shipping Cost (₹)', type: 'number', placeholder: '599' },
      { key: 'codEnabled', label: 'Cash on Delivery Enabled', type: 'checkbox' },
    ],
  },
  seo: {
    label: 'SEO & Analytics',
    icon: Settings,
    fields: [
      { key: 'metaTitle', label: 'Default Meta Title', type: 'text', placeholder: 'Sheaura - Premium Jewellery & Cosmetics' },
      { key: 'metaDescription', label: 'Default Meta Description', type: 'textarea', placeholder: 'Discover exquisite jewellery, premium cosmetics, and ornaments for sale or rent.' },
      { key: 'googleAnalyticsId', label: 'Google Analytics ID', type: 'text', placeholder: 'G-XXXXXXXXXX' },
      { key: 'facebookPixelId', label: 'Facebook Pixel ID', type: 'text', placeholder: '1234567890' },
    ],
  },
  social: {
    label: 'Social Login',
    icon: Globe,
    fields: [
      { key: 'googleClientId', label: 'Google Client ID', type: 'text', placeholder: 'xxx.apps.googleusercontent.com' },
      { key: 'googleClientSecret', label: 'Google Client Secret', type: 'password', placeholder: '••••••••' },
      { key: 'facebookAppId', label: 'Facebook App ID', type: 'text', placeholder: '1234567890' },
      { key: 'facebookAppSecret', label: 'Facebook App Secret', type: 'password', placeholder: '••••••••' },
    ],
  },
}

type SettingGroupKey = keyof typeof SETTING_GROUPS

export function AdminSettingsPage() {
  const { data: settings, isLoading, refetch } = trpc.siteSettings.adminGetList.useQuery()

  const [activeTab, setActiveTab] = useState<SettingGroupKey>('brand')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bulkUpdateMutation = trpc.siteSettings.bulkUpdateSettings.useMutation({
    onSuccess: () => {
      toast.success('Settings saved successfully')
      refetch()
      setIsSubmitting(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save settings')
      setIsSubmitting(false)
    },
  })

  // Initialize form data from settings
  if (settings && Object.keys(formData).length === 0) {
    const initialData: Record<string, string> = {}
    settings.forEach((setting) => {
      initialData[setting.key] = setting.value || ''
    })
    setFormData(initialData)
  }

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const payload = Object.entries(formData).map(([key, value]) => ({ key, value }))
    bulkUpdateMutation.mutate(payload)
  }

  const resetForm = () => {
    if (settings) {
      const initialData: Record<string, string> = {}
      settings.forEach((setting) => {
        initialData[setting.key] = setting.value || ''
      })
      setFormData(initialData)
    }
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
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage site configuration and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Changes
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
                Save All Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingGroupKey)} className="w-full">
        <TabsList className="flex w-full overflow-x-auto gap-1 p-1">
          {(Object.keys(SETTING_GROUPS) as SettingGroupKey[]).map((groupKey) => {
            const group = SETTING_GROUPS[groupKey]
            return (
              <TabsTrigger key={groupKey} value={groupKey} className="gap-2 py-2 px-3 text-sm whitespace-nowrap flex-shrink-0">
                <group.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{group.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Tab Content */}
        {(Object.keys(SETTING_GROUPS) as SettingGroupKey[]).map((groupKey) => {
          const group = SETTING_GROUPS[groupKey]
          return (
            <TabsContent key={groupKey} value={groupKey} className="mt-6 animate-fade-in">
              <Card className="card-sheaura">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <group.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="font-display text-lg">{group.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {group.fields.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <Label htmlFor={field.key} className="block text-sm font-medium">
                        {field.label}
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          id={field.key}
                          value={formData[field.key] || ''}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          rows={4}
                          className="min-h-[100px]"
                        />
                      ) : field.type === 'checkbox' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={field.key}
                            checked={formData[field.key] === 'true'}
                            onChange={(e) => handleChange(field.key, e.target.checked ? 'true' : 'false')}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <Label htmlFor={field.key} className="cursor-pointer font-normal">
                            Enabled
                          </Label>
                        </div>
                      ) : (
                        <Input
                          id={field.key}
                          type={field.type}
                          value={formData[field.key] || ''}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className={cn(field.type === 'password' && 'font-mono')}
                        />
                      )}
                      {field.key === 'razorpayKeySecret' || field.key === 'stripeSecretKey' || field.key === 'googleClientSecret' || field.key === 'facebookAppSecret' ? (
                        <p className="text-xs text-muted-foreground">
                          Leave blank to keep current value. Stored securely in environment variables.
                        </p>
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border py-4 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset Changes
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving All Settings...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </form>
  )
}