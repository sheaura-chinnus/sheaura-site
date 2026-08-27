import 'dotenv/config'
import { db, closePool } from './index.js'
import { categories, products, productImages, enquiries, enquiryItems } from './schema.js'
import xlsx from 'xlsx'
import path from 'path'
import crypto from 'crypto'

// High resolution curated Unsplash image fallback pools by category/item type
const IMAGE_POOLS: Record<string, string[]> = {
  jewellery: [
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1611591475777-233cd754248d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1588444839799-eb00f490465c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=800&q=80',
  ],
  cosmetics: [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
  ],
  ornaments: [
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
  ],
  hair: [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1584297091622-af8e64c399dd?auto=format&fit=crop&w=800&q=80',
  ]
}

const CATEGORY_DEFINITIONS = [
  {
    name: 'Rental Ornaments & Sets',
    slug: 'rental-ornaments',
    description: 'Exquisite bridal ornament sets, heavy traditional necklaces, and party accessories available for purchase or rental',
    displayOrder: 1,
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Imitation Jewellery',
    slug: 'imitation-jewellery',
    description: 'Handcrafted fashion jewellery including earrings, rings, bangles, and stylish chains',
    displayOrder: 2,
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Cosmetics & Beauty',
    slug: 'cosmetics',
    description: 'Premium cosmetics, lipsticks, eye makeup, skincare, and nail polishes',
    displayOrder: 3,
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Hair Accessories & Bindi',
    slug: 'hair-accessories',
    description: 'Trendy hair clips, bands, buns, extensions, bindis, and styling essentials',
    displayOrder: 4,
    imageUrl: 'https://images.unsplash.com/photo-1584297091622-af8e64c399dd?auto=format&fit=crop&w=1200&q=80',
  },
]

