import 'dotenv/config'
import { db, closePool } from './index.js'
import { categories } from './schema.js'
import { eq } from 'drizzle-orm'

const INITIAL_CATEGORIES = [
  {
    name: 'Bridal Ornament Sets',
    slug: 'bridal-ornament-sets',
    description: 'Complete bridal jewellery sets, haaram, choker, maang tikka, and vaddanam collections',
    displayOrder: 1,
  },
  {
    name: 'Necklaces & Chokers',
    slug: 'necklaces-chokers',
    description: 'Traditional and contemporary rental necklaces for weddings and special occasions',
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

async function main() {
  console.log('🌱 Checking and seeding initial Sheaura catalogue categories...')

  for (const cat of INITIAL_CATEGORIES) {
    const existing = await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1)
    if (existing.length === 0) {
      await db.insert(categories).values(cat)
      console.log(`  + Created category: ${cat.name}`)
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