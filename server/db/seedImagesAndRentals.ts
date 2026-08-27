import 'dotenv/config'
import { db } from './index.js'
import { products, categories, productImages } from './schema.js'
import { eq, sql, inArray } from 'drizzle-orm'

// Curated high-resolution jewellery, cosmetics, and ornament product image URLs from Unsplash
const CATEGORY_IMAGES: Record<string, string> = {
  'gold-jewellery': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80',
  'diamond-jewellery': 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80',
  cosmetics: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
  'rental-ornaments': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80',
  // Legacy slugs (in case old data exists)
  jewellery: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80',
  ornaments: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80',
}

const PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1611591475777-233cd754248d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1588444839799-eb00f490465c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=800&q=80',
]

// Excluded SALE_ONLY terms per business rules
const SALE_ONLY_PATTERNS = [
  '%earring%',
  '%earings%',
  '%gc ear ring%',
  '%ear chain%',
  '%jhumka%',
  '%bangle%',
  '%bang%',
  '%kada%',
  '%bracelet%',
  '%hand chain%',
]

async function seed() {
  console.log('--- Starting Fast Rental & Image Seeding ---')

  // 1. Update category image URLs
  const catList = await db.select().from(categories)
  for (const cat of catList) {
    if (CATEGORY_IMAGES[cat.slug]) {
      await db
        .update(categories)
        .set({ imageUrl: CATEGORY_IMAGES[cat.slug], updatedAt: new Date() })
        .where(eq(categories.id, cat.id))
      console.log(`Updated category image for '${cat.name}'`)
    }
  }

  // 2. Fetch all products
  const allProds = await db.select().from(products)

  // 3. Prepare product updates
  const candidateIds: string[] = []
  for (const prod of allProds) {
    const nameLower = prod.name.toLowerCase()
    const isSaleOnly = SALE_ONLY_PATTERNS.some((pattern) => {
      const clean = pattern.replace(/%/g, '')
      return nameLower.includes(clean)
    })

    if (!isSaleOnly) {
      candidateIds.push(prod.id)
    }
  }

  if (candidateIds.length > 0) {
    // Bulk update candidate products to 'both' mode
    const chunkSize = 50
    for (let i = 0; i < candidateIds.length; i += chunkSize) {
      const chunk = candidateIds.slice(i, i + chunkSize)
      await db
        .update(products)
        .set({
          mode: 'both',
          rentalPrice: sql`ROUND(COALESCE(sale_price, 1500) * 0.20, 2)`,
          depositAmount: sql`ROUND(COALESCE(sale_price, 1500) * 0.50, 2)`,
          rentalDurationDays: 7,
          updatedAt: new Date(),
        })
        .where(inArray(products.id, chunk))
    }
    console.log(`Bulk updated ${candidateIds.length} candidate products to Sale & Rental mode.`)
  }

  // 4. Seed primary product images in bulk
  const existingImages = await db.select().from(productImages)
  const productsWithImages = new Set(existingImages.map((img) => img.productId))

  const newImagesToInsert = []
  for (let i = 0; i < allProds.length; i++) {
    const prod = allProds[i]
    if (!productsWithImages.has(prod.id)) {
      const imgUrl = PRODUCT_IMAGES[i % PRODUCT_IMAGES.length]
      newImagesToInsert.push({
        productId: prod.id,
        url: imgUrl,
        altText: prod.name,
        displayOrder: 0,
        isPrimary: true,
      })
    }
  }

  if (newImagesToInsert.length > 0) {
    const chunkSize = 100
    for (let i = 0; i < newImagesToInsert.length; i += chunkSize) {
      const chunk = newImagesToInsert.slice(i, i + chunkSize)
      await db.insert(productImages).values(chunk)
    }
    console.log(`Bulk inserted ${newImagesToInsert.length} product images.`)
  }

  console.log('--- Fast Seeding Completed Successfully ---')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
