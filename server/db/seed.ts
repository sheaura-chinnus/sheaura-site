import { db } from './index.js'
import { categories, products, productImages, siteSettings, users } from './schema.js'
import { eq } from 'drizzle-orm'

const CATEGORIES = [
  {
    name: 'Jewellery',
    slug: 'jewellery',
    description: 'Exquisite handcrafted jewellery for every occasion',
    displayOrder: 1,
  },
  {
    name: 'Cosmetics',
    slug: 'cosmetics',
    description: 'Premium cosmetics and beauty essentials',
    displayOrder: 2,
  },
  {
    name: 'Ornaments',
    slug: 'ornaments',
    description: 'Decorative ornaments to elevate your space',
    displayOrder: 3,
  },
]

const PRODUCTS = [
  // Jewellery
  {
    name: 'Pearl Drop Earrings',
    slug: 'pearl-drop-earrings',
    categorySlug: 'jewellery',
    description: 'Elegant freshwater pearl drop earrings with 18k gold vermeil hooks. Perfect for weddings and special occasions.',
    shortDescription: 'Freshwater pearl drops with gold vermeil hooks',
    tags: ['pearls', 'gold', 'wedding', 'elegant'],
    mode: 'both' as const,
    salePrice: '12500.00',
    rentalPrice: '2500.00',
    rentalDurationDays: 7,
    depositAmount: '5000.00',
    stockQuantity: 5,
    availability: 'available' as const,
    isFeatured: true,
    isPublished: true,
    careInstructions: 'Store in a soft pouch. Avoid contact with perfumes and chemicals. Clean gently with a soft cloth.',
  },
  {
    name: 'Diamond Tennis Bracelet',
    slug: 'diamond-tennis-bracelet',
    categorySlug: 'jewellery',
    description: 'Classic diamond tennis bracelet with 2 carats total weight of VS clarity diamonds set in 18k white gold.',
    shortDescription: '2ct diamond tennis bracelet in 18k white gold',
    tags: ['diamonds', 'white gold', 'classic', 'luxury'],
    mode: 'sale' as const,
    salePrice: '185000.00',
    rentalPrice: null,
    rentalDurationDays: null,
    depositAmount: null,
    stockQuantity: 2,
    availability: 'available' as const,
    isFeatured: true,
    isPublished: true,
    careInstructions: 'Professional cleaning recommended annually. Store separately to prevent scratching.',
  },
  {
    name: 'Gold Filigree Necklace',
    slug: 'gold-filigree-necklace',
    categorySlug: 'jewellery',
    description: 'Handcrafted 22k gold filigree necklace with intricate traditional patterns. A timeless heirloom piece.',
    shortDescription: 'Handcrafted 22k gold filigree necklace',
    tags: ['gold', 'filigree', 'traditional', 'heirloom'],
    mode: 'both' as const,
    salePrice: '85000.00',
    rentalPrice: '8500.00',
    rentalDurationDays: 7,
    depositAmount: '25000.00',
    stockQuantity: 3,
    availability: 'available' as const,
    isFeatured: false,
    isPublished: true,
    careInstructions: 'Store flat in a lined box. Polish with a gold polishing cloth.',
  },
  // Cosmetics
  {
    name: 'Luxe Velvet Lipstick Set',
    slug: 'luxe-velvet-lipstick-set',
    categorySlug: 'cosmetics',
    description: 'Collection of 6 velvet-matte lipsticks in universally flattering shades. Long-wearing, hydrating formula.',
    shortDescription: '6-piece velvet matte lipstick collection',
    tags: ['lipstick', 'matte', 'velvet', 'set'],
    mode: 'sale' as const,
    salePrice: '4200.00',
    rentalPrice: null,
    rentalDurationDays: null,
    depositAmount: null,
    stockQuantity: 25,
    availability: 'available' as const,
    isFeatured: true,
    isPublished: true,
    careInstructions: 'Store in a cool, dry place. Cap tightly after use.',
  },
  {
    name: 'Radiant Glow Highlighter Palette',
    slug: 'radiant-glow-highlighter-palette',
    categorySlug: 'cosmetics',
    description: 'Quad highlighter palette with champagne, rose gold, bronze, and pearl shades. Buildable luminous finish.',
    shortDescription: '4-shade highlighter palette',
    tags: ['highlighter', 'palette', 'glow', 'luminous'],
    mode: 'sale' as const,
    salePrice: '3800.00',
    rentalPrice: null,
    rentalDurationDays: null,
    depositAmount: null,
    stockQuantity: 15,
    availability: 'available' as const,
    isFeatured: false,
    isPublished: true,
    careInstructions: 'Keep palette closed when not in use. Clean brushes regularly.',
  },
  {
    name: 'Silk Finish Foundation',
    slug: 'silk-finish-foundation',
    categorySlug: 'cosmetics',
    description: 'Weightless medium-coverage foundation with a natural silk finish. 30 shades. SPF 25. Hydrating formula.',
    shortDescription: 'Weightless silk finish foundation, 30 shades',
    tags: ['foundation', 'silk finish', 'spf', 'hydrating'],
    mode: 'sale' as const,
    salePrice: '3200.00',
    rentalPrice: null,
    rentalDurationDays: null,
    depositAmount: null,
    stockQuantity: 30,
    availability: 'available' as const,
    isFeatured: false,
    isPublished: true,
    careInstructions: 'Shake well before use. Store away from direct sunlight.',
  },
  // Ornaments
  {
    name: 'Crystal Chandelier Ornament',
    slug: 'crystal-chandelier-ornament',
    categorySlug: 'ornaments',
    description: 'Hand-cut crystal chandelier ornament with 50+ facets. Creates stunning light refractions. 12cm height.',
    shortDescription: 'Hand-cut crystal chandelier ornament',
    tags: ['crystal', 'chandelier', 'light', 'decor'],
    mode: 'both' as const,
    salePrice: '8500.00',
    rentalPrice: '1200.00',
    rentalDurationDays: 14,
    depositAmount: '2000.00',
    stockQuantity: 8,
    availability: 'available' as const,
    isFeatured: true,
    isPublished: true,
    careInstructions: 'Handle with clean hands. Dust with a soft brush. Avoid harsh cleaners.',
  },
  {
    name: 'Marble Sculpture Vase',
    slug: 'marble-sculpture-vase',
    categorySlug: 'ornaments',
    description: 'Hand-carved Carrara marble vase with organic sculptural form. Each piece unique. 25cm height.',
    shortDescription: 'Hand-carved Carrara marble sculptural vase',
    tags: ['marble', 'vase', 'sculpture', 'handcrafted'],
    mode: 'sale' as const,
    salePrice: '28000.00',
    rentalPrice: null,
    rentalDurationDays: null,
    depositAmount: null,
    stockQuantity: 4,
    availability: 'available' as const,
    isFeatured: false,
    isPublished: true,
    careInstructions: 'Clean with pH-neutral stone cleaner. Avoid acidic substances. Dry immediately.',
  },
  {
    name: 'Brass Geometric Candle Holders (Set of 3)',
    slug: 'brass-geometric-candle-holders',
    categorySlug: 'ornaments',
    description: 'Set of three brass geometric candle holders in varying heights. Matte brass finish. Taper candle compatible.',
    shortDescription: 'Set of 3 matte brass geometric candle holders',
    tags: ['brass', 'candle holders', 'geometric', 'set'],
    mode: 'both' as const,
    salePrice: '6500.00',
    rentalPrice: '950.00',
    rentalDurationDays: 7,
    depositAmount: '1500.00',
    stockQuantity: 12,
    availability: 'available' as const,
    isFeatured: false,
    isPublished: true,
    careInstructions: 'Polish with brass cleaner or lemon juice and baking soda. Dry thoroughly.',
  },
]

