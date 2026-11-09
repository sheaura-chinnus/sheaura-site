/**
 * import_docx_stock.ts — Word Document Stock Ingestion Script
 *
 * Parses a .docx file containing product images and item codes,
 * extracts images to uploads/products/, and upserts products into the database.
 *
 * Usage:
 *   tsx server/db/import_docx_stock.ts --inspect          # Read-only inspection
 *   tsx server/db/import_docx_stock.ts --dry-run           # Parse without DB writes
 *   tsx server/db/import_docx_stock.ts                     # Full import
 *   tsx server/db/import_docx_stock.ts --file ./custom.docx
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import AdmZip from 'adm-zip'
import { parseStringPromise } from 'xml2js'
import { db } from './index.js'
import { products, productImages, categories } from './schema.js'
import { eq } from 'drizzle-orm'

// ──────────────────────────────────────────────
// CLI argument parsing
// ──────────────────────────────────────────────

const args = process.argv.slice(2)
const MODE = args.includes('--inspect')
  ? 'inspect'
  : args.includes('--dry-run')
    ? 'dry-run'
    : 'import'

const fileArgIdx = args.indexOf('--file')
const DOCX_PATH = fileArgIdx !== -1 && args[fileArgIdx + 1]
  ? path.resolve(args[fileArgIdx + 1])
  : path.resolve(process.cwd(), 'stock.docx')

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'products')

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface ExtractedProduct {
  itemCode: string
  name: string
  slug: string
  imageRid: string
  imagePath: string      // path inside zip: word/media/imageX.ext
  imageExt: string
  outputFilename: string // e.g. SH-001.png
  sourceType: 'table' | 'paragraph'
  rawText: string        // original text for debugging
}

// ──────────────────────────────────────────────
// XML Utilities
// ──────────────────────────────────────────────

/**
 * Build rId -> media path mapping from word/_rels/document.xml.rels
 */
function parseRelationships(zip: AdmZip): Map<string, string> {
  const relsEntry = zip.getEntry('word/_rels/document.xml.rels')
  if (!relsEntry) {
    throw new Error('Cannot find word/_rels/document.xml.rels in the .docx archive')
  }

  const relsXml = relsEntry.getData().toString('utf-8')
  const map = new Map<string, string>()

  // Fast regex extraction — avoids full XML parse for this small file
  const relRegex = /<Relationship\s+[^>]*Id="(rId\d+)"[^>]*Target="([^"]+)"[^>]*\/>/g
  let match: RegExpExecArray | null
  while ((match = relRegex.exec(relsXml)) !== null) {
    const [, rId, target] = match
    if (target.startsWith('media/')) {
      map.set(rId, `word/${target}`)
    }
  }

  return map
}

/**
 * Recursively extract all text from an XML node tree (w:t elements)
 */
function extractText(node: any): string {
  if (typeof node === 'string') return node
  if (!node || typeof node !== 'object') return ''

  let text = ''

  // Direct text content from w:t
  if (node['w:t']) {
    for (const t of Array.isArray(node['w:t']) ? node['w:t'] : [node['w:t']]) {
      if (typeof t === 'string') {
        text += t
      } else if (t && t._) {
        text += t._
      }
    }
  }

  // Recurse into child elements
  for (const key of Object.keys(node)) {
    if (key.startsWith('$') || key === '_') continue
    const child = node[key]
    if (Array.isArray(child)) {
      for (const item of child) {
        text += extractText(item)
      }
    } else if (typeof child === 'object') {
      text += extractText(child)
    }
  }

  return text
}

/**
 * Find all image rIds from a node (w:drawing/a:blip or w:pict/v:imagedata)
 */
function findImageRids(node: any): string[] {
  const rids: string[] = []
  if (!node || typeof node !== 'object') return rids

  // Check for a:blip (modern drawings)
  if (node['$'] && (node['$']['r:embed'] || node['$']['r:id'])) {
    const rid = node['$']['r:embed'] || node['$']['r:id']
    if (rid) rids.push(rid)
  }

  // Recurse
  for (const key of Object.keys(node)) {
    if (key === '$' || key === '_') continue
    const child = node[key]
    if (Array.isArray(child)) {
      for (const item of child) {
        rids.push(...findImageRids(item))
      }
    } else if (typeof child === 'object') {
      rids.push(...findImageRids(child))
    }
  }

  return rids
}

