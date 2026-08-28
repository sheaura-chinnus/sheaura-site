import React, { useState, useEffect } from 'react'
import { Home, Briefcase, MapPin, Plus, Trash2, Edit2, Navigation, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/lib/trpc'
import { useAuth, useAddresses, useSaveAddress, useDeleteAddress } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

export interface DeliveryAddressData {
  id?: string
  label: 'home' | 'office' | 'other'
  fullName: string
  phone: string
  streetAddress: string
  city: string
  state: string
  pincode: string
  isDefault?: boolean
}

interface AddressManagerProps {
  selectedAddress: DeliveryAddressData | null
  onSelectAddress: (addr: DeliveryAddressData) => void
  onAddressValidated?: (isValid: boolean, codAvailable: boolean) => void
}

export function AddressManager({ selectedAddress, onSelectAddress, onAddressValidated }: AddressManagerProps) {
  const { user } = useAuth()
  const { data: savedAddresses } = useAddresses()
  const saveAddressMutation = useSaveAddress()
  const deleteAddressMutation = useDeleteAddress()

  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [pincodeLookupQuery, setPincodeLookupQuery] = useState('')

  const [formData, setFormData] = useState<DeliveryAddressData>({
    label: 'home',
    fullName: user?.name || '',
    phone: (user as any)?.phone || '',
    streetAddress: (user as any)?.deliveryAddress || '',
    city: (user as any)?.city || '',
    state: (user as any)?.state || '',
    pincode: (user as any)?.pincode || '',
    isDefault: true,
  })

  // PIN code lookup query
  const { data: pincodeData, isFetching: isFetchingPincode } = trpc.pincode.lookup.useQuery(
    { pincode: pincodeLookupQuery },
    {
      enabled: /^[1-9][0-9]{5}$/.test(pincodeLookupQuery),
      retry: false,
    }
  )

  // Auto-fill City & State when valid 6-digit PIN code is typed
  useEffect(() => {
    if (pincodeData?.success) {
      setFormData(prev => ({
        ...prev,
        city: pincodeData.city,
        state: pincodeData.state,
      }))
      onAddressValidated?.(true, pincodeData.isCodAvailable)
    }
  }, [pincodeData])

  // Select default address on initial load
  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0 && !selectedAddress) {
      const defaultAddr = savedAddresses.find((a: any) => a.isDefault) || savedAddresses[0]
      onSelectAddress(defaultAddr as DeliveryAddressData)
    }
  }, [savedAddresses, selectedAddress])

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
    setFormData(prev => ({ ...prev, pincode: val }))
    if (val.length === 6) {
      setPincodeLookupQuery(val)
    }
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsLocating(false)
        try {
          const lat = position.coords.latitude
          const lon = position.coords.longitude

          // Attempt OpenStreetMap reverse geocoding
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
          const data = await res.json()

          if (data && data.address) {
            const detectedPincode = data.address.postcode?.replace(/\D/g, '').slice(0, 6) || ''
            const detectedCity = data.address.city || data.address.town || data.address.suburb || data.address.county || ''
            const detectedState = data.address.state || ''
            const detectedRoad = [data.address.road, data.address.suburb, data.address.neighbourhood].filter(Boolean).join(', ')

            setFormData(prev => ({
              ...prev,
              streetAddress: detectedRoad || prev.streetAddress,
              city: detectedCity || prev.city,
              state: detectedState || prev.state,
              pincode: detectedPincode || prev.pincode,
            }))

            if (detectedPincode.length === 6) {
              setPincodeLookupQuery(detectedPincode)
            }
            toast.success('Location detected successfully!')
          }
        } catch {
          toast.success('GPS coordinates captured')
        }
      },
      () => {
        setIsLocating(false)
        toast.error('Could not access current location. Please enter address manually.')
      },
      { timeout: 8000 }
    )
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName.trim()) {
      toast.error('Recipient name is required')
      return
    }
    if (!formData.phone.trim() || formData.phone.length < 8) {
      toast.error('Valid contact phone is required')
      return
    }
    if (!formData.streetAddress.trim()) {
      toast.error('Street / House / Building address is required')
      return
    }
    if (!formData.pincode || formData.pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit Indian PIN code')
      return
    }

    if (!user) {
      // Guest mode - pass address directly
      onSelectAddress(formData)
      setIsAddingNew(false)
      toast.success('Delivery address set')
      return
    }

    try {
      const saved = await saveAddressMutation.mutateAsync({
        id: editingId || undefined,
        label: formData.label,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        streetAddress: formData.streetAddress.trim(),
        city: formData.city.trim() || 'City Hub',
        state: formData.state.trim() || 'State',
        pincode: formData.pincode.trim(),
        isDefault: formData.isDefault,
      })

      toast.success(editingId ? 'Address updated' : 'Address saved to your account')
      onSelectAddress(saved as any)
      setIsAddingNew(false)
      setEditingId(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save address')
    }
  }

  const startEdit = (addr: any) => {
    setEditingId(addr.id)
    setFormData({
      label: addr.label,
      fullName: addr.fullName,
      phone: addr.phone,
      streetAddress: addr.streetAddress,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    })
    setIsAddingNew(true)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Delete this saved address?')) {
      await deleteAddressMutation.mutateAsync({ id })
      toast.success('Address removed')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header & New Address CTA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-sm text-foreground uppercase tracking-wider">
            Delivery Destination
          </h3>
        </div>

        {!isAddingNew && user && savedAddresses && savedAddresses.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingId(null)
              setFormData({
                label: 'home',
                fullName: user.name || '',
                phone: (user as any).phone || '',
                streetAddress: '',
                city: '',
                state: '',
                pincode: '',
                isDefault: false,
              })
              setIsAddingNew(true)
            }}
            className="text-xs h-8 border-amber-600/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add New Address
          </Button>
        )}
      </div>

      {/* Saved Addresses Cards (When logged in and not adding new) */}
      {!isAddingNew && savedAddresses && savedAddresses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {savedAddresses.map((addr: any) => {
            const isSelected = selectedAddress?.id === addr.id || (selectedAddress?.streetAddress === addr.streetAddress && selectedAddress?.pincode === addr.pincode)

            return (
              <div
                key={addr.id}
                onClick={() => onSelectAddress(addr)}
                className={`relative p-4 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-600 shadow-sm'
                    : 'border-border bg-card hover:border-amber-600/50'
                }`}
              >
                {/* Top Badge: Label & Default status */}
                <div className="flex items-center justify-between mb-2">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300">
                    {addr.label === 'office' ? (
                      <Briefcase className="h-3 w-3" />
                    ) : (
                      <Home className="h-3 w-3" />
                    )}
                    <span>{addr.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {addr.isDefault && (
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Default</span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEdit(addr)
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground"
                      title="Edit address"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(addr.id, e)}
                      className="p-1 text-muted-foreground hover:text-red-600"
                      title="Delete address"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Recipient Details */}
                <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <span>{addr.fullName}</span>
                  <span className="text-xs font-normal text-muted-foreground">({addr.phone})</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {addr.streetAddress}, {addr.city}, {addr.state} - <strong className="font-mono text-foreground">{addr.pincode}</strong>
                </p>

                {isSelected && (
                  <div className="mt-2.5 flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Delivering to this address</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : null}

      {/* Address Form (Shown if adding new or no saved addresses exist) */}
      {(isAddingNew || !savedAddresses || savedAddresses.length === 0) && (
        <form onSubmit={handleSaveAddress} className="p-4 sm:p-5 rounded-2xl bg-card border border-amber-900/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {editingId ? 'Edit Delivery Address' : 'Enter Delivery Address'}
            </h4>

            {/* GPS Auto-Fill Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
            >
              {isLocating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Locating GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="h-3.5 w-3.5 text-amber-600" />
                  <span>Use Current Location</span>
                </>
              )}
            </button>
          </div>

          {/* Address Type Selector */}
          <div className="flex gap-2">
            {(['home', 'office', 'other'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, label: type })}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize border transition-all cursor-pointer ${
                  formData.label === type
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Full Recipient Name *</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Aishwarya Lakshmi"
                className="h-10 text-xs mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Mobile Phone (for delivery tracking) *</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="98765 43210"
                className="h-10 text-xs mt-1 font-medium"
                required
              />
            </div>
          </div>

          {/* Street Address */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Flat / House No. / Building / Street *</Label>
            <Input
              value={formData.streetAddress}
              onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
              placeholder="e.g. Flat 4B, Royal Regency Apartments, MG Road"
              className="h-10 text-xs mt-1"
              required
            />
          </div>

          {/* Pincode with Live Lookup, City & State */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">PIN Code *</Label>
                {isFetchingPincode && <Loader2 className="h-3 w-3 animate-spin text-amber-600" />}
              </div>
              <Input
                value={formData.pincode}
                onChange={handlePincodeChange}
                placeholder="682001"
                maxLength={6}
                className="h-10 text-xs mt-1 font-mono font-semibold tracking-wider"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground">City / District *</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Kochi"
                className="h-10 text-xs mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground">State *</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Kerala"
                className="h-10 text-xs mt-1"
                required
              />
            </div>
          </div>

          {/* COD & Delivery Badge */}
          {pincodeData && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Verified: <strong>{pincodeData.city}, {pincodeData.state}</strong></span>
              </div>
              <span className="font-semibold text-[11px] bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                COD Available • {pincodeData.estimatedDeliveryDays} Days
              </span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            {savedAddresses && savedAddresses.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddingNew(false)
                  setEditingId(null)
                }}
                className="text-xs h-9"
              >
                Cancel
              </Button>
            )}

            <Button
              type="submit"
              size="sm"
              disabled={saveAddressMutation.isLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-9 px-4 cursor-pointer"
            >
              {saveAddressMutation.isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingId ? 'Update Address' : 'Use This Address'}</span>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
