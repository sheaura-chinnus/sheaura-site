import 'dotenv/config'
import { db } from './index.js'
import { products, categories, productImages } from './schema.js'
import { count } from 'drizzle-orm'

async function main() {
  const cats = await db.select().from(categories)
  console.log('Categories:', cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, imageUrl: c.imageUrl })))

  const total = await db.select({ value: count() }).from(products)
  console.log('Total products:', total[0].value)

  const modeCounts = await db
    .select({ mode: products.mode, count: count() })
    .from(products)
    .groupBy(products.mode)
  console.log('Mode counts:', modeCounts)

  const imgCount = await db.select({ value: count() }).from(productImages)
  console.log('Total product images:', imgCount[0].value)

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