function getTargetCategorySlug(rawCategory: string, itemName: string): string {
  const catUpper = rawCategory.toUpperCase()
  const nameUpper = itemName.toUpperCase()

  if (catUpper.includes('HAIR') || nameUpper.includes('HAIR') || nameUpper.includes('BINDI') || nameUpper.includes('BINDHI') || nameUpper.includes('RUBBER BAND') || nameUpper.includes('COMB')) {
    return 'hair-accessories'
  }
  if (catUpper.includes('COSMETIC') || nameUpper.includes('NAIL') || nameUpper.includes('LIPSTICK') || nameUpper.includes('KAJAL') || nameUpper.includes('FACE WASH') || nameUpper.includes('CREAM') || nameUpper.includes('EYE')) {
    return 'cosmetics'
  }
  if (nameUpper.includes('NECKLACE') || nameUpper.includes('SET') || nameUpper.includes('MALA') || nameUpper.includes('MAALA') || catUpper.includes('ORNAMENT') || nameUpper.includes('CHOKER')) {
    return 'rental-ornaments'
  }
  return 'imitation-jewellery'
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function seedFromExcel() {
  console.log('🚀 Starting Excel Import from stock.xlsx...')

  const filePath = path.resolve(process.cwd(), 'stock.xlsx')
  const wb = xlsx.readFile(filePath)
  const ws = wb.Sheets['Sheet1']
  const rawData: any[][] = xlsx.utils.sheet_to_json(ws, { header: 1 })

  // 1. Seed categories
  console.log('📦 Seeding Categories...')
  for (const cat of CATEGORY_DEFINITIONS) {
    await db.insert(categories).values(cat).onConflictDoUpdate({
      target: categories.slug,
      set: { name: cat.name, description: cat.description, imageUrl: cat.imageUrl, displayOrder: cat.displayOrder }
    })
  }

  // Map category slug -> ID
  const catRecords = await db.select().from(categories)
  const categoryMap = new Map<string, string>()
  for (const c of catRecords) {
    categoryMap.set(c.slug, c.id)
  }

  // 2. Parse items from Excel
  console.log('📊 Parsing products from stock.xlsx...')
  const itemMap = new Map<string, {
    name: string
    code: string
    rawCategory: string
    mrps: number[]
    totalQty: number
  }>()

  let lastItemName = ''

  for (let i = 4; i < rawData.length; i++) {
    const row = rawData[i]
    if (!row || row.length === 0) continue

    const [_, itemCode, itemName, __, ___, ____, category, _____, ______, _______, mrp, quantity] = row

    const parsedMrp = parseFloat(mrp) || 0
    const parsedQty = parseInt(quantity) || 0

    if (itemName && String(itemName).trim() !== '') {
      const name = String(itemName).trim()
      lastItemName = name
      if (!itemMap.has(name)) {
        itemMap.set(name, {
          name,
          code: String(itemCode || ''),
          rawCategory: category ? String(category).trim() : 'General',
          mrps: [],
          totalQty: 0
        })
      }
      const item = itemMap.get(name)!
      if (parsedMrp > 0) item.mrps.push(parsedMrp)
      if (parsedQty > 0) item.totalQty += parsedQty
    } else if (lastItemName && itemMap.has(lastItemName)) {
      const item = itemMap.get(lastItemName)!
      if (parsedMrp > 0) item.mrps.push(parsedMrp)
      if (parsedQty > 0) item.totalQty += parsedQty
    }
  }

  console.log(`Found ${itemMap.size} parent product types in Excel.`)

  // 3. Process products for database insertion
  const slugCounts = new Map<string, number>()
  const productsToInsert = []
  const imagesToInsert = []

  let count = 0
  for (const [name, itemData] of itemMap.entries()) {
    count++
    let baseSlug = slugify(name) || `item-${count}`
    let finalSlug = baseSlug
    const existingCount = slugCounts.get(baseSlug) || 0
    if (existingCount > 0) {
      finalSlug = `${baseSlug}-${existingCount + 1}`
    }
    slugCounts.set(baseSlug, existingCount + 1)

    const targetCatSlug = getTargetCategorySlug(itemData.rawCategory, itemData.name)
    const categoryId = categoryMap.get(targetCatSlug) || categoryMap.get('imitation-jewellery')!

    const avgPrice = itemData.mrps.length
      ? Math.round(itemData.mrps.reduce((a, b) => a + b, 0) / itemData.mrps.length * 100) / 100
      : 150.00
    const minPrice = itemData.mrps.length ? Math.min(...itemData.mrps) : avgPrice

    const isRentalEligible = targetCatSlug === 'rental-ornaments' || minPrice >= 250 || name.toUpperCase().includes('NECKLACE') || name.toUpperCase().includes('SET') || name.toUpperCase().includes('MAALA')

    const mode = isRentalEligible ? 'both' : 'sale'
    const salePrice = String(minPrice > 0 ? minPrice.toFixed(2) : '150.00')
    const rentalPrice = isRentalEligible ? String(Math.max(50, Math.round(minPrice * 0.20)).toFixed(2)) : null
    const depositAmount = isRentalEligible ? String(Math.max(100, Math.round(minPrice * 0.40)).toFixed(2)) : null
    const rentalDurationDays = isRentalEligible ? 7 : null

    // Pick image pool
    const poolKey = targetCatSlug === 'cosmetics' ? 'cosmetics' : targetCatSlug === 'hair-accessories' ? 'hair' : targetCatSlug === 'rental-ornaments' ? 'ornaments' : 'jewellery'
    const imagePool = IMAGE_POOLS[poolKey]
    const imageUrl = imagePool[count % imagePool.length]

    const shortDesc = `${itemData.name} - Authentic Sheaura Stock Item (${itemData.rawCategory})`
    const desc = `High-quality ${itemData.name} from Sheaura inventory. Category: ${itemData.rawCategory}. Item code: ${itemData.code || 'N/A'}. Available for retail purchase${isRentalEligible ? ' or event rental' : ''}.`

    const tags = [targetCatSlug, itemData.rawCategory.toLowerCase(), itemData.name.toLowerCase().split(' ')[0]]
    const cleanTags = Array.from(new Set(tags.filter(t => t && t.length > 1)))

    const productId = crypto.randomUUID()

    productsToInsert.push({
      id: productId,
      name: itemData.name,
      slug: finalSlug,
      categoryId,
      description: desc,
      shortDescription: shortDesc,
      tags: cleanTags,
      mode: mode as 'sale' | 'rental' | 'both',
      salePrice,
      rentalPrice,
      rentalDurationDays,
      depositAmount,
      stockQuantity: Math.max(1, itemData.totalQty),
      availability: 'available' as const,
      isFeatured: count % 15 === 0, // feature 1 in 15 items
      isPublished: true,
      careInstructions: 'Store in a dry place. Keep away from direct moisture and chemicals.',
    })

    imagesToInsert.push({
      id: crypto.randomUUID(),
      productId,
      url: imageUrl,
      altText: itemData.name,
      displayOrder: 0,
      isPrimary: true,
    })
  }

  console.log(`Inserting ${productsToInsert.length} products into database...`)

  // Clear existing products, images, and enquiries safely
  await db.delete(enquiryItems)
  await db.delete(enquiries)
  await db.delete(productImages)
  await db.delete(products)

  // Chunk insert products
  const chunkSize = 50
  for (let i = 0; i < productsToInsert.length; i += chunkSize) {
    const chunk = productsToInsert.slice(i, i + chunkSize)
    await db.insert(products).values(chunk)
  }

  console.log(`Inserting ${imagesToInsert.length} product images into database...`)
  for (let i = 0; i < imagesToInsert.length; i += chunkSize) {
    const chunk = imagesToInsert.slice(i, i + chunkSize)
    await db.insert(productImages).values(chunk)
  }

  console.log('✅ Excel Stock Import Completed Successfully!')
}

seedFromExcel()
  .catch((err) => {
    console.error('❌ Excel Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await closePool()
  })
