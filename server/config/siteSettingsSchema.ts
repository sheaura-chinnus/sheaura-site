import { z } from 'zod'

// Allowlisted homepage section IDs
export const ALLOWED_HOMEPAGE_SECTIONS = [
  'hero',
  'trustBadges',
  'categories',
  'featuredProducts',
  'rentalProcess',
  'cta',
] as const

export type HomepageSectionId = typeof ALLOWED_HOMEPAGE_SECTIONS[number]

export const ALLOWED_SETTING_KEYS = [
  // Brand & Identity
  'brandName',
  'brandTagline',
  'logoAssetId',
  'logoUrl',
  'logoAltText',
  'markUrl',

  // Hero Section
  'heroEyebrow',
  'heroHeading',
  'heroSupportingText',
  'heroPrimaryCtaLabel',
  'heroPrimaryCtaLink',
  'heroSecondaryCtaLabel',
  'heroSecondaryCtaLink',

  // Homepage Sections
  'homepageSectionVisibility',
  'homepageSectionOrder',
  'sectionRentalOrnamentsTitle',
  'sectionRentalOrnamentsDesc',
  'sectionSaleProductsTitle',
  'sectionSaleProductsDesc',
  'sectionCosmeticsTitle',
  'sectionCosmeticsDesc',
  'sectionOccasionItemsTitle',
  'sectionOccasionItemsDesc',

  // About Story
  'aboutStory',

  // Contact Details
  'contactEmail',
  'contactPhone',
  'whatsappNumber',
  'locationServiceArea',
  'businessHours',
  'instagramUrl',
  'facebookUrl',
  'twitterUrl',

  // Policies
  'rentalPolicyContent',
  'shippingPolicyContent',
  'paymentPolicyContent',
  'refundPolicyContent',
  'privacyPolicyContent',
  'termsPolicyContent',

  // Navigation, Footer & SEO
  'footerText',
  'copyrightText',
  'navRentalOrnamentsLabel',
  'seoMetaTitle',
  'seoMetaDescription',
  'seoSocialPreviewText',

  // Announcement Banner
  'announcementEnabled',
  'announcementText',
  'announcementCtaLabel',
  'announcementCtaLink',
  'announcementStartDate',
  'announcementEndDate',
] as const

export type AllowedSettingKey = typeof ALLOWED_SETTING_KEYS[number]

// Default settings with safe, accurate copy
export const DEFAULT_SITE_SETTINGS: Record<AllowedSettingKey, string> = {
  brandName: 'Sheaura',
  brandTagline: 'Exquisite Imitation Jewellery, Cosmetics & Occasion Ornaments',
  logoAssetId: '',
  logoUrl: '',
  logoAltText: 'Sheaura — Timeless Elegance',
  markUrl: '',

  heroEyebrow: 'Occasion & Festive Collection',
  heroHeading: 'Timeless Elegance with Curated Imitation Jewellery & Fashion Ornaments',
  heroSupportingText: 'Discover handcrafted costume jewellery, premium cosmetics, and grand ornaments curated for weddings, parties, and celebrations — available for direct purchase.',
  heroPrimaryCtaLabel: 'Shop Collection',
  heroPrimaryCtaLink: '/shop',
  heroSecondaryCtaLabel: 'How to Order',
  heroSecondaryCtaLink: '#how-to-order',

  homepageSectionVisibility: JSON.stringify({
    hero: true,
    trustBadges: true,
    categories: true,
    featuredProducts: true,
    rentalProcess: true,
    cta: true,
  }),
  homepageSectionOrder: JSON.stringify(ALLOWED_HOMEPAGE_SECTIONS),
  sectionRentalOrnamentsTitle: 'How to Order on WhatsApp',
  sectionRentalOrnamentsDesc: 'A seamless 4-step concierge experience for ordering your favourite handcrafted jewellery',
  sectionSaleProductsTitle: 'Fashion & Costume Jewellery',
  sectionSaleProductsDesc: 'Intricately designed imitation jewellery crafted for modern celebrations',
  sectionCosmeticsTitle: 'Cosmetics & Beauty',
  sectionCosmeticsDesc: 'Curated beauty products and makeup essentials to enhance your radiance',
  sectionOccasionItemsTitle: 'Occasion Accessories',
  sectionOccasionItemsDesc: 'Hair accessories, clutches, and styling accents for your special day',

  aboutStory: 'At Sheaura, we celebrate elegance and festive splendor. Our collections bring you exquisite fashion jewellery, premium beauty products, and curated occasion ornaments that make every occasion unforgettable, without the extravagant expense of fine jewellery.',

  contactEmail: 'hello@sheaura.com',
  contactPhone: '+91 98765 43210',
  whatsappNumber: '+91 98765 43210',
  locationServiceArea: 'Mumbai, Maharashtra & Pan-India Service',
  businessHours: 'Mon - Sat: 10:00 AM - 8:00 PM IST',
  instagramUrl: 'https://instagram.com/sheaura',
  facebookUrl: '',
  twitterUrl: '',

  rentalPolicyContent: 'Our customer support team is available on WhatsApp and email to assist with sizing, selection, and orders.',
  shippingPolicyContent: 'We provide insured pan-India delivery. Orders are typically dispatched within 24–48 hours. Express delivery is available for select metropolitan areas.',
  paymentPolicyContent: 'We accept major debit and credit cards, UPI, net banking, and verified online payments. Cash on delivery is available for select pincodes.',
  refundPolicyContent: 'Unused sale items in original packaging may be returned within 7 days of delivery. Custom items and damaged packaging are non-refundable once dispatched.',
  privacyPolicyContent: 'Sheaura values your privacy. We collect only the information necessary to process orders, manage enquiries, and provide customer support. We never sell your personal data.',
  termsPolicyContent: 'By using Sheaura, you agree to our terms of service. All imitation jewellery, cosmetics, and occasion ornaments are provided subject to inventory availability and confirmation.',

  footerText: 'Timeless elegance for every occasion. Curated fashion & costume jewellery, premium cosmetics, and festive occasion ornaments.',
  copyrightText: '© 2026 Sheaura. All rights reserved.',
  navRentalOrnamentsLabel: 'Rental Ornaments',
  seoMetaTitle: 'Sheaura — Imitation Jewellery, Cosmetics & Occasion Ornaments',
  seoMetaDescription: 'Curated imitation jewellery, premium beauty cosmetics, and festive occasion ornaments. Order online with pan-India delivery.',
  seoSocialPreviewText: 'Timeless elegance: explore fashion jewellery, cosmetics, and occasion ornaments at Sheaura.',

  announcementEnabled: 'false',
  announcementText: '',
  announcementCtaLabel: '',
  announcementCtaLink: '',
  announcementStartDate: '',
  announcementEndDate: '',
}

