/**
 * Sheaura Rental Ornaments — WhatsApp Enquiry Generator
 * Safely constructs and encodes WhatsApp enquiry links for single and multi-item enquiries.
 */

export interface EnquiryItemRef {
  itemCode: string
  name: string
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
 * Format raw WhatsApp phone number to digits only (e.g., '919876543210')
 */
export function formatWhatsAppNumber(phone?: string): string {
  if (!phone) return '919876543210' // Default Sheaura contact
  const digits = phone.replace(/\D/g, '')
  // If 10 digits without country code, assume India (+91)
  if (digits.length === 10) {
    return `91${digits}`
  }
  return digits || '919876543210'
}

/**
 * Generate formatted, polite plain-text message for WhatsApp enquiry
 */
export function generateWhatsAppMessage(options: WhatsAppEnquiryOptions): string {
  const brand = options.brandName || 'Sheaura'
  const lines: string[] = []

  lines.push(`Hello ${brand}, I would like to enquire about these rental ornaments:`)

  if (options.items.length === 0) {
    lines.push(`- General rental enquiry`)
  } else {
    for (const item of options.items) {
      const code = item.itemCode ? item.itemCode.trim() : 'N/A'
      const name = item.name ? item.name.trim() : 'Rental Ornament'
      lines.push(`- Item code: ${code} — ${name}`)
    }
  }

  if (options.customerName && options.customerName.trim()) {
    lines.push(`My Name: ${options.customerName.trim()}`)
  }

  if (options.preferredDate && options.preferredDate.trim()) {
    lines.push(`Preferred date: ${options.preferredDate.trim()}`)
  }

  if (options.note && options.note.trim()) {
    lines.push(`Note: ${options.note.trim()}`)
  }

  lines.push(
    `Please confirm availability and rental terms. I understand this message is only an enquiry and not a confirmed booking.`
  )

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
