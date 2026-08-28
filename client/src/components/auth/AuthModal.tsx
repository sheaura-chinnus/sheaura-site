import React, { useState, useEffect, useRef } from 'react'
import { X, Sparkles, Smartphone, CheckCircle2, ArrowRight, RefreshCw, MessageSquare, ShieldCheck, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { useSendOtp, useVerifyOtp } from '@/hooks/useAuth'

export interface CountryOption {
  code: string
  dialCode: string
  name: string
  flag: string
}

export const COUNTRIES: CountryOption[] = [
  { code: 'IN', dialCode: '+91', name: 'India', flag: '🇮🇳' },
  { code: 'AE', dialCode: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'SG', dialCode: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'CA', dialCode: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', dialCode: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: 'MY', dialCode: '+60', name: 'Malaysia', flag: '🇲🇾' },
]

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (user: any, isNewUser?: boolean, isFirstOrder?: boolean) => void
  initialPhone?: string
}

export function AuthModal({ isOpen, onClose, onSuccess, initialPhone = '' }: AuthModalProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState(initialPhone)
  const [fullName, setFullName] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[0])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', ''])
  const [countdown, setCountdown] = useState(30)
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null)

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const sendOtpMutation = useSendOtp()
  const verifyOtpMutation = useVerifyOtp()

  useEffect(() => {
    if (isOpen) {
      setStep('phone')
      setOtpDigits(['', '', '', ''])
      setCountdown(30)
      if (initialPhone) setPhone(initialPhone)
    }
  }, [isOpen, initialPhone])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (step === 'otp' && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [step, countdown])

  if (!isOpen) return null

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanDigits = phone.replace(/\D/g, '')
    if (cleanDigits.length < 8) {
      toast.error('Please enter a valid mobile phone number')
      return
    }

    try {
      const res = await sendOtpMutation.mutateAsync({
        phone: cleanDigits,
        countryCode: selectedCountry.dialCode,
      })

      if (res.demoOtp) {
        setDemoCodeHint(res.demoOtp)
      }
      setStep('otp')
      setCountdown(30)
      toast.success(`OTP sent to ${res.phone}`)
      setTimeout(() => inputRefs[0].current?.focus(), 100)
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP. Please try again.')
    }
  }

  const handleOtpChange = (index: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1)
    const newDigits = [...otpDigits]
    newDigits[index] = char
    setOtpDigits(newDigits)

    if (char && index < 3) {
      inputRefs[index + 1].current?.focus()
    }

    // Auto-submit when 4 digits are complete
    if (char && index === 3) {
      const fullCode = [...newDigits.slice(0, 3), char].join('')
      if (fullCode.length === 4) {
        handleVerifyOtp(fullCode)
      }
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pastedData.length > 0) {
      const newDigits = ['', '', '', '']
      for (let i = 0; i < pastedData.length; i++) {
        newDigits[i] = pastedData[i]
      }
      setOtpDigits(newDigits)
      if (pastedData.length === 4) {
        handleVerifyOtp(pastedData)
      } else {
        inputRefs[Math.min(pastedData.length, 3)].current?.focus()
      }
    }
  }

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('')
    if (code.length !== 4) {
      toast.error('Please enter the complete 4-digit code')
      return
    }

    try {
      const res = await verifyOtpMutation.mutateAsync({
        phone,
        countryCode: selectedCountry.dialCode,
        code,
        fullName: fullName.trim() || undefined,
      })

      toast.success(res.isNewUser ? 'Welcome to Sheaura! 10% OFF applied.' : 'Welcome back!')
      onSuccess?.(res.user, res.isNewUser, res.isFirstOrder)
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Invalid or expired OTP')
      setOtpDigits(['', '', '', ''])
      inputRefs[0].current?.focus()
    }
  }

  const handleResendViaWhatsApp = () => {
    const cleanPhone = phone.replace(/\D/g, '')
    const target = `${selectedCountry.dialCode}${cleanPhone}`
    toast.success(`Simulating WhatsApp OTP to ${target}`)
    handleSendOtp()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal / Drawer Box */}
      <div 
        className="w-full md:max-w-md bg-[#FAF8F5] dark:bg-[#11221F] border border-amber-900/20 dark:border-amber-500/20 rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header & Close */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-amber-500/10 to-transparent">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Luxury Brand Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/50 text-amber-800 dark:text-amber-300 mb-1 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="font-display text-2xl font-medium text-foreground tracking-tight">
              {step === 'phone' ? 'Instant One-Tap Sign In' : 'Verify Mobile Number'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {step === 'phone'
                ? 'Zero passwords. Instant 1-click checkout & order updates.'
                : `Enter 4-digit code sent to ${selectedCountry.dialCode} ${phone}`}
            </p>
          </div>

          {/* Animated 10% Off Incentive Pill */}
          <div className="mt-3 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-emerald-500/20 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-[11px] font-medium animate-pulse shadow-sm">
              <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              <span>Unlock <strong>EXTRA 10% OFF</strong> on your first order</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Optional Full Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1">
                  Full Name (Optional)
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Aishwarya Lakshmi"
                  className="bg-white dark:bg-[#1A302B] border-amber-900/20 focus:border-amber-600 h-11 text-sm rounded-xl"
                />
              </div>

              {/* Mobile Phone Input with Country Code Selector */}
              <div>
                <label className="block text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-1">
                  Mobile Number <span className="text-amber-600">*</span>
                </label>

                <div className="flex gap-2">
                  {/* Country Selector Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="flex items-center gap-1.5 h-11 px-3 bg-white dark:bg-[#1A302B] border border-amber-900/20 rounded-xl text-xs font-medium text-foreground hover:bg-amber-500/5 transition-colors focus:ring-1 focus:ring-amber-500"
                    >
                      <span className="text-base leading-none">{selectedCountry.flag}</span>
                      <span className="font-mono">{selectedCountry.dialCode}</span>
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </button>

                    {showCountryDropdown && (
                      <div className="absolute left-0 top-12 z-50 w-52 bg-white dark:bg-[#1A302B] border border-amber-900/20 rounded-xl shadow-xl py-1 max-h-48 overflow-y-auto">
                        {COUNTRIES.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(c)
                              setShowCountryDropdown(false)
                            }}
                            className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-amber-500/10 transition-colors"
                          >
                            <span>{c.flag}</span>
                            <span className="font-medium text-foreground flex-1">{c.name}</span>
                            <span className="font-mono text-muted-foreground text-[11px]">{c.dialCode}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Phone digits input */}
                  <div className="relative flex-1">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98765 43210"
                      className="pl-9 bg-white dark:bg-[#1A302B] border-amber-900/20 focus:border-amber-600 h-11 text-sm font-medium tracking-wide rounded-xl"
                      autoFocus
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                disabled={sendOtpMutation.isLoading}
                className="w-full h-12 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-800 hover:to-amber-800 text-white font-medium text-sm rounded-xl shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                {sendOtpMutation.isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Get 4-Digit OTP</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-5">
              {/* 4-Digit Input Boxes */}
              <div>
                <label className="block text-xs font-semibold text-center text-foreground/80 uppercase tracking-wider mb-3">
                  Enter 4-Digit Verification Code
                </label>

                <div className="flex justify-center gap-3">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={inputRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-13 h-14 text-center font-mono text-2xl font-bold rounded-xl bg-white dark:bg-[#1A302B] border-2 border-amber-900/20 focus:border-amber-600 dark:focus:border-amber-400 outline-none shadow-sm focus:scale-105 transition-all"
                    />
                  ))}
                </div>

                {demoCodeHint && (
                  <p className="text-center text-[11px] text-amber-700 dark:text-amber-400 mt-2 font-mono">
                    💡 Demo OTP for instant login: <strong>{demoCodeHint}</strong>
                  </p>
                )}
              </div>

              {/* Verify Button */}
              <Button
                onClick={() => handleVerifyOtp()}
                disabled={verifyOtpMutation.isLoading}
                className="w-full h-12 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-800 hover:to-amber-800 text-white font-medium text-sm rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {verifyOtpMutation.isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-amber-200" />
                    <span>Verify & Unlock 10% OFF</span>
                  </>
                )}
              </Button>

              {/* Resend & Fallback Actions */}
              <div className="pt-2 flex flex-col items-center gap-2.5">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span>Didn't receive the SMS?</span>
                  {countdown > 0 ? (
                    <span className="font-mono font-medium text-foreground">Resend in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleResendViaWhatsApp}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 font-medium py-1 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Receive OTP via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-xs text-muted-foreground hover:text-foreground underline pt-1"
                >
                  Change phone number
                </button>
              </div>
            </div>
          )}

          {/* Privacy & Trust Badge */}
          <div className="pt-3 border-t border-amber-900/10 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>256-Bit Encrypted OTP. No Spam. Zero Password Hassle.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
