import 'dotenv/config'
import { db, closePool } from './index.js'
import { categories, products, productImages } from './schema.js'
import { eq } from 'drizzle-orm'

const INITIAL_CATEGORIES = [
  {
    name: 'Bridal Jewellery Sets',
    slug: 'bridal-ornament-sets',
    description: 'Complete bridal jewellery sets, haaram, choker, maang tikka, and vaddanam collections',
    displayOrder: 1,
  },
  {
    name: 'Necklaces & Chokers',
    slug: 'necklaces-chokers',
    description: 'Traditional and contemporary handcrafted necklaces for weddings and celebrations',
    displayOrder: 2,
  },
  {
    name: 'Earrings & Jhumkas',
    slug: 'earrings-jhumkas',
    description: 'Handcrafted bridal earrings, chandbalis, and statement jhumkas',
    displayOrder: 3,
  },
  {
    name: 'Bangles & Vaddanams',
    slug: 'bangles-vaddanams',
    description: 'Traditional bridal waistbands, kadas, and temple jewellery bangles',
    displayOrder: 4,
  },
]

const SAMPLE_PRODUCTS = [
  {
    itemCode: 'SH-001',
    name: 'Royal Antique Matte Gold Choker Set',
    slug: 'royal-antique-matte-gold-choker-set',
    categorySlug: 'necklaces-chokers',
    shortDescription: 'Exquisite antique gold polish choker necklace with matching jhumkas and delicate pearl drops.',
    description: 'Crafted with premium brass alloy and finished in rich 22k matte gold micro-plating. Features hand-set ruby-tinted kemp stones and cluster pearl embellishments. Includes adjustable dori thread for a comfortable custom fit.',
    salePrice: '2499',
    rentalPrice: '1299',
    mode: 'both' as const,
    stockQuantity: 5,
    availability: 'available' as const,
    isPublished: true,
    isFeatured: true,
    careInstructions: 'Avoid direct contact with water, perfumes, and sprays. Store in an airtight pouch and wipe gently with a soft dry cloth after use.',
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
  },
  {
    itemCode: 'SH-002',
    name: 'Grand Temple Kemp Stone Bridal Haaram Set',
    slug: 'grand-temple-kemp-stone-bridal-haaram-set',
    categorySlug: 'bridal-ornament-sets',
    shortDescription: 'Opulent traditional temple long haaram set with grand goddess pendant and matching chandbalis.',
    description: 'A breathtaking bridal statement piece embodying South Indian heritage artistry. Features intricate Lakshmi motif engraving surrounded by high-grade red & green kemp stones with clustered hanging pearls.',
    salePrice: '4999',
    rentalPrice: '2499',
    mode: 'both' as const,
    stockQuantity: 3,
    availability: 'available' as const,
    isPublished: true,
    isFeatured: true,
    careInstructions: 'Keep in the provided velvet case. Protect from humidity and cosmetics.',
    imageUrl: 'https://images.unsplash.com/photo-1611591475152-473211dbbbdb?w=800&auto=format&fit=crop&q=80',
  },
  {
    itemCode: 'SH-003',
    name: 'Kundan & Pearl Heritage Chandbali Earrings',
    slug: 'kundan-pearl-heritage-chandbali-earrings',
    categorySlug: 'earrings-jhumkas',
    shortDescription: 'Intricately handcrafted crescent chandbalis with jadau kundan work and seed pearl drops.',
    description: 'Stunning festive earrings crafted with foil-backed kundan stones and delicate meenakari detailing on the reverse. Lightweight and comfortable for day-long festive wear.',
    salePrice: '1299',
    rentalPrice: '699',
    mode: 'both' as const,
    stockQuantity: 8,
    availability: 'available' as const,
    isPublished: true,
    isFeatured: true,
    careInstructions: 'Do not bend or expose to alcohol-based perfumes.',
    imageUrl: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80',
  },
  {
    itemCode: 'SH-004',
    name: 'Intricate Matte Gold Temple Kada Bangles (Set of 2)',
    slug: 'intricate-matte-gold-temple-kada-bangles',
    categorySlug: 'bangles-vaddanams',
    shortDescription: 'Royal openable temple kada bangles with peacock carvings and ruby kemp accents.',
    description: 'Classic antique kada bangles featuring screw-hinge opening for effortless wear. Styled with floral and peacock motifs in deep matte antique gold finish.',
    salePrice: '1799',
    rentalPrice: '899',
    mode: 'both' as const,
    stockQuantity: 6,
    availability: 'available' as const,
    isPublished: true,
    isFeatured: true,
    careInstructions: 'Wipe with dry microfiber cloth before storing in original box.',
    imageUrl: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800&auto=format&fit=crop&q=80',
  },
  {
    itemCode: 'SH-005',
    name: 'Royal Emerald Green & Polki Floral Choker Set',
    slug: 'royal-emerald-green-polki-floral-choker-set',
    categorySlug: 'necklaces-chokers',
    shortDescription: 'Regal polki choker with radiant emerald green bead drops and matching earrings.',
    description: 'A contemporary royal masterpiece designed for sangeet and reception celebrations. Adorned with uncut polki crystals and lush emerald droplet beads.',
    salePrice: '2899',
    rentalPrice: '1499',
    mode: 'both' as const,
    stockQuantity: 4,
    availability: 'available' as const,
    isPublished: true,
    isFeatured: true,
    careInstructions: 'Store flat in airtight box to protect bead strings.',
    imageUrl: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=800&auto=format&fit=crop&q=80',
  },
  {
    itemCode: 'SH-006',
    name: 'Traditional South Indian Kemp Vaddanam (Waistband)',
    slug: 'traditional-south-indian-kemp-vaddanam',
    categorySlug: 'bangles-vaddanams',
    shortDescription: 'Grand bridal waist belt with Lakshmi motif, ghungroo bells, and adjustable chain.',
    description: 'The pinnacle of traditional South Indian bridal adornment. Features intricate temple architecture detailing, sparkling kemp stones, and gold bead drops.',
    salePrice: '3499',
    rentalPrice: '1799',
    mode: 'both' as const,
    stockQuantity: 3,
    availability: 'available' as const,
    isPublished: true,
    isFeatured: true,
    careInstructions: 'Handle with care. Store wrapped in cotton cloth.',
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
  },
]

