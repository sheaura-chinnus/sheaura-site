import { useState } from 'react'
import { Mail, Phone, Clock, Send, Loader2, MapPin } from 'lucide-react'
import { useContactInfo } from '@/hooks/useContactInfo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'

const contactReasons = [
  { value: 'general', label: 'General Enquiry' },
  { value: 'product', label: 'Product Information' },
  { value: 'order', label: 'Order Enquiry' },
  { value: 'rental', label: 'Rental Enquiry' },
  { value: 'custom', label: 'Custom Design' },
  { value: 'wholesale', label: 'Wholesale / Partnership' },
  { value: 'career', label: 'Career Opportunities' },
  { value: 'other', label: 'Other' },
]

export function ContactPage() {
  const contact = useContactInfo()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    reason: 'general',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[\d\s\-+()]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 20) {
      newErrors.message = 'Message must be at least 20 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // In a real app, this would call a contact form API endpoint
      // For now, we'll simulate submission
      await new Promise(resolve => setTimeout(resolve, 1500))

      toast.success('Thank you for reaching out! We\'ll get back to you within 24 hours.')
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        reason: 'general',
        subject: '',
        message: '',
      })
    } catch {
      toast.error('Failed to send message. Please try again or email us directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      details: [
        contact.email,
      ],
      description: 'We respond within 24 hours',
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: [
        contact.phone,
        'Mon–Sat, 10 AM – 7 PM IST',
      ],
      description: 'For urgent enquiries',
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      details: [
        contact.address,
      ],
      description: 'By appointment only',
    },
  ]

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-muted/30" aria-labelledby="contact-hero">
        <div className="container-sheaura">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              Get in Touch
            </span>
            <h1 id="contact-hero" className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground mb-6">
              We'd Love to Hear from You
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Have a question about our collections? Need help with a rental?
              Want to discuss a custom design? Our team is here to help.
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

                    <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      By submitting, you agree to our{' '}
                      <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-spacing bg-muted/30" aria-labelledby="faq-title">
        <div className="container-sheaura">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 id="faq-title" className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-lg">
              Quick answers to common questions
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'How does the rental process work?',
                a: 'Select rental items, add to your enquiry basket, and submit. Our team will confirm availability, pricing, and arrange delivery. You pay the rental fee + refundable deposit. After your event, we arrange pickup and refund the deposit upon safe return.',
              },
              {
                q: 'Can I try jewellery before purchasing?',
                a: 'Yes! You can rent pieces to try them before deciding to purchase. If you fall in love with a rented item, the rental fee can often be applied towards the purchase price.',
              },
              {
                q: 'What is your return policy?',
                a: 'Purchased items can be returned within 14 days in original condition with certificates. Rental items must be returned by the agreed date. Custom designs are non-returnable.',
              },
              {
                q: 'Do you offer international shipping?',
                a: 'Currently we ship across India. International shipping is available on request — please contact us for a custom quote.',
              },
              {
                q: 'Are your products authentic?',
                a: 'Absolutely. Every piece comes with a certificate of authenticity. We source directly from certified manufacturers and artisans.',
              },
              {
                q: 'Can I customize a piece?',
                a: 'Yes, we offer custom design services. Contact our team with your vision, and our designers will create a unique piece for you.',
              },
            ].map((faq, index) => (
              <details key={index} className="group bg-card border border-border rounded-xl p-6">
                <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-foreground">
                  {faq.q}
                  <span className="text-primary group-open:rotate-180 transition-transform">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="text-muted-foreground mt-4 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-spacing">
        <div className="container-sheaura text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-foreground mb-4">
              Prefer a Personal Consultation?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Book a private appointment at our Mumbai boutique or a virtual consultation.
              Our experts will guide you through our collections.
            </p>
            <Button size="lg" variant="outline" onClick={() => window.open('mailto:appointments@sheaura.com')}>
              <Mail className="h-4 w-4 mr-2" />
              Book an Appointment
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}