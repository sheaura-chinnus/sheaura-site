import { useState, useRef } from 'react'
import { Upload, Trash2, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon, Info } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'

// Read CSRF token from document cookie
function getCsrfToken(): string {
  const match = document.cookie.match(/csrf_token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export function AdminLogoMediaPage() {
  const { data: settings, refetch: refetchSettings } = useSiteSettings()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [altText, setAltText] = useState(settings?.logoAltText || 'Sheaura Brand Logo')
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const currentLogoUrl = settings?.logoUrl || ''

  const deleteLogoMutation = trpc.siteSettings.deleteLogo.useMutation({
    onSuccess: () => {
      toast.success('Logo removed successfully')
      setShowDeleteConfirm(false)
      refetchSettings()
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete logo')
    },
  })

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null)
    const file = e.target.files?.[0]
    if (!file) return

    // Pre-check file type: only png, jpeg, webp
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Disallowed file format. Only PNG, JPEG, and WebP images are permitted. SVG files are disallowed for security.')
      return
    }

    // Pre-check size: 2MB max
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage(`File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum allowed logo size is 2.0MB.`)
      return
    }

    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  // Cancel pending selection
  const handleCancelSelection = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setErrorMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Upload logo
  const handleUpload = async () => {
    if (!selectedFile) return
    setIsUploading(true)
    setErrorMessage(null)

    try {
      // Read as base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(selectedFile)
      })

      const base64Data = await base64Promise
      const csrfToken = getCsrfToken()

      const response = await fetch('/api/admin/media/upload-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          fileBase64: base64Data,
          originalFilename: selectedFile.name,
          altText: altText.trim() || 'Sheaura Brand Logo',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Server rejected logo upload')
      }

      toast.success('Site logo uploaded and activated successfully!')
      handleCancelSelection()
      refetchSettings()
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while uploading the logo.')
      toast.error(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">Logo & Media Management</h1>
        <p className="text-muted-foreground mt-1">
          Upload and manage the official brand logo displayed across the website header and emails.
        </p>
      </div>

      {/* Security notice */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3 text-sm text-foreground">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium">Secure Media Storage Guidelines</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Only verified <strong>PNG</strong>, <strong>JPEG</strong>, and <strong>WebP</strong> formats up to 2MB are accepted. SVG files are strictly prohibited to protect customer sessions against malicious code execution. Images are validated by binary magic bytes and served with strict sandbox headers.
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">Upload Error</p>
            <p className="text-xs">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Active Logo Card */}
      <Card className="card-sheaura">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <span>Current Brand Logo</span>
          </CardTitle>
          <CardDescription>
            The live logo currently rendered in the customer navigation bar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentLogoUrl ? (
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-muted/40 rounded-xl border border-border">
              <div className="w-48 h-20 bg-background rounded-lg border border-border flex items-center justify-center p-2 shadow-sm">
                <img
                  src={currentLogoUrl}
                  alt={settings?.logoAltText || 'Sheaura Current Logo'}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="space-y-2 flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Active on customer site</span>
                </div>
                <p className="text-xs text-muted-foreground break-all">
                  Source: <code className="bg-muted px-1 py-0.5 rounded">{currentLogoUrl}</code>
                </p>
                <p className="text-xs text-muted-foreground">
                  Alt text: &ldquo;{settings?.logoAltText || 'Sheaura'}&rdquo;
                </p>
                <div className="pt-2">
                  {!showDeleteConfirm ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="gap-1.5 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove Site Logo</span>
                    </Button>
                  ) : (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-semibold text-destructive">
                        Are you sure you want to remove the site logo? The site will revert to the text brand name.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteLogoMutation.isPending}
                          onClick={() => deleteLogoMutation.mutate()}
                          className="text-xs"
                        >
                          {deleteLogoMutation.isPending ? 'Removing...' : 'Confirm Remove'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-muted/20 border border-dashed border-border rounded-xl space-y-2">
              <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-foreground">No Custom Logo Configured</p>
              <p className="text-xs text-muted-foreground">
                The customer-facing website is currently displaying the default stylized text: &ldquo;{settings?.brandName || 'Sheaura'}&rdquo;.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload / Replace Logo Card */}
      <Card className="card-sheaura">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <span>{currentLogoUrl ? 'Replace Site Logo' : 'Upload New Site Logo'}</span>
          </CardTitle>
          <CardDescription>
            Select an image from your computer to preview and activate as the new site logo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="logo-file-input" className="text-sm font-medium">
              Choose Logo File (PNG, JPEG, WebP)
            </Label>
            <input
              id="logo-file-input"
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Maximum file size: 2MB. Recommended dimensions: transparent background, height 80–120px.
            </p>
          </div>

          {/* Preview Section */}
          {previewUrl && (
            <div className="space-y-4 p-4 border border-primary/30 bg-primary/5 rounded-xl animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Local Preview</span>
                <span className="text-xs text-muted-foreground">
                  {selectedFile?.name} ({(selectedFile?.size ? selectedFile.size / 1024 : 0).toFixed(1)} KB)
                </span>
              </div>
              <div className="flex items-center justify-center p-6 bg-background rounded-lg border border-border shadow-inner">
                <img
                  src={previewUrl}
                  alt="New Logo Preview"
                  className="max-h-24 max-w-full object-contain"
                />
              </div>

              {/* Alt Text Input */}
              <div className="space-y-1.5">
                <Label htmlFor="logo-alt-text" className="text-xs font-medium">
                  Accessible Alt Text (for screen readers and SEO)
                </Label>
                <Input
                  id="logo-alt-text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="e.g. Sheaura — Imitation Jewellery and Occasion Ornaments"
                  maxLength={255}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Validating & Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Activate & Save Logo</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelSelection}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
