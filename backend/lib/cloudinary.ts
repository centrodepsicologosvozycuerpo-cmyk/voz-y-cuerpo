/**
 * Re-exporta funciones de URLs (sin SDK) y define upload/delete que sí cargan el SDK.
 * Las rutas de foto y banners deben importar desde @/lib/cloudinary-urls para no cargar este chunk.
 */

export {
  getOptimizedImageUrl,
  getResponsiveImageUrls,
  getCustomImageUrl,
  isCloudinaryEnabled,
  type ImageTransform,
} from './cloudinary-urls'

// Config usada solo por upload/delete (mismo que cloudinary-urls pero aquí para no pasar env al SDK)
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

interface TransformConfig {
  width?: number
  height?: number
  crop?: string
  gravity?: string
  quality?: string | number
  format?: string
  fetch_format?: string
}

function ensureCloudinaryEnvBeforeSdk() {
  if (process.env.CLOUDINARY_URL === '') delete process.env.CLOUDINARY_URL
  if (process.env.CLOUDINARY_ACCOUNT_URL === '') delete process.env.CLOUDINARY_ACCOUNT_URL
}

export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string
    publicId?: string
    transformation?: TransformConfig
  } = {}
): Promise<{ url: string; publicId: string } | null> {
  if (!CLOUDINARY_ENABLED) return null
  ensureCloudinaryEnvBeforeSdk()
  const { v2: cloudinary } = await import('cloudinary')
  cloudinary.config({
    cloud_name: CLOUDINARY_CONFIG.cloudName,
    api_key: CLOUDINARY_CONFIG.apiKey,
    api_secret: CLOUDINARY_CONFIG.apiSecret,
    secure: true,
  })
  return new Promise((resolve, reject) => {
    const uploadOptions: any = { resource_type: 'image' }
    if (options.folder) uploadOptions.folder = options.folder
    if (options.publicId) uploadOptions.public_id = options.publicId
    if (options.transformation) uploadOptions.transformation = options.transformation
    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) reject(error)
        else if (result) resolve({ url: result.secure_url, publicId: result.public_id })
        else reject(new Error('No result from Cloudinary'))
      }
    ).end(buffer)
  })
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!CLOUDINARY_ENABLED) return false
  ensureCloudinaryEnvBeforeSdk()
  const { v2: cloudinary } = await import('cloudinary')
  cloudinary.config({
    cloud_name: CLOUDINARY_CONFIG.cloudName,
    api_key: CLOUDINARY_CONFIG.apiKey,
    api_secret: CLOUDINARY_CONFIG.apiSecret,
    secure: true,
  })
  try {
    await cloudinary.uploader.destroy(publicId)
    return true
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    return false
  }
}
