import { useState } from 'react'
import { Mail, Phone, Clock, Send, Loader2, MapPin, MessageCircle } from 'lucide-react'
import { useContactInfo } from '@/hooks/useContactInfo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'

const contactReasons = [
  { value: 'order', label: 'Order / Buying Enquiry' },
  { value: 'product', label: 'Product Details & Sizing' },
  { value: 'bridal', label: 'Bridal Set Consultation' },
  { value: 'custom', label: 'Custom Design / Matching' },
  { value: 'general', label: 'General Enquiry' },
  { value: 'wholesale', label: 'Bulk / Festive Orders' },
]

export function ContactPage() {
  const contact = useContactInfo()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    reason: 'order',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const contactInfo = [
    {
      icon: MessageCircle,
      title: 'WhatsApp Concierge',
      details: ['+91 9995098294', 'Direct styling assistance & orders'],
      description: 'Instant response on WhatsApp',
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: [contact.phone, 'Mon–Sat, 10 AM – 8 PM IST'],
      description: 'For urgent inquiries',
    },
    {
      icon: Mail,
      title: 'Email Us',
      details: [contact.email],
      description: 'We reply within 24 hours',
    },
    {
      icon: MapPin,
      title: 'Studio Location',
      details: [contact.address || 'Kadampanadu, Pathanamthitta, Kerala'],
      description: 'By appointment only',
    },
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Please provide a short message or product inquiry'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const msg = `Hello Sheaura, I have a message from your website contact form:\nName: ${formData.fullName}\nPhone: ${formData.phone}\nReason: ${formData.reason}\nMessage: ${formData.message}`
      const url = `https://wa.me/919995098294?text=${encodeURIComponent(msg)}`
      
      toast.success('Opening WhatsApp to send your enquiry!')
      window.open(url, '_blank', 'noopener,noreferrer')

      setFormData({
        fullName: '',
        email: '',
        phone: '',
        reason: 'order',
        subject: '',
        message: '',
      })
    } catch {
      toast.error('Could not connect. Please message us directly on WhatsApp at +91 9995098294.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="py-14 lg:py-20 bg-amber-50/40 dark:bg-muted/20 border-b border-amber-900/10" aria-labelledby="contact-hero">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-900 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
              Get in Touch
            </span>
            <h1 id="contact-hero" className="font-display text-4xl sm:text-5xl font-bold text-amber-900 dark:text-amber-300 mb-4">
              We'd Love to Assist You
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Have a question about our handcrafted fashion jewellery? Looking for bridal styling advice or custom pieces? Our team is available on WhatsApp and call.
            </p>
          </div>
        </div>
      </section>

      <section className="section-spacing">
        <div className="container-sheaura">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              {contactInfo.map((info, index) => (
                <Card key={index} className="card-sheaura">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                        <info.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg text-foreground mb-1">{info.title}</h3>
                        <div className="space-y-1">
                          {info.details.map((detail, i) => (
                            <p key={i} className="text-muted-foreground">{detail}</p>
                          ))}
                        </div>
                        <p className="text-xs text-primary mt-2">{info.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Business Hours */}
              <Card className="card-sheaura">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg text-foreground mb-3">Business Hours</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Monday – Friday</span>
                          <span className="text-foreground">10:00 AM – 7:00 PM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Saturday</span>
                          <span className="text-foreground">10:00 AM – 5:00 PM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sunday</span>
                          <span className="text-foreground">Closed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="card-sheaura">
                <CardHeader>
                  <CardTitle className="font-display text-2xl">Send Us a Message</CardTitle>
                  <p className="text-muted-foreground mt-1">Fill out the form and we'll get back to you as soon as possible.</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="fullName" className="block text-sm font-medium mb-1">
                          Full Name *
                        </Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Your name"
                          aria-invalid={!!errors.fullName}
                          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                        />
                        {errors.fullName && (
                          <p id="fullName-error" className="text-sm text-destructive mt-1" role="alert">{errors.fullName}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="email" className="block text-sm font-medium mb-1">
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="you@example.com"
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? 'email-error' : undefined}
                        />
                        {errors.email && (
                          <p id="email-error" className="text-sm text-destructive mt-1" role="alert">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="phone" className="block text-sm font-medium mb-1">
                          Phone Number *
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          aria-invalid={!!errors.phone}
                          aria-describedby={errors.phone ? 'phone-error' : undefined}
                        />
                        {errors.phone && (
                          <p id="phone-error" className="text-sm text-destructive mt-1" role="alert">{errors.phone}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="reason" className="block text-sm font-medium mb-1">
                          Enquiry Type *
                        </Label>
                        <select
                          id="reason"
                          value={formData.reason}
                          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                          aria-invalid={!!errors.reason}
                        >
                          {contactReasons.map((reason) => (
                            <option key={reason.value} value={reason.value}>{reason.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="subject" className="block text-sm font-medium mb-1">
                        Subject *
                      </Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Brief summary of your enquiry"
                        aria-invalid={!!errors.subject}
                        aria-describedby={errors.subject ? 'subject-error' : undefined}
                      />
                      {errors.subject && (
                        <p id="subject-error" className="text-sm text-destructive mt-1" role="alert">{errors.subject}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="message" className="block text-sm font-medium mb-1">
                        Message *
                      </Label>
                      <Textarea
                        id="message"
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tell us more about your enquiry..."
                        aria-invalid={!!errors.message}
                        aria-describedby={errors.message ? 'message-error' : undefined}
                      />
                      {errors.message && (
                        <p id="message-error" className="text-sm text-destructive mt-1" role="alert">{errors.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Minimum 20 characters</p>
                    </div>

                    <Button type="submit" size="lg" className="w-full sm:w-auto bg-amber-700 hover:bg-amber-800 text-white shadow-md rounded-xl" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Enquiry on WhatsApp
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      By submitting, you agree to our{' '}
                      <a href="/privacy" className="underline hover:text-amber-800">Privacy Policy</a>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-spacing bg-amber-50/30 dark:bg-muted/20 border-t border-amber-900/10" aria-labelledby="faq-title">
        <div className="container-sheaura">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="faq-title" className="font-display text-3xl sm:text-4xl font-bold text-amber-950 dark:text-amber-200 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-base">
              Quick answers about ordering, jewellery care, and delivery
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'How do I place an order for jewellery?',
                a: 'Browse our collection, select your favorite piece, and click "Order on WhatsApp" or add multiple pieces to your Order List. Our team connects with you on WhatsApp (+91 9995098294) to confirm stock, custom sizing, payment details, and dispatch.',
              },
              {
                q: 'What type of jewellery does Sheaura offer?',
                a: 'Sheaura specializes in premium handcrafted fashion, antique, temple, and imitation jewellery crafted with high-grade copper/brass alloys and micro gold polish for weddings, festive functions, and special celebrations.',
              },
              {
                q: 'How is jewellery safely delivered?',
                a: 'All orders are carefully packed in protective, velvet-lined gift boxes and bubble cushioning. We ship across India via trusted express couriers with end-to-end tracking.',
              },
              {
                q: 'How should I care for my Sheaura fashion jewellery?',
                a: 'Store each piece in its airtight pouch away from direct moisture, perfumes, and hairsprays. Wipe gently with a dry microfibre cloth after wearing to maintain the lustrous polish.',
              },
              {
                q: 'Can I request matching accessories or custom sets?',
                a: 'Yes! If you have a specific bridal saree or lehenga, send us a photo on WhatsApp. Our styling team will suggest perfectly matching chokers, jhumkas, maang tikkas, and bangles.',
              },
            ].map((faq, index) => (
              <details key={index} className="group bg-card border border-amber-900/15 rounded-2xl p-6 shadow-xs hover:border-amber-600/30 transition-all">
                <summary className="flex items-center justify-between cursor-pointer list-none font-display font-medium text-foreground text-base sm:text-lg">
                  {faq.q}
                  <span className="text-amber-700 group-open:rotate-180 transition-transform">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="text-muted-foreground mt-4 leading-relaxed text-sm sm:text-base">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-spacing">
        <div className="container-sheaura text-center">
          <div className="max-w-2xl mx-auto p-8 rounded-3xl border border-amber-900/15 bg-card shadow-sm">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-amber-950 dark:text-amber-200 mb-3">
              Need Personal Styling Assistance?
            </h2>
            <p className="text-muted-foreground text-base mb-6">
              Connect directly with our jewellery consultants on WhatsApp for bridal curation, video previews, and expedited orders.
            </p>
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium shadow-md rounded-xl"
              onClick={() => {
                const url = `https://wa.me/919995098294?text=${encodeURIComponent('Hello Sheaura, I would like personal styling assistance for an upcoming occasion.')}`
                window.open(url, '_blank', 'noopener,noreferrer')
              }}
            >
              <MessageCircle className="h-5 w-5" />
              <span>Chat with Stylist on WhatsApp</span>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}