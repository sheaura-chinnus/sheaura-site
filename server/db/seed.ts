import 'dotenv/config'
import { execSync } from 'child_process'

async function main() {
  console.log('🌱 Executing real stock seed from stock.xlsx...')
  execSync('npx tsx server/db/seedFromExcel.ts', { stdio: 'inherit' })
  console.log('✅ Stock seed complete!')
}

main().catch(console.error)