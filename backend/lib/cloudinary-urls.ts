/**
 * Construcción de URLs de Cloudinary SIN cargar el SDK.
 * Usar este módulo en rutas de subida/foto para evitar que Next cargue el chunk del SDK,
 * que hace new URL(process.env.CLOUDINARY_URL) y falla si está vacía.
 */

const CLOUDINARY_ENABLED = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
)

const CLOUDINARY_CONFIG = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
}

export type ImageTransform =
  | 'thumbnail'
  | 'avatar'
  | 'card'
  | 'profile'
  | 'hero'
  | 'original'

const TRANSFORM_CONFIGS: Record<ImageTransform, Record<string, unknown>> = {
  thumbnail: { width: 150, height: 150, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' },
  avatar: { width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' },
  card: { width: 400, height: 300, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' },
  profile: { width: 600, height: 600, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' },
  hero: { width: 1200, height: 600, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' },
  original: { quality: 'auto', fetch_format: 'auto' },
}

export function getOptimizedImageUrl(
  sourceUrl: string,
  transform: ImageTransform = 'original'
): string {
  if (!sourceUrl || typeof sourceUrl !== 'string' || sourceUrl.trim() === '') {
    return sourceUrl || ''
  }
  if (!CLOUDINARY_ENABLED) return sourceUrl
  const isLocalUrl =
    sourceUrl.startsWith('/uploads') ||
    sourceUrl.startsWith('./uploads') ||
    sourceUrl.startsWith('uploads/') ||
    sourceUrl.startsWith('http://localhost') ||
    sourceUrl.startsWith('http://127.0.0.1') ||
    sourceUrl.startsWith('file://') ||
    (sourceUrl.startsWith('/') && !sourceUrl.startsWith('//'))
  if (isLocalUrl) return sourceUrl

  const config = TRANSFORM_CONFIGS[transform]
  const transformations: string[] = []
  if (config.width) transformations.push(`w_${config.width}`)
  if (config.height) transformations.push(`h_${config.height}`)
  if (config.crop) transformations.push(`c_${config.crop}`)
  if (config.gravity) transformations.push(`g_${config.gravity}`)
  if (config.quality) transformations.push(`q_${config.quality}`)
  if (config.fetch_format) transformations.push(`f_${config.fetch_format}`)
  const transformString = transformations.join(',')
  const encodedUrl = encodeURIComponent(sourceUrl)
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/fetch/${transformString}/${encodedUrl}`
}

export function getResponsiveImageUrls(sourceUrl: string) {
  return {
    thumbnail: getOptimizedImageUrl(sourceUrl, 'thumbnail'),
    small: getOptimizedImageUrl(sourceUrl, 'avatar'),
    medium: getOptimizedImageUrl(sourceUrl, 'profile'),
    large: getOptimizedImageUrl(sourceUrl, 'hero'),
    original: getOptimizedImageUrl(sourceUrl, 'original'),
  }
}

export function getCustomImageUrl(
  sourceUrl: string,
  options: {
    width?: number
    height?: number
    crop?: string
    gravity?: string
    quality?: number | 'auto'
    format?: string
  }
): string {
  if (!CLOUDINARY_ENABLED) return sourceUrl
  if (sourceUrl.startsWith('/uploads') || sourceUrl.startsWith('./')) return sourceUrl
  const transformations: string[] = []
  if (options.width) transformations.push(`w_${options.width}`)
  if (options.height) transformations.push(`h_${options.height}`)
  if (options.crop) transformations.push(`c_${options.crop}`)
  if (options.gravity) transformations.push(`g_${options.gravity}`)
  if (options.quality) transformations.push(`q_${options.quality}`)
  if (options.format) transformations.push(`f_${options.format}`)
  const transformString = transformations.length > 0 ? transformations.join(',') : 'q_auto,f_auto'
  const encodedUrl = encodeURIComponent(sourceUrl)
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/fetch/${transformString}/${encodedUrl}`
}

export function isCloudinaryEnabled(): boolean {
  return CLOUDINARY_ENABLED
}
