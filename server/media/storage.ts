import crypto from 'crypto'
import { db } from '../db/index.js'
import { mediaAssets } from '../db/schema.js'
import { eq } from 'drizzle-orm'

export interface ValidatedImage {
  buffer: Buffer
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp'
  extension: 'png' | 'jpg' | 'webp'
  size: number
}

// Check magic bytes to securely identify PNG, JPEG, or WebP
export function detectImageMimeType(buffer: Buffer): { mimeType: 'image/png' | 'image/jpeg' | 'image/webp'; extension: 'png' | 'jpg' | 'webp' } | null {
  if (buffer.length < 12) return null

  // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mimeType: 'image/png', extension: 'png' }
  }

  // JPEG magic bytes: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: 'jpg' }
  }

  // WebP magic bytes: 'RIFF' at 0..3 and 'WEBP' at 8..11
  if (
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return { mimeType: 'image/webp', extension: 'webp' }
  }

  // Any other format (including SVG, HTML, scripts) is strictly disallowed
  return null
}

export function validateImageBuffer(buffer: Buffer, maxSizeBytes = 2 * 1024 * 1024): ValidatedImage {
  if (!buffer || buffer.length === 0) {
    throw new Error('Empty file uploaded')
  }

  if (buffer.length > maxSizeBytes) {
    throw new Error(`File size (${(buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds the maximum allowed limit of ${(maxSizeBytes / 1024 / 1024).toFixed(0)}MB`)
  }

  const detected = detectImageMimeType(buffer)
  if (!detected) {
    throw new Error('Unsupported or unsafe file format. Only verified PNG, JPEG, and WebP images are allowed. SVG is strictly disallowed for security.')
  }

  return {
    buffer,
    mimeType: detected.mimeType,
    extension: detected.extension,
    size: buffer.length,
  }
}

// Calculate SHA-256 checksum
export function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

// Store media asset
export async function saveMediaAsset(
  image: ValidatedImage,
  options: {
    originalFilename?: string
    altText?: string
    userId?: string | null
  } = {}
): Promise<{ id: string; url: string; filename: string; mimeType: string; size: number }> {
  const id = crypto.randomUUID()
  const safeFilename = `logo-${id.slice(0, 8)}.${image.extension}`
  const checksum = calculateChecksum(image.buffer)

  // Check if S3 credentials exist in environment
  const s3Bucket = process.env.S3_BUCKET
  const s3AccessKey = process.env.S3_ACCESS_KEY
  const s3SecretKey = process.env.S3_SECRET_KEY
  const s3Endpoint = process.env.S3_ENDPOINT

  const hasS3Config = Boolean(s3Bucket && s3AccessKey && s3SecretKey && s3Endpoint)

  let storageType = 'db'
  let storageKey = null
  let assetUrl = `/api/media/${id}/${safeFilename}`

  if (hasS3Config && s3Endpoint) {
    // S3 integration placeholder - when configured on Render, store to S3
    storageType = 's3'
    storageKey = `logos/${id}.${image.extension}`
    assetUrl = `${s3Endpoint.replace(/\/$/, '')}/${s3Bucket}/${storageKey}`
  }

  // Save to database (stores base64 data for 'db' storage)
  const base64Data = storageType === 'db' ? image.buffer.toString('base64') : null

  await db.insert(mediaAssets).values({
    id,
    filename: safeFilename,
    mimeType: image.mimeType,
    fileSize: image.size,
    altText: options.altText || 'Sheaura Brand Logo',
    storageType,
    storageKey,
    data: base64Data,
    checksum,
    createdBy: options.userId ?? null,
  })

  return {
    id,
    url: assetUrl,
    filename: safeFilename,
    mimeType: image.mimeType,
    size: image.size,
  }
}

// Get asset by ID for serving
export async function getMediaAssetById(id: string): Promise<{ buffer: Buffer; mimeType: string; filename: string } | null> {
  const asset = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1)

  if (!asset.length || !asset[0].data) {
    return null
  }

  const item = asset[0]
  const buffer = Buffer.from(item.data!, 'base64')

  return {
    buffer,
    mimeType: item.mimeType,
    filename: item.filename,
  }
}