// Sanitize plain text (strip tags, dangerous characters)
export function sanitizePlainText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

// Validate single setting value based on key
export function validateSetting(key: string, value: string | undefined): { valid: boolean; error?: string } {
  if (!ALLOWED_SETTING_KEYS.includes(key as AllowedSettingKey)) {
    return { valid: false, error: `Disallowed setting key: ${key}` }
  }

  const val = value ?? ''

  // Length limits based on key type
  if (key.endsWith('Content') || key === 'aboutStory') {
    if (val.length > 10000) return { valid: false, error: `${key} exceeds 10,000 characters` }
  } else if (key === 'heroSupportingText' || key === 'footerText' || key.endsWith('Desc')) {
    if (val.length > 1000) return { valid: false, error: `${key} exceeds 1,000 characters` }
  } else if (key === 'heroHeading' || key === 'seoMetaDescription' || key === 'seoSocialPreviewText') {
    if (val.length > 300) return { valid: false, error: `${key} exceeds 300 characters` }
  } else {
    if (val.length > 255) return { valid: false, error: `${key} exceeds 255 characters` }
  }

  // URL / route safety validation
  if (key.endsWith('Link') && val) {
    // Only allow safe internal routes (starting with /) or safe https:// URLs
    if (!val.startsWith('/') && !val.startsWith('https://')) {
      return { valid: false, error: `${key} must start with / or https://` }
    }
  }

  // Specific validations
  if (key === 'contactEmail' && val) {
    const emailResult = z.string().email().safeParse(val)
    if (!emailResult.success) return { valid: false, error: 'Invalid email address' }
  }

  if (key === 'announcementEnabled' && val) {
    if (val !== 'true' && val !== 'false') return { valid: false, error: 'announcementEnabled must be true or false' }
  }

  if (key === 'homepageSectionVisibility' && val) {
    try {
      const parsed = JSON.parse(val)
      if (typeof parsed !== 'object' || parsed === null) return { valid: false, error: 'Invalid section visibility JSON' }
      for (const sectionKey of Object.keys(parsed)) {
        if (!ALLOWED_HOMEPAGE_SECTIONS.includes(sectionKey as HomepageSectionId)) {
          return { valid: false, error: `Invalid section ID in visibility: ${sectionKey}` }
        }
      }
    } catch {
      return { valid: false, error: 'homepageSectionVisibility must be valid JSON' }
    }
  }

  if (key === 'homepageSectionOrder' && val) {
    try {
      const parsed = JSON.parse(val)
      if (!Array.isArray(parsed)) return { valid: false, error: 'homepageSectionOrder must be an array' }
      for (const sectionId of parsed) {
        if (!ALLOWED_HOMEPAGE_SECTIONS.includes(sectionId)) {
          return { valid: false, error: `Invalid section ID in order: ${sectionId}` }
        }
      }
    } catch {
      return { valid: false, error: 'homepageSectionOrder must be valid JSON' }
    }
  }

  return { valid: true }
}
