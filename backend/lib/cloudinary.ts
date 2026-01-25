/**
 * Servicio de Cloudinary para transformación de imágenes
 * 
 * En producción: Usa Cloudinary para servir imágenes optimizadas
 * En desarrollo: Retorna URLs locales sin transformación
 * 
 * Flujo:
 * 1. Imagen se sube a B2 (o local)
 * 2. Cloudinary usa "fetch" para obtener la imagen de B2 y aplicar transformaciones
 * 3. Se sirve la imagen transformada desde el CDN de Cloudinary
 */

import { v2 as cloudinary } from 'cloudinary'

// Configuración desde variables de entorno
const CLOUDINARY_ENABLED = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
)

const CLOUDINARY_CONFIG = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.CLOUDINARY_API_KEY || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET || '',
}

// Configurar Cloudinary si está habilitado
if (CLOUDINARY_ENABLED) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CONFIG.cloudName,
    api_key: CLOUDINARY_CONFIG.apiKey,
    api_secret: CLOUDINARY_CONFIG.apiSecret,
    secure: true,
  })
  console.log('✅ Cloudinary image optimization enabled')
} else {
  console.log('ℹ️  Cloudinary not configured - using direct URLs')
}

// Tipos de transformación predefinidos
export type ImageTransform = 
  | 'thumbnail'      // 150x150, cuadrado, crop
  | 'avatar'         // 200x200, cuadrado, face detection
  | 'card'           // 400x300, crop
  | 'profile'        // 600x600, cuadrado
  | 'hero'           // 1200x600, crop
  | 'original'       // Sin transformación, solo optimización

interface TransformConfig {
  width?: number
  height?: number
  crop?: string
  gravity?: string
  quality?: string | number
  format?: string
  fetch_format?: string
}

// Configuraciones de transformación
const TRANSFORM_CONFIGS: Record<ImageTransform, TransformConfig> = {
  thumbnail: {
    width: 150,
    height: 150,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  },
  avatar: {
    width: 200,
    height: 200,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto',
  },
  card: {
    width: 400,
    height: 300,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  },
  profile: {
    width: 600,
    height: 600,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto',
  },
  hero: {
    width: 1200,
    height: 600,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  },
  original: {
    quality: 'auto',
    fetch_format: 'auto',
  },
}

/**
 * Genera una URL de Cloudinary para una imagen almacenada en B2 o local
 * 
 * @param sourceUrl - URL de la imagen original (B2 o local)
 * @param transform - Tipo de transformación a aplicar
 * @returns URL optimizada de Cloudinary o URL original si no está configurado
 */
export function getOptimizedImageUrl(
  sourceUrl: string,
  transform: ImageTransform = 'original'
): string {
  // Si Cloudinary no está configurado, retornar URL original
  if (!CLOUDINARY_ENABLED) {
    return sourceUrl
  }

  // Si es una URL local, no podemos usar Cloudinary fetch
  // (Cloudinary necesita una URL pública accesible)
  // Detectar URLs locales: /uploads, ./uploads, http://localhost, file://
  const isLocalUrl = 
    sourceUrl.startsWith('/uploads') || 
    sourceUrl.startsWith('./uploads') ||
    sourceUrl.startsWith('uploads/') ||
    sourceUrl.startsWith('http://localhost') ||
    sourceUrl.startsWith('http://127.0.0.1') ||
    sourceUrl.startsWith('file://') ||
    (sourceUrl.startsWith('/') && !sourceUrl.startsWith('//'))
  
  if (isLocalUrl) {
    return sourceUrl
  }

  const config = TRANSFORM_CONFIGS[transform]
  
  // Construir transformaciones
  const transformations: string[] = []
  
  if (config.width) transformations.push(`w_${config.width}`)
  if (config.height) transformations.push(`h_${config.height}`)
  if (config.crop) transformations.push(`c_${config.crop}`)
  if (config.gravity) transformations.push(`g_${config.gravity}`)
  if (config.quality) transformations.push(`q_${config.quality}`)
  if (config.fetch_format) transformations.push(`f_${config.fetch_format}`)

  const transformString = transformations.join(',')

  // URL de Cloudinary usando "fetch" para obtener imagen externa
  // Formato: https://res.cloudinary.com/{cloud_name}/image/fetch/{transformations}/{url}
  const encodedUrl = encodeURIComponent(sourceUrl)
  
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/fetch/${transformString}/${encodedUrl}`
}

/**
 * Genera múltiples URLs de imagen con diferentes tamaños para srcset
 */
export function getResponsiveImageUrls(sourceUrl: string): {
  thumbnail: string
  small: string
  medium: string
  large: string
  original: string
} {
  return {
    thumbnail: getOptimizedImageUrl(sourceUrl, 'thumbnail'),
    small: getOptimizedImageUrl(sourceUrl, 'avatar'),
    medium: getOptimizedImageUrl(sourceUrl, 'profile'),
    large: getOptimizedImageUrl(sourceUrl, 'hero'),
    original: getOptimizedImageUrl(sourceUrl, 'original'),
  }
}

/**
 * Genera URL con transformación personalizada
 */
export function getCustomImageUrl(
  sourceUrl: string,
  options: {
    width?: number
    height?: number
    crop?: 'fill' | 'fit' | 'scale' | 'thumb'
    gravity?: 'auto' | 'face' | 'center'
    quality?: number | 'auto'
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
  }
): string {
  if (!CLOUDINARY_ENABLED) {
    return sourceUrl
  }

  if (sourceUrl.startsWith('/uploads') || sourceUrl.startsWith('./')) {
    return sourceUrl
  }

  const transformations: string[] = []
  
  if (options.width) transformations.push(`w_${options.width}`)
  if (options.height) transformations.push(`h_${options.height}`)
  if (options.crop) transformations.push(`c_${options.crop}`)
  if (options.gravity) transformations.push(`g_${options.gravity}`)
  if (options.quality) transformations.push(`q_${options.quality}`)
  if (options.format) transformations.push(`f_${options.format}`)

  const transformString = transformations.length > 0 
    ? transformations.join(',') 
    : 'q_auto,f_auto'

  const encodedUrl = encodeURIComponent(sourceUrl)
  
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/fetch/${transformString}/${encodedUrl}`
}

/**
 * Verifica si Cloudinary está habilitado
 */
export function isCloudinaryEnabled(): boolean {
  return CLOUDINARY_ENABLED
}

/**
 * Sube una imagen directamente a Cloudinary (alternativa a B2)
 * Útil si solo querés usar Cloudinary para todo
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string
    publicId?: string
    transformation?: TransformConfig
  } = {}
): Promise<{ url: string; publicId: string } | null> {
  if (!CLOUDINARY_ENABLED) {
    console.warn('Cloudinary not configured, cannot upload directly')
    return null
  }

  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      resource_type: 'image',
    }
    
    if (options.folder) uploadOptions.folder = options.folder
    if (options.publicId) uploadOptions.public_id = options.publicId
    if (options.transformation) uploadOptions.transformation = options.transformation

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          })
        } else {
          reject(new Error('No result from Cloudinary'))
        }
      }
    ).end(buffer)
  })
}

/**
 * Elimina una imagen de Cloudinary (si fue subida directamente)
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!CLOUDINARY_ENABLED) {
    return false
  }

  try {
    await cloudinary.uploader.destroy(publicId)
    return true
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    return false
  }
}