// ──────────────────────────────────────────────
// Item Code Extraction
// ──────────────────────────────────────────────

/** Known item code patterns: SH-001, SH001, SKU-ABC123, etc. */
const ITEM_CODE_PATTERNS = [
  /\b(SH[-\s]?\d{2,6}[A-Z]?)\b/i,                    // SH-001, SH001, SH-1234A
  /\b(SH[-\s]?[A-Z]{1,4}[-\s]?\d{1,6})\b/i,           // SH-AB-001
  /\b(?:code|sku|item[\s-]?code)[\s:]*([A-Z0-9][-A-Z0-9]{2,20})\b/i,
  /\b([A-Z]{2,4}[-]?\d{2,6}[A-Z]?)\b/,                 // Generic: XX-123 or XX123
]

function extractItemCode(text: string): string | null {
  const clean = text.trim()
  if (!clean) return null

  for (const pattern of ITEM_CODE_PATTERNS) {
    const match = clean.match(pattern)
    if (match && match[1]) {
      return match[1].replace(/\s+/g, '').toUpperCase()
    }
  }

  return null
}

function normalizeItemCode(raw: string): string {
  let code = raw.replace(/\s+/g, '').toUpperCase()
  // Ensure SH- prefix format consistency
  if (code.match(/^SH\d/)) {
    code = 'SH-' + code.slice(2)
  }
  return code
}

// ──────────────────────────────────────────────
// Slug Generation
// ──────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ──────────────────────────────────────────────
// DOCX Parsing Engine
// ──────────────────────────────────────────────

async function parseDocx(docxPath: string): Promise<{
  products: ExtractedProduct[]
  structure: 'table' | 'paragraph' | 'mixed'
  totalImages: number
  totalTextBlocks: number
}> {
  if (!fs.existsSync(docxPath)) {
    throw new Error(`File not found: ${docxPath}`)
  }

  const zip = new AdmZip(docxPath)
  const relsMap = parseRelationships(zip)

  console.log(`📦 Loaded .docx: ${docxPath}`)
  console.log(`🔗 Found ${relsMap.size} image relationships in document.xml.rels`)

  // Parse document.xml
  const docEntry = zip.getEntry('word/document.xml')
  if (!docEntry) {
    throw new Error('Cannot find word/document.xml in the .docx archive')
  }

  const docXml = docEntry.getData().toString('utf-8')
  const doc = await parseStringPromise(docXml, {
    explicitArray: true,
    preserveChildrenOrder: true,
    normalizeTags: false,
  })

  const body = doc['w:document']?.['w:body']?.[0]
  if (!body) {
    throw new Error('Cannot find <w:body> in document.xml')
  }

  const extracted: ExtractedProduct[] = []
  let hasTable = false
  let hasParagraph = false
  let totalImages = 0
  let totalTextBlocks = 0

  // ──── Strategy 1: Table Layout ────
  const tables = body['w:tbl'] || []
  for (const table of tables) {
    const rows = table['w:tr'] || []
    for (const row of rows) {
      const cells = row['w:tc'] || []
      const rowRids: string[] = []
      const rowTexts: string[] = []

      for (const cell of cells) {
        const cellRids = findImageRids(cell)
        const cellText = extractText(cell).trim()
        if (cellRids.length > 0) rowRids.push(...cellRids)
        if (cellText) rowTexts.push(cellText)
      }

      if (rowRids.length > 0) {
        totalImages += rowRids.length
        hasTable = true
        const combinedText = rowTexts.join(' ')
        totalTextBlocks++

        for (const rid of rowRids) {
          const mediaPath = relsMap.get(rid)
          if (!mediaPath) continue

          const itemCode = extractItemCode(combinedText)
          if (!itemCode) continue

          const normalized = normalizeItemCode(itemCode)
          const ext = path.extname(mediaPath).slice(1) || 'png'
          const name = `Fashion Jewellery Item ${normalized}`

          extracted.push({
            itemCode: normalized,
            name,
            slug: slugify(`${name}-${normalized}`),
            imageRid: rid,
            imagePath: mediaPath,
            imageExt: ext,
            outputFilename: `${normalized}.${ext}`,
            sourceType: 'table',
            rawText: combinedText.slice(0, 200),
          })
        }
      }
    }
  }

  // ──── Strategy 2: Sequential Paragraphs ────
  const paragraphs = body['w:p'] || []
  const paraQueue: Array<{ rids: string[]; text: string }> = []

  for (const para of paragraphs) {
    const rids = findImageRids(para)
    const text = extractText(para).trim()

    if (rids.length > 0) totalImages += rids.length
    if (text) totalTextBlocks++

    paraQueue.push({ rids, text })
  }

  // Pair images with adjacent text paragraphs
  for (let i = 0; i < paraQueue.length; i++) {
    const { rids, text } = paraQueue[i]

    if (rids.length === 0) continue
    hasParagraph = true

    // Look for item code in current paragraph, then adjacent ones
    let itemCode = extractItemCode(text)
    let rawText = text

    if (!itemCode) {
      // Check next paragraph
      if (i + 1 < paraQueue.length && paraQueue[i + 1].text) {
        itemCode = extractItemCode(paraQueue[i + 1].text)
        rawText = paraQueue[i + 1].text
      }
      // Check previous paragraph
      if (!itemCode && i - 1 >= 0 && paraQueue[i - 1].text) {
        itemCode = extractItemCode(paraQueue[i - 1].text)
        rawText = paraQueue[i - 1].text
      }
    }

    if (!itemCode) continue

    for (const rid of rids) {
      const mediaPath = relsMap.get(rid)
      if (!mediaPath) continue

      const normalized = normalizeItemCode(itemCode)

      // Skip if already extracted from table pass
      if (extracted.some(p => p.itemCode === normalized)) continue

      const ext = path.extname(mediaPath).slice(1) || 'png'
      const name = `Fashion Jewellery Item ${normalized}`

      extracted.push({
        itemCode: normalized,
        name,
        slug: slugify(`${name}-${normalized}`),
        imageRid: rid,
        imagePath: mediaPath,
        imageExt: ext,
        outputFilename: `${normalized}.${ext}`,
        sourceType: 'paragraph',
        rawText: rawText.slice(0, 200),
      })
    }
  }

  const structure = hasTable && hasParagraph
    ? 'mixed'
    : hasTable
      ? 'table'
      : 'paragraph'

  return { products: extracted, structure, totalImages, totalTextBlocks }
}

