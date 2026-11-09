import { useState } from 'react'
import { Gift, Check, Copy, ArrowRight, X, Percent, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { useClaimWelcomeCoupon } from '@/hooks/useAuth'

interface WelcomeIncentiveProps {
  isOpen: boolean
  onClose: () => void
  onApplyCoupon?: (code: string, discountPercent: number) => void
}

export function WelcomeIncentive({ isOpen, onClose, onApplyCoupon }: WelcomeIncentiveProps) {
  const [copied, setCopied] = useState(false)
  const [applied, setApplied] = useState(false)
  const claimMutation = useClaimWelcomeCoupon()

  if (!isOpen) return null

  const couponCode = 'WELCOME10'
  const discountPercent = 10

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode)
    setCopied(true)
    toast.success(`Coupon code "${couponCode}" copied to clipboard!`)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleApply = async () => {
    try {
      await claimMutation.mutateAsync()
    } catch {
      // Offline / guest fallback is fine
    }
    setApplied(true)
    onApplyCoupon?.(couponCode, discountPercent)
    toast.success('Welcome discount code applied.')
    setTimeout(() => {
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-gradient-to-b from-[#1A302B] to-[#11221F] text-white border-2 border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-8 text-center space-y-5 relative">
          {/* Gift Icon */}
          <div className="relative inline-block">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow-md">
              <Gift className="h-7 w-7 text-amber-300" />
            </div>
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">
              <Percent className="h-3 w-3" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <span className="inline-block text-xs font-semibold text-amber-300 uppercase tracking-wider">
              Welcome Offer
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-medium text-amber-100 tracking-tight pt-1">
              10% Off First Order
            </h2>
            <p className="text-xs text-amber-200/80 max-w-xs mx-auto">
              Use your welcome code to save on your order of jewellery, accessories, and cosmetics.
            </p>
          </div>

          {/* Luxury Coupon Voucher Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-dashed border-amber-400/40 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <span className="text-xs text-amber-300/80 font-medium block">Promo Code</span>
                <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-amber-300">{couponCode}</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-medium border border-amber-500/40 transition-colors cursor-pointer"
                title="Copy code"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-white/60 flex items-center justify-between pt-1 border-t border-white/10">
              <span>Valid across all collections</span>
              <span className="text-amber-300/90 font-medium">Auto-applies at checkout</span>
            </div>
          </div>

          {/* Action CTA Button */}
          <Button
            onClick={handleApply}
            disabled={applied}
            className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            {applied ? (
              <>
                <Check className="h-4 w-4 text-white" />
                <span>Applied to Bag</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                <span>Apply Code & Continue</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
