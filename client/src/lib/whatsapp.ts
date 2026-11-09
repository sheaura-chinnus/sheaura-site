/**
 * Sheaura Luxury Fashion Jewellery — WhatsApp Order & Enquiry Generator
 * Safely constructs and encodes WhatsApp enquiry and order links for single and multi-item selections.
 */

export interface EnquiryItemRef {
  itemCode: string
  name: string
  quantity?: number
  price?: string | number | null
}

export interface WhatsAppEnquiryOptions {
  items: EnquiryItemRef[]
  customerName?: string
  customerPhone?: string
  phone?: string
  deliveryAddress?: string
  pincode?: string
  preferredDate?: string
  note?: string
  customSizing?: string
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
      const qtyStr = item.quantity && item.quantity > 1 ? ` (Qty: ${item.quantity})` : ''
      const numPrice = item.price ? Number(item.price) : 0
      const priceStr = numPrice > 0 ? `₹${numPrice.toLocaleString('en-IN')}` : 'Price on Request'
      lines.push(`• [${code}] ${name}${qtyStr} — ${priceStr}`)
    }
  }

  lines.push('')

  if (options.customerName && options.customerName.trim()) {
    lines.push(`Customer Name: ${options.customerName.trim()}`)
  }

  const custPhone = (options.customerPhone || options.phone)?.trim()
  if (custPhone) {
    lines.push(`Phone: ${custPhone}`)
  }

  const address = options.deliveryAddress?.trim()
  const pin = options.pincode?.trim()
  if (address || pin) {
    const fullAddr = [address, pin ? `PIN: ${pin}` : ''].filter(Boolean).join(', ')
    lines.push(`Delivery Address: ${fullAddr}`)
  }

  if (options.preferredDate && options.preferredDate.trim()) {
    lines.push(`Required By: ${options.preferredDate.trim()}`)
  }

  const specialNote = options.customSizing?.trim() || options.note?.trim()
  if (specialNote) {
    lines.push(`Special Request / Custom Sizing: ${specialNote}`)
  }

  lines.push('')
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
