/**
 * Sheaura Luxury Fashion Jewellery — Server WhatsApp Helper
 * Safely constructs and encodes WhatsApp enquiry and order links for single and multi-item selections.
 */

export interface EnquiryItemRef {
  itemCode: string
  name: string
  price?: string | number | null
}

export interface WhatsAppEnquiryOptions {
  items: EnquiryItemRef[]
  customerName?: string
  preferredDate?: string
  note?: string
  whatsappNumber?: string
  brandName?: string
}

/**
 * Format raw WhatsApp phone number to digits only (e.g., '919995098294')
 */
export function formatWhatsAppNumber(phone?: string): string {
  if (!phone || phone === '[PHONE NUMBER]' || phone === '[WHATSAPP NUMBER OR LINK]') {
    return '919995098294'
  }
  const digits = phone.replace(/\D/g, '')
  // If 10 digits without country code, assume India (+91)
  if (digits.length === 10) {
    return `91${digits}`
  }
  return digits || '919995098294'
}

/**
 * Generate formatted, polite plain-text message for WhatsApp fashion jewellery order enquiry
 */
export function generateWhatsAppMessage(options: WhatsAppEnquiryOptions): string {
  const brand = options.brandName || 'Sheaura'
  const lines: string[] = []

  lines.push(`Hello ${brand}, I would like to order / enquire about your handcrafted fashion jewellery:`)
  lines.push('')

  if (options.items.length === 0) {
    lines.push(`- General fashion jewellery enquiry`)
  } else {
    for (const item of options.items) {
      const code = item.itemCode ? item.itemCode.trim() : 'N/A'
      const name = item.name ? item.name.trim() : 'Fashion Jewellery'
      const priceStr = item.price ? ` — ₹${Number(item.price).toLocaleString('en-IN')}` : ''
      lines.push(`• [${code}] ${name}${priceStr}`)
    }
  }

  lines.push('')

  if (options.customerName && options.customerName.trim()) {
    lines.push(`Customer Name: ${options.customerName.trim()}`)
  }

  if (options.preferredDate && options.preferredDate.trim()) {
    lines.push(`Required By: ${options.preferredDate.trim()}`)
  }

  if (options.note && options.note.trim()) {
    lines.push(`Special Request / Size: ${options.note.trim()}`)
  }

  lines.push(`Please confirm product availability, custom sizing, and dispatch timelines. Thank you!`)

  return lines.join('\n')
}

/**
 * Construct safe wa.me URL with strictly encoded message parameter
 */
export function buildWhatsAppUrl(options: WhatsAppEnquiryOptions): string {
  const cleanPhone = formatWhatsAppNumber(options.whatsappNumber)
  const message = generateWhatsAppMessage(options)
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}