// ──────────────────────────────────────────────
// Image Extraction
// ──────────────────────────────────────────────

function extractImages(docxPath: string, items: ExtractedProduct[]): void {
  const zip = new AdmZip(docxPath)

  fs.mkdirSync(UPLOADS_DIR, { recursive: true })

  for (const item of items) {
    const entry = zip.getEntry(item.imagePath)
    if (!entry) {
      console.warn(`⚠️  Image not found in archive: ${item.imagePath} (${item.itemCode})`)
      continue
    }

    const outPath = path.join(UPLOADS_DIR, item.outputFilename)
    fs.writeFileSync(outPath, entry.getData())
    console.log(`  📸 ${item.outputFilename}`)
  }
}

// ──────────────────────────────────────────────
// Database Operations
// ──────────────────────────────────────────────

async function ensureDefaultCategory(): Promise<string> {
  const slug = 'jewellery'
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1)

  if (existing.length > 0) {
    return existing[0].id
  }

  const [created] = await db
    .insert(categories)
    .values({
      name: 'Fashion Jewellery',
      slug,
      description: 'Fashion jewellery collection',
      displayOrder: 0,
      isActive: true,
    })
    .returning({ id: categories.id })

  console.log(`  📁 Created default category: "Fashion Jewellery"`)
  return created.id
}

