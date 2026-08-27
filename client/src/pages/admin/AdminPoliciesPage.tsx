import { useState, useEffect } from 'react'
import { Save, Loader2, RefreshCw, Shield, Truck, CreditCard, RotateCcw, Lock, FileText, Sparkles } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'react-hot-toast'

const POLICY_TABS = [
  { key: 'rentalPolicyContent', label: 'Rental Policy', icon: Shield, desc: 'Rental terms, reservation process, inspection, and security deposit guidelines' },
  { key: 'shippingPolicyContent', label: 'Shipping & Delivery', icon: Truck, desc: 'Packaging, transit insurance, delivery zones, and timeline disclosures' },
  { key: 'paymentPolicyContent', label: 'Payments & Deposits', icon: CreditCard, desc: 'Accepted payment methods, online gateways, and deposit refund terms' },
  { key: 'refundPolicyContent', label: 'Refunds & Returns', icon: RotateCcw, desc: 'Return windows, conditions for sale products, and cancellation rules' },
  { key: 'privacyPolicyContent', label: 'Privacy Policy', icon: Lock, desc: 'Customer data collection, order processing, cookies, and protection disclosure' },
  { key: 'termsPolicyContent', label: 'Terms of Service', icon: FileText, desc: 'General customer terms, limitations of liability, and service agreement' },
] as const

type PolicyKey = typeof POLICY_TABS[number]['key']

export function AdminPoliciesPage() {
  const { data: settings, isLoading, refetch } = useSiteSettings()
  const [activeTab, setActiveTab] = useState<PolicyKey>('rentalPolicyContent')
  const [policies, setPolicies] = useState<Record<PolicyKey, string>>({
    rentalPolicyContent: '',
    shippingPolicyContent: '',
    paymentPolicyContent: '',
    refundPolicyContent: '',
    privacyPolicyContent: '',
    termsPolicyContent: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (settings) {
      setPolicies({
        rentalPolicyContent: settings.rentalPolicyContent || '',
        shippingPolicyContent: settings.shippingPolicyContent || '',
        paymentPolicyContent: settings.paymentPolicyContent || '',
        refundPolicyContent: settings.refundPolicyContent || '',
        privacyPolicyContent: settings.privacyPolicyContent || '',
        termsPolicyContent: settings.termsPolicyContent || '',
      })
      setHasChanges(false)
    }
  }, [settings])

  const handlePolicyChange = (key: PolicyKey, val: string) => {
    setPolicies((prev) => ({ ...prev, [key]: val }))
    setHasChanges(true)
  }

  const bulkUpdateMutation = trpc.siteSettings.bulkUpdateSettings.useMutation({
    onSuccess: () => {
      toast.success('Policy content saved successfully!')
      setHasChanges(false)
      setIsSubmitting(false)
      refetch()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save policies')
      setIsSubmitting(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const payload = Object.entries(policies).map(([key, value]) => ({
      key,
      value: value.trim(),
    }))

    bulkUpdateMutation.mutate(payload)
  }

  const handleReset = () => {
    if (settings) {
      setPolicies({
        rentalPolicyContent: settings.rentalPolicyContent || '',
        shippingPolicyContent: settings.shippingPolicyContent || '',
        paymentPolicyContent: settings.paymentPolicyContent || '',
        refundPolicyContent: settings.refundPolicyContent || '',
        privacyPolicyContent: settings.privacyPolicyContent || '',
        termsPolicyContent: settings.termsPolicyContent || '',
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">Policies & Legal Content</h1>
          <p className="text-muted-foreground mt-1">
            Manage terms, rental conditions, shipping rules, and customer policies displayed on public legal pages.
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
                Save All Policies
              </>
            )}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-lg p-3 text-xs flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>You have unsaved policy edits. Click &ldquo;Save All Policies&rdquo; to publish updates.</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PolicyKey)} className="w-full">
        <TabsList className="flex w-full overflow-x-auto gap-1 p-1">
          {POLICY_TABS.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="gap-2 py-2 px-3 text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {POLICY_TABS.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="mt-6 animate-fade-in">
            <Card className="card-sheaura">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <tab.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="font-display text-lg">{tab.label}</CardTitle>
                </div>
                <CardDescription>{tab.desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <Label htmlFor={tab.key} className="text-xs font-medium">
                      Policy Statement / Terms (Plain text or formatted paragraphs)
                    </Label>
                    <span>{(policies[tab.key] || '').length} / 10,000 characters</span>
                  </div>
                  <Textarea
                    id={tab.key}
                    value={policies[tab.key] || ''}
                    onChange={(e) => handlePolicyChange(tab.key, e.target.value)}
                    placeholder={`Enter full content for ${tab.label}...`}
                    rows={12}
                    className="font-sans text-sm leading-relaxed"
                    maxLength={10000}
                  />
                  <p className="text-xs text-muted-foreground">
                    Text is sanitized server-side. HTML/scripts are stripped automatically to protect customer sessions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </form>
  )
}
