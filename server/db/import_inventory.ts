import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import * as XLSX from 'xlsx'
import { eq } from 'drizzle-orm'
import { db, closePool } from './index.js'
import { categories, products, productImages } from './schema.js'

interface ParsedProductRow {
  rawRowIndex: number
  itemCode: string
  name: string
  slug: string
  categoryName: string
  description?: string
  shortDescription?: string
  salePrice: string
  rentalPrice: string
  stockQuantity: number
  availability: 'available' | 'low_stock' | 'out_of_stock' | 'discontinued'
  mode: 'sale' | 'rental' | 'both'
  imageUrl?: string
  tags: string[]
  careInstructions?: string
}

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parsePrice(val: unknown): string {
  if (val === undefined || val === null || val === '') return '0.00'
  const cleaned = String(val).replace(/[^0-9.-]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) || num < 0 ? '0.00' : num.toFixed(2)
}

function parseStock(val: unknown): number {
  if (val === undefined || val === null || val === '') return 0
  const cleaned = String(val).replace(/[^0-9-]/g, '')
  const num = parseInt(cleaned, 10)
  return isNaN(num) || num < 0 ? 0 : num
}

function extractFieldValue(normalizedRow: Map<string, unknown>, possibleKeys: string[]): unknown {
  for (const key of possibleKeys) {
    if (normalizedRow.has(key)) {
      const val = normalizedRow.get(key)
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return val
      }
    }
  }
  return undefined
}