async function upsertProducts(items: ExtractedProduct[], categoryId: string): Promise<void> {
  for (const item of items) {
    const imageUrl = `/uploads/products/${item.outputFilename}`

    // Upsert product
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.itemCode, item.itemCode))
      .limit(1)

    let productId: string

    if (existing.length > 0) {
      // Update existing
      productId = existing[0].id
      await db
        .update(products)
        .set({
          name: item.name,
          slug: item.slug,
          categoryId,
          mode: 'sale',
          isPublished: true,
          availability: 'available',
          stockQuantity: 1,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId))

      console.log(`  🔄 Updated product: ${item.itemCode}`)
    } else {
      // Resolve slug uniqueness
      let candidateSlug = item.slug
      let suffix = 1
      while (true) {
        const slugExists = await db
          .select({ id: products.id })
          .from(products)
          .where(eq(products.slug, candidateSlug))
          .limit(1)
        if (slugExists.length === 0) break
        suffix++
        candidateSlug = `${item.slug}-${suffix}`
      }

      const [created] = await db
        .insert(products)
        .values({
          itemCode: item.itemCode,
          name: item.name,
          slug: candidateSlug,
          categoryId,
          mode: 'sale',
          isPublished: true,
          availability: 'available',
          stockQuantity: 1,
        })
        .returning({ id: products.id })

      productId = created.id
      console.log(`  ✅ Created product: ${item.itemCode}`)
    }

    // Upsert primary image
    const existingImage = await db
      .select({ id: productImages.id })
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .limit(1)

    if (existingImage.length > 0) {
      await db
        .update(productImages)
        .set({
          url: imageUrl,
          altText: item.name,
          isPrimary: true,
          displayOrder: 0,
        })
        .where(eq(productImages.id, existingImage[0].id))
    } else {
      await db
        .insert(productImages)
        .values({
          productId,
          url: imageUrl,
          altText: item.name,
          isPrimary: true,
          displayOrder: 0,
        })
    }
  }
}

// ──────────────────────────────────────────────
// Main Execution
// ──────────────────────────────────────────────

async function main() {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  Sheaura Stock Importer — Mode: ${MODE.toUpperCase()}`)
  console.log(`  File: ${DOCX_PATH}`)
  console.log(`${'═'.repeat(60)}\n`)

  const result = await parseDocx(DOCX_PATH)

  console.log(`\n📊 Document Structure: ${result.structure}`)
  console.log(`📷 Total images found in archive: ${result.totalImages}`)
  console.log(`📝 Total text blocks: ${result.totalTextBlocks}`)
  console.log(`🏷️  Extracted products: ${result.products.length}\n`)

  if (result.products.length === 0) {
    console.log('⚠️  No products with recognized item codes found in the document.')
    console.log('    Ensure products have codes matching patterns like SH-001, SH-1234, etc.\n')
    process.exit(0)
  }

  // Display extracted items
  console.log('─'.repeat(60))
  console.log(`  ${'Item Code'.padEnd(14)} ${'Source'.padEnd(12)} ${'Image File'.padEnd(24)} Raw Text`)
  console.log('─'.repeat(60))
  for (const p of result.products) {
    console.log(`  ${p.itemCode.padEnd(14)} ${p.sourceType.padEnd(12)} ${p.outputFilename.padEnd(24)} ${p.rawText.slice(0, 40)}...`)
  }
  console.log('─'.repeat(60))

  // ── INSPECT: Stop here ──
  if (MODE === 'inspect') {
    console.log('\n✅ Inspection complete. No files or database were modified.\n')
    process.exit(0)
  }

  // ── DRY-RUN: Show what would be written ──
  if (MODE === 'dry-run') {
    console.log('\n📋 Dry-run — records that WOULD be created/updated:\n')
    for (const p of result.products) {
      console.log(`  Product: ${p.name}`)
      console.log(`    item_code: ${p.itemCode}`)
      console.log(`    slug:      ${p.slug}`)
      console.log(`    image:     /uploads/products/${p.outputFilename}`)
      console.log(`    mode: sale | published: true | stock: 1`)
      console.log('')
    }
    console.log('✅ Dry-run complete. No files or database were modified.\n')
    process.exit(0)
  }

  // ── LIVE IMPORT ──
  console.log('\n🚀 Starting live import...\n')

  // 1. Extract images to disk
  console.log('📸 Extracting images to uploads/products/:')
  extractImages(DOCX_PATH, result.products)

  // 2. Ensure default category
  console.log('\n📁 Ensuring default category...')
  const categoryId = await ensureDefaultCategory()

  // 3. Upsert products into database
  console.log('\n💾 Upserting products into database:')
  await upsertProducts(result.products, categoryId)

  console.log(`\n✅ Import complete! ${result.products.length} products processed.\n`)
  process.exit(0)
}

main().catch((err) => {
  console.error('\n❌ Import failed:', err.message || err)
  process.exit(1)
})
