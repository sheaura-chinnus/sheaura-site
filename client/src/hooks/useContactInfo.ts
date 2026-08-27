import { useSiteSettings } from './useSiteSettings'

export function useContactInfo() {
  const { data: settings } = useSiteSettings()

  const phone = settings?.contactPhone || settings?.phone || ''
  const email = settings?.contactEmail || settings?.email || ''
  const whatsapp = settings?.whatsappNumber || settings?.whatsapp || ''
  const address = settings?.locationServiceArea || settings?.address || ''
  const brandName = settings?.brandName || 'Sheaura'

  const rawPhoneClean = phone ? phone.replace(/\D/g, '') : ''
  const rawWhatsAppClean = whatsapp ? whatsapp.replace(/\D/g, '') : ''

  const phoneHref = rawPhoneClean ? `tel:+${rawPhoneClean}` : undefined
  const whatsappHref = rawWhatsAppClean
    ? `https://wa.me/${rawWhatsAppClean}`
    : whatsapp?.startsWith('http')
    ? whatsapp
    : undefined

  const emailHref = email ? `mailto:${email}` : undefined

  return {
    phone: phone || '[Configure Phone in Admin Settings]',
    email: email || '[Configure Email in Admin Settings]',
    whatsapp: whatsapp || '[Configure WhatsApp in Admin Settings]',
    address: address || '[Configure Address in Admin Settings]',
    brandName,
    phoneHref,
    whatsappHref,
    emailHref,
    hasPhone: Boolean(phone),
    hasEmail: Boolean(email),
    hasWhatsApp: Boolean(whatsapp),
    hasAddress: Boolean(address),
  }
}