const SITE_SETTINGS = [
  { key: 'currency', value: '[CURRENCY, e.g. INR]', description: 'Currency code for display' },
  { key: 'country', value: '[COUNTRY OR SERVICE REGION]', description: 'Country or service region' },
  { key: 'phone', value: '[PHONE NUMBER]', description: 'Contact phone number' },
  { key: 'whatsapp', value: '[WHATSAPP NUMBER OR LINK]', description: 'WhatsApp contact link' },
  { key: 'email', value: '[EMAIL ADDRESS]', description: 'Contact email address' },
  { key: 'instagram', value: '[INSTAGRAM URL]', description: 'Instagram profile URL' },
  { key: 'domain', value: '[DOMAIN]', description: 'Production domain' },
  { key: 'depositPolicy', value: '[DEPOSIT POLICY]', description: 'Rental deposit policy description' },
  { key: 'deliveryPolicy', value: '[DELIVERY/PICKUP POLICY]', description: 'Delivery or pickup policy description' },
  { key: 'heroTitle', value: 'Sheaura — Timeless Elegance for Every Occasion', description: 'Hero section title' },
  { key: 'heroSubtitle', value: 'Discover exquisite jewellery, premium cosmetics, and curated ornaments. Available for purchase or rental.', description: 'Hero section subtitle' },
]

async function seed() {
  console.log('🌱 Starting database seed...')

  // Seed categories
  console.log('📦 Seeding categories...')
  for (const cat of CATEGORIES) {
    await db.insert(categories).values(cat).onConflictDoNothing({ target: categories.slug })
  }

  // Get category IDs
  const categoryMap = new Map<string, string>()
  const allCategories = await db.select().from(categories)
  for (const cat of allCategories) {
    categoryMap.set(cat.slug, cat.id)
  }

  // Seed products
  console.log('💎 Seeding products...')
  for (const prod of PRODUCTS) {
    const categoryId = categoryMap.get(prod.categorySlug)
    if (!categoryId) {
      console.warn(`Category not found for slug: ${prod.categorySlug}`)
      continue
    }

    const { categorySlug, ...productData } = prod
    await db.insert(products).values({
      ...productData,
      categoryId,
    }).onConflictDoNothing({ target: products.slug })
  }

  // Seed site settings
  console.log('⚙️ Seeding site settings...')
  for (const setting of SITE_SETTINGS) {
    await db.insert(siteSettings).values(setting).onConflictDoNothing({ target: siteSettings.key })
  }

  console.log('✅ Database seed completed!')
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$client.end()
  })