async function main() {
  console.log('🌱 Checking and seeding Sheaura luxury jewellery catalogue...')

  const categoryMap = new Map<string, string>()

  for (const cat of INITIAL_CATEGORIES) {
    const existing = await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1)
    if (existing.length === 0) {
      const [inserted] = await db.insert(categories).values(cat).returning()
      categoryMap.set(cat.slug, inserted.id)
      console.log(`  + Created category: ${cat.name}`)
    } else {
      categoryMap.set(cat.slug, existing[0].id)
    }
  }

  // Seed sample products if none exist
  const existingProducts = await db.select().from(products).limit(1)
  if (existingProducts.length === 0) {
    console.log('🌱 Adding luxury fashion jewellery catalogue pieces...')
    for (const item of SAMPLE_PRODUCTS) {
      const categoryId = categoryMap.get(item.categorySlug) || ''
      const { categorySlug, imageUrl, ...productData } = item

      const [newProduct] = await db
        .insert(products)
        .values({
          ...productData,
          categoryId: categoryId as string,
        })
        .returning()

      if (imageUrl) {
        await db.insert(productImages).values({
          productId: newProduct.id,
          url: imageUrl,
          altText: item.name,
          isPrimary: true,
          displayOrder: 1,
        })
      }

      console.log(`  + Created jewellery piece: [${item.itemCode}] ${item.name}`)
    }
  }

  console.log('✅ Sheaura database initialization complete!')
  await closePool()
  process.exit(0)
}

main().catch(async (err) => {
  console.error('❌ Seeding failed:', err)
  await closePool()
  process.exit(1)
})