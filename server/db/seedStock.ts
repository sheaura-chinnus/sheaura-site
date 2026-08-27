import 'dotenv/config'
import XLSX from 'xlsx'
import { db } from './index.js'
import { categories, products } from './schema.js'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

const CONFIRMED_SALE_ONLY_PATTERNS = [
  /earring/i, /earing/i, /gc ear ring/i, /ear chain/i, /jhumka/i,
  /bangle/i, /gents kada/i, /mens kada/i, /men bracelet/i, /mens bracelet/i, /hand chain/i
]

function determineMode(name: string, rawCat: string): 'sale' | 'rental' | 'both' {
  for (const pattern of CONFIRMED_SALE_ONLY_PATTERNS) {
    if (pattern.test(name)) return 'sale'
  }
  const lower = (name + ' ' + rawCat).toLowerCase()
  if (lower.includes('necklace') || lower.includes('maala') || lower.includes('set') || lower.includes('bridal') || lower.includes('crown') || lower.includes('tiara') || lower.includes('ornament') || lower.includes('choker') || lower.includes('haar')) {
    return 'both'
  }
  return 'sale'
}

function mapCategorySlug(name: string, rawCat: string): string {
  const lower = (name + ' ' + rawCat).toLowerCase()
  if (lower.includes('cosmetic') || lower.includes('lipstick') || lower.includes('hair') || lower.includes('comb') || lower.includes('clip') || lower.includes('extension')) {
    return 'cosmetics'
  }
  if (lower.includes('ornament') || lower.includes('vase') || lower.includes('holder') || lower.includes('decor') || lower.includes('sculpture')) {
    return 'ornaments'
  }
  return 'jewellery'
}

function normalizeTitleCase(str: string): string {
  if (!str) return ''
  const trimmed = str.trim()
  if (trimmed === trimmed.toUpperCase() || trimmed === trimmed.toLowerCase()) {
    return trimmed.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
  }
  return trimmed
}

export async function runStockImport(commit: boolean = false) {
  console.log(`=== STAGE 5: SAFE STOCK IMPORT (${commit ? 'EXECUTE' : 'DRY RUN'}) ===\n`)

  const wb = XLSX.readFile('C:\\sheaurasite\\stock.xlsx')
  const ws = wb.Sheets['Sheet1']
  const rawData = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 })
  const rows = rawData.slice(4)

  const dbCats = await db.select().from(categories)
  const catMap = new Map<string, string>()
  dbCats.forEach(c => catMap.set(c.slug, c.id))

  const existingProducts = await db.select().from(products)
  const existingProductSlugs = new Map<string, string>()
  existingProducts.forEach(p => existingProductSlugs.set(p.slug, p.id))

  let inserted = 0
  let updated = 0
  let skipped = 0
  let flagged = 0

  interface ParsedItem {
    itemCode: string
    itemName: string
    rawCategory: string
    mrp: number
    totalQty: number
    barcodes: string[]
  }

  let currentProduct: ParsedItem | null = null
  const parsedProducts: ParsedItem[] = []

  rows.forEach((r) => {
    if (!r || r.length === 0 || (r.length === 1 && !r[0])) return

    const itemCode = r[1] !== undefined && r[1] !== null ? String(r[1]).trim() : ''
    const itemName = r[2] !== undefined && r[2] !== null ? String(r[2]).trim() : ''
    const rawCategory = r[6] !== undefined && r[6] !== null ? String(r[6]).trim() : ''
    const barcode = r[8] !== undefined && r[8] !== null ? String(r[8]).trim() : ''
    const mrp = Number(r[10]) || 0
    const qty = Math.max(0, Number(r[11]) || 0)

    if (itemCode !== '' || itemName !== '') {
      currentProduct = {
        itemCode,
        itemName,
        rawCategory,
        mrp,
        totalQty: 0,
        barcodes: []
      }
      parsedProducts.push(currentProduct)
    }

    if (currentProduct) {
      currentProduct.totalQty += qty
      if (mrp > 0 && currentProduct.mrp === 0) currentProduct.mrp = mrp
      if (barcode) currentProduct.barcodes.push(barcode)
      if (Number(r[11]) < 0 || mrp <= 0) flagged++
    }
  })

  console.log(`Parsed ${parsedProducts.length} product families from workbook.`)
  console.log(`Flagged rows (Zero MRP / Negative Quantity): ${flagged}`)

  const toInsert: (typeof products.$inferInsert)[] = []

  for (const p of parsedProducts) {
    const displayName = normalizeTitleCase(p.itemName || `Product ${p.itemCode}`)
    let slug = `${displayName}-${p.itemCode}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    if (!slug) slug = `product-${p.itemCode}`

    const catSlug = mapCategorySlug(p.itemName, p.rawCategory)
    const categoryId = catMap.get(catSlug) || dbCats[0].id
    const mode = determineMode(p.itemName, p.rawCategory)
    const isPublished = p.mrp > 0
    const stockQtyInt = Math.round(p.totalQty)
    const availability = stockQtyInt > 0 ? 'available' : 'out_of_stock'

    const existingId = existingProductSlugs.get(slug)

    if (existingId) {
      updated++
      if (commit) {
        await db.update(products).set({
          name: displayName,
          salePrice: p.mrp.toFixed(2),
          stockQuantity: stockQtyInt,
          availability,
          mode,
          isPublished,
          updatedAt: new Date(),
        }).where(eq(products.id, existingId))
      }
    } else {
      inserted++
      toInsert.push({
        id: uuidv4(),
        name: displayName,
        slug,
        categoryId,
        shortDescription: `${displayName} (${p.itemCode})`,
        description: `${displayName} - Premium quality ${catSlug} item. Item Code: ${p.itemCode}.`,
        tags: [catSlug, mode, p.itemCode.toLowerCase()],
        mode,
        salePrice: p.mrp.toFixed(2),
        rentalPrice: mode === 'both' ? (p.mrp * 0.15).toFixed(2) : null,
        rentalDurationDays: mode === 'both' ? 7 : null,
        depositAmount: mode === 'both' ? (p.mrp * 0.3).toFixed(2) : null,
        stockQuantity: stockQtyInt,
        availability,
        isFeatured: false,
        isPublished,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }

  if (commit && toInsert.length > 0) {
    // Insert in chunks of 50
    const chunkSize = 50
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize)
      await db.insert(products).values(chunk)
    }
  }

  console.log('\n=== IMPORT RESULT SUMMARY ===')
  console.log(`Action: ${commit ? 'COMMITTED TO DATABASE' : 'DRY RUN'}`)
  console.log(`Inserted Products: ${inserted}`)
  console.log(`Updated Products: ${updated}`)
  console.log(`Skipped/Duplicates: ${skipped}`)
  console.log(`Flagged Items: ${flagged}`)
}

const isCommit = process.argv.includes('--commit')
runStockImport(isCommit)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Import failed:', err)
    process.exit(1)
  })
