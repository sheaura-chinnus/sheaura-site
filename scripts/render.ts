import 'dotenv/config'

const API_KEY = process.env.RENDER_API_KEY
const SERVICE_ID = process.env.RENDER_SERVICE_ID || 'srv-da7q4l1srm7s739v2etg'
const OWNER_ID = 'tea-da7q2749v7es73fahsm0'
const BASE_URL = 'https://api.render.com/v1'

if (!API_KEY) {
  console.error('❌ RENDER_API_KEY is not defined in .env')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

async function getService() {
  const res = await fetch(`${BASE_URL}/services/${SERVICE_ID}`, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return await res.json()
}

async function listDeploys(limit = 5) {
  const res = await fetch(`${BASE_URL}/services/${SERVICE_ID}/deploys?limit=${limit}`, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return await res.json()
}

async function triggerDeploy(clearCache = false) {
  const res = await fetch(`${BASE_URL}/services/${SERVICE_ID}/deploys`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ clearCache: clearCache ? 'clear' : 'do_not_clear' }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return await res.json()
}

async function getDeploy(deployId: string) {
  const res = await fetch(`${BASE_URL}/services/${SERVICE_ID}/deploys/${deployId}`, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return await res.json()
}

async function getEnvVars() {
  const res = await fetch(`${BASE_URL}/services/${SERVICE_ID}/env-vars`, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return await res.json()
}

async function updateEnvVar(key: string, value: string) {
  // Render env-vars PUT expects array of { key, value }
  const current = await getEnvVars()
  const map = new Map<string, string>()
  for (const item of current) {
    map.set(item.envVar.key, item.envVar.value)
  }
  map.set(key, value)
  const envVars = Array.from(map.entries()).map(([k, v]) => ({ key: k, value: v }))

  const res = await fetch(`${BASE_URL}/services/${SERVICE_ID}/env-vars`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(envVars),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return await res.json()
}

async function updateServiceBranch(branch: string) {
  const res = await fetch(`${BASE_URL}/services/${SERVICE_ID}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ branch }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return await res.json()
}

async function getLogs(limit = 20) {
  const res = await fetch(`${BASE_URL}/logs?ownerId=${OWNER_ID}&resource=${SERVICE_ID}&limit=${limit}`, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return await res.json()
}

const command = process.argv[2] || 'status'
const param1 = process.argv[3]
const param2 = process.argv[4]

async function run() {
  try {
    switch (command) {
      case 'status': {
        const s = await getService()
        const deploys = await listDeploys(3)
        console.log('\n=== Render Service Status ===')
        console.log(`Service Name : ${s.name} (${s.id})`)
        console.log(`Live URL     : ${s.serviceDetails?.url}`)
        console.log(`Branch       : ${s.branch}`)
        console.log(`Auto-Deploy  : ${s.autoDeploy}`)
        console.log(`Build Command: ${s.serviceDetails?.envSpecificDetails?.buildCommand}`)
        console.log(`Start Command: ${s.serviceDetails?.envSpecificDetails?.startCommand}`)
        console.log('\n=== Recent Deploys ===')
        for (const d of deploys) {
          const dep = d.deploy
          console.log(`- ID: ${dep.id} | Status: ${dep.status} | Commit: ${dep.commit?.id?.substring(0, 7)} - "${dep.commit?.message?.trim()}"`)
        }
        break
      }
      case 'deploy': {
        console.log(`🚀 Triggering Render deploy for service: ${SERVICE_ID}...`)
        const dep = await triggerDeploy(param1 === '--clear-cache')
        console.log(`Deploy created: ${dep.id} (Status: ${dep.status})`)
        console.log('Polling status until complete...')
        let currentStatus = dep.status
        while (['created', 'build_in_progress', 'update_in_progress'].includes(currentStatus)) {
          await new Promise((r) => setTimeout(r, 4000))
          const latest = await getDeploy(dep.id)
          currentStatus = latest.status
          process.stdout.write(`Status: ${currentStatus}...\r`)
        }
        console.log(`\nFinal Deploy Status: ${currentStatus}`)
        break
      }
      case 'set-branch': {
        if (!param1) throw new Error('Usage: npx tsx scripts/render.ts set-branch <branch-name>')
        console.log(`Updating service branch to: ${param1}...`)
        const updated = await updateServiceBranch(param1)
        console.log(`✅ Updated service branch to: ${updated.branch}`)
        break
      }
      case 'env:list': {
        const envs = await getEnvVars()
        console.log('\n=== Render Environment Variables ===')
        for (const item of envs) {
          console.log(`${item.envVar.key} = ${item.envVar.value}`)
        }
        break
      }
      case 'env:set': {
        if (!param1 || !param2) throw new Error('Usage: npx tsx scripts/render.ts env:set <KEY> <VALUE>')
        console.log(`Setting ${param1} on Render...`)
        await updateEnvVar(param1, param2)
        console.log(`✅ ${param1} updated successfully.`)
        break
      }
      case 'logs': {
        const logs = await getLogs(Number(param1) || 20)
        console.log(JSON.stringify(logs, null, 2))
        break
      }
      default:
        console.log(`Unknown command: ${command}`)
        console.log('Commands: status, deploy, set-branch, env:list, env:set, logs')
    }
  } catch (err: any) {
    console.error('❌ Error:', err.message || err)
    process.exit(1)
  }
}

run()