export async function runInventoryImport() {
  const args = process.argv.slice(2)
  let filePath = './stock.xlsx'
  let isDryRun = false

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      filePath = args[i + 1]
      i++
    } else if (args[i] === '--dry-run') {
      isDryRun = true
    }
  }

  const resolvedPath = path.resolve(process.cwd(), filePath)
  console.log('====================================================')
  console.log('  📦 SHEAURA INVENTORY INGESTION ENGINE')
  console.log('====================================================')
  console.log(`📁 File path: ${resolvedPath}`)
  console.log(`🔍 Mode: ${isDryRun ? 'DRY RUN (No database mutations)' : 'LIVE IMPORT (Upserting to database)'}`)
  console.log('----------------------------------------------------')

  if (!fs.existsSync(resolvedPath)) {
    console.error(`\n❌ Error: Stock spreadsheet file not found at: ${resolvedPath}`)
    console.error('👉 Please specify a valid file using: npm run db:import-stock -- --file <path-to-excel>')
    console.error('👉 Example: npm run db:import-stock -- --file ./sample_inventory.xlsx --dry-run\n')
    process.exit(1)
  }

  const xlsxLib = ((XLSX as unknown as { default?: typeof XLSX }).default?.readFile
    ? (XLSX as unknown as { default: typeof XLSX }).default
    : XLSX)

  let workbook: XLSX.WorkBook
  try {
    workbook = xlsxLib.readFile(resolvedPath)
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error(`\n❌ Error parsing Excel spreadsheet: ${errMsg}\n`)
    process.exit(1)
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    console.error('\n❌ Error: Excel workbook contains no sheets.\n')
    process.exit(1)
  }

  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rawRows = xlsxLib.utils.sheet_to_json<Record<string, unknown>>(sheet)

  if (!rawRows || rawRows.length === 0) {
    console.warn(`\n⚠️ Warning: First sheet (${sheetName}) contains no data rows.\n`)
    return
  }

  console.log(`📄 Reading sheet "${sheetName}": found ${rawRows.length} raw row(s).`)

  const itemCodeKeys = ['itemcode', 'sku', 'productcode', 'code', 'id', 'itemid', 'stylecode', 'barcode']
  const nameKeys = ['name', 'productname', 'title', 'producttitle', 'itemname', 'product']
  const categoryKeys = ['category', 'collection', 'categoryname', 'type', 'producttype', 'group']
  const priceKeys = ['price', 'saleprice', 'mrp', 'sellingprice', 'rate', 'amount', 'retailprice']
  const rentalPriceKeys = ['rentalprice', 'rent', 'rentprice', 'rental', 'hireprice']
  const stockKeys = ['stock', 'stockquantity', 'quantity', 'qty', 'count', 'units', 'inventory', 'availableqty']
  const descriptionKeys = ['description', 'desc', 'productdescription', 'details', 'about']
  const shortDescriptionKeys = ['shortdescription', 'shortdesc', 'summary', 'tagline', 'subtitle']
  const careKeys = ['careinstructions', 'care', 'careguide', 'maintenance', 'materialcare']
  const imageKeys = ['image', 'imageurl', 'images', 'photo', 'img', 'picture', 'primaryimage']
  const modeKeys = ['mode', 'productmode', 'salemode', 'listingtype']
  const tagKeys = ['tags', 'keywords', 'labels', 'categorytags']

  const parsedProducts: ParsedProductRow[] = []
  const usedSlugs = new Set<string>()

  rawRows.forEach((row: Record<string, unknown>, index: number) => {
    const normalizedMap = new Map<string, unknown>()
    for (const [key, value] of Object.entries(row)) {
      normalizedMap.set(normalizeKey(key), value)
    }

    const rawCode = extractFieldValue(normalizedMap, itemCodeKeys)
    const itemCode = (rawCode ? String(rawCode).trim().toUpperCase() : `SH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`).replace(/[^A-Z0-9_-]/g, '')

    const rawName = extractFieldValue(normalizedMap, nameKeys)
    const name = rawName ? String(rawName).trim() : `Sheaura Fashion Jewellery Piece ${itemCode}`

    const rawCat = extractFieldValue(normalizedMap, categoryKeys)
    const categoryName = rawCat ? String(rawCat).trim() : 'Fashion Jewellery'

    const salePrice = parsePrice(extractFieldValue(normalizedMap, priceKeys))
    const rentalPrice = parsePrice(extractFieldValue(normalizedMap, rentalPriceKeys))
    const stockQuantity = parseStock(extractFieldValue(normalizedMap, stockKeys))
    const description = extractFieldValue(normalizedMap, descriptionKeys) ? String(extractFieldValue(normalizedMap, descriptionKeys)).trim() : undefined
    const shortDescription = extractFieldValue(normalizedMap, shortDescriptionKeys) ? String(extractFieldValue(normalizedMap, shortDescriptionKeys)).trim() : undefined
    const careInstructions = extractFieldValue(normalizedMap, careKeys) ? String(extractFieldValue(normalizedMap, careKeys)).trim() : undefined
    const imageUrl = extractFieldValue(normalizedMap, imageKeys) ? String(extractFieldValue(normalizedMap, imageKeys)).trim() : undefined

    const baseSlug = `${slugify(name)}-${itemCode.toLowerCase()}`.slice(0, 240)
    let candidateSlug = baseSlug
    let counter = 1
    while (usedSlugs.has(candidateSlug)) {
      candidateSlug = `${baseSlug}-${counter++}`
    }
    usedSlugs.add(candidateSlug)

    const rawMode = extractFieldValue(normalizedMap, modeKeys)?.toString().toLowerCase().trim()
    let mode: 'sale' | 'rental' | 'both' = 'both'
    if (rawMode === 'sale' || rawMode === 'rental' || rawMode === 'both') {
      mode = rawMode
    } else if (parseFloat(rentalPrice) > 0 && parseFloat(salePrice) > 0) {
      mode = 'both'
    } else if (parseFloat(rentalPrice) > 0) {
      mode = 'rental'
    } else {
      mode = 'sale'
    }

    const availability = stockQuantity > 0 ? 'available' : 'out_of_stock'

    const rawTags = extractFieldValue(normalizedMap, tagKeys)
    let tags: string[] = ['fashion jewellery', 'imitation jewellery']
    if (rawTags) {
      if (Array.isArray(rawTags)) {
        tags = rawTags.map(String)
      } else if (typeof rawTags === 'string') {
        tags = rawTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
      }
    }

    parsedProducts.push({
      rawRowIndex: index + 2,
      itemCode,
      name,
      slug: candidateSlug,
      categoryName,
      description,
      shortDescription,
      salePrice,
      rentalPrice: parseFloat(rentalPrice) > 0 ? rentalPrice : '0.00',
      stockQuantity,
      availability,
      mode,
      imageUrl,
      tags,
      careInstructions,
    })
  })

  console.log(`\n📋 Successfully parsed and validated ${parsedProducts.length} product records.\n`)

  if (isDryRun) {
    console.log('----------------------------------------------------')
    console.log('             DRY RUN PREVIEW (Top 10 items)         ')
    console.log('----------------------------------------------------')
    parsedProducts.slice(0, 10).forEach((item, idx) => {
      console.log(`[#${idx + 1}] Code: ${item.itemCode.padEnd(12)} | Qty: ${String(item.stockQuantity).padStart(3)} | Status: ${item.availability.padEnd(12)} | Price: ₹${item.salePrice} | Category: ${item.categoryName}`)
      console.log(`     Name: ${item.name}`)
      console.log(`     Slug: ${item.slug}`)
      if (item.imageUrl) console.log(`     Image: ${item.imageUrl}`)
      console.log(' ')
    })

    if (parsedProducts.length > 10) {
      console.log(`... and ${parsedProducts.length - 10} more item(s) ready to be upserted.`)
    }

    const categoriesFound = new Set(parsedProducts.map((p) => p.categoryName))
    console.log('\n📊 Category Summary:')
    categoriesFound.forEach((cat) => {
      const count = parsedProducts.filter((p) => p.categoryName === cat).length
      console.log(`   - ${cat}: ${count} item(s)`)
    })

    console.log('\n✅ DRY RUN COMPLETE: 0 database writes were performed.')
    console.log('👉 To write these records to PostgreSQL, run without --dry-run.')
    return
  }

  // Live Database Upsert
  try {
    console.log('🔌 Connecting to PostgreSQL database...')
    const dbCategories = await db.select().from(categories)
    const categoryMap = new Map<string, string>()

    for (const c of dbCategories) {
      categoryMap.set(c.slug, c.id)
      categoryMap.set(c.name.toLowerCase().trim(), c.id)
    }

    let defaultCategoryId = dbCategories[0]?.id

    // Check or create categories
    for (const prod of parsedProducts) {
      const catKey = prod.categoryName.toLowerCase().trim()
      const catSlug = slugify(prod.categoryName)

      if (!categoryMap.has(catKey) && !categoryMap.has(catSlug)) {
        console.log(`  + Creating new category: "${prod.categoryName}" (${catSlug})`)
        const [insertedCat] = await db
          .insert(categories)
          .values({
            name: prod.categoryName,
            slug: catSlug,
            displayOrder: dbCategories.length + categoryMap.size + 1,
            isActive: true,
          })
          .returning()
        categoryMap.set(catKey, insertedCat.id)
        categoryMap.set(catSlug, insertedCat.id)
        if (!defaultCategoryId) defaultCategoryId = insertedCat.id
      }
    }

    let insertedCount = 0
    let updatedCount = 0

    for (const item of parsedProducts) {
      const categoryId =
        categoryMap.get(item.categoryName.toLowerCase().trim()) ||
        categoryMap.get(slugify(item.categoryName)) ||
        defaultCategoryId

      if (!categoryId) {
        throw new Error(`Unable to determine category ID for "${item.categoryName}"`)
      }

      // Check existing product by itemCode
      const existing = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.itemCode, item.itemCode))
        .limit(1)

      let productId: string

      if (existing.length > 0) {
        productId = existing[0].id
        await db
          .update(products)
          .set({
            name: item.name,
            categoryId,
            description: item.description,
            shortDescription: item.shortDescription,
            tags: item.tags,
            mode: item.mode,
            salePrice: item.salePrice,
            rentalPrice: item.rentalPrice,
            stockQuantity: item.stockQuantity,
            availability: item.availability,
            careInstructions: item.careInstructions,
            updatedAt: new Date(),
          })
          .where(eq(products.id, productId))
        updatedCount++
      } else {
        const [newProduct] = await db
          .insert(products)
          .values({
            itemCode: item.itemCode,
            name: item.name,
            slug: item.slug,
            categoryId,
            description: item.description,
            shortDescription: item.shortDescription,
            tags: item.tags,
            mode: item.mode,
            salePrice: item.salePrice,
            rentalPrice: item.rentalPrice,
            stockQuantity: item.stockQuantity,
            availability: item.availability,
            careInstructions: item.careInstructions,
            isPublished: true,
            isFeatured: false,
          })
          .returning()
        productId = newProduct.id
        insertedCount++
      }

      // Attach image if specified
      if (item.imageUrl) {
        const existingImages = await db
          .select({ id: productImages.id })
          .from(productImages)
          .where(eq(productImages.productId, productId))
          .limit(1)

        if (existingImages.length === 0) {
          await db.insert(productImages).values({
            productId,
            url: item.imageUrl,
            altText: item.name,
            isPrimary: true,
            displayOrder: 1,
          })
        }
      }
    }

    console.log('\n====================================================')
    console.log('✅ INVENTORY INGESTION SUCCEEDED!')
    console.log('====================================================')
    console.log(`📦 Total items processed: ${parsedProducts.length}`)
    console.log(`✨ New products created:   ${insertedCount}`)
    console.log(`🔄 Existing products updated: ${updatedCount}`)
    console.log('====================================================\n')
  } catch (dbErr: unknown) {
    const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr)
    console.error('\n❌ Database Connection or Query Error:')
    console.error(`Message: ${errMsg}`)
    console.error('\nDiagnostic Information:')
    console.error('- Check if your PostgreSQL / Supabase server is accessible.')
    console.error('- If your Supabase instance is paused, unpause it via the Supabase dashboard.')
    console.error('- Verify your DATABASE_URL in .env matches the active credentials.')
    console.error('- You can always run with --dry-run to validate your spreadsheet parsing without a database connection.\n')
    process.exit(1)
  } finally {
    await closePool().catch(() => {})
  }
}

// Run when executed directly via tsx
runInventoryImport().catch(async (err) => {
  console.error('\n❌ Uncaught error during inventory import execution:', err)
  await closePool().catch(() => {})
  process.exit(1)
})
