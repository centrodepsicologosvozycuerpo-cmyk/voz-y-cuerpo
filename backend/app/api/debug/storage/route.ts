import { NextResponse } from 'next/server'
import { isCloudStorageEnabled, getStorageBaseUrl } from '@/lib/storage'
import { isCloudinaryEnabled } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

/**
 * GET /api/debug/storage
 * 
 * Retorna el estado de configuración de los servicios de storage
 * Solo disponible en desarrollo
 */
export async function GET() {
  // Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const status = {
    storage: {
      provider: isCloudStorageEnabled() ? 'backblaze_b2' : 'local',
      baseUrl: getStorageBaseUrl(),
      configured: {
        B2_KEY_ID: !!process.env.B2_KEY_ID,
        B2_APPLICATION_KEY: !!process.env.B2_APPLICATION_KEY,
        B2_BUCKET_NAME: !!process.env.B2_BUCKET_NAME,
        B2_ENDPOINT: !!process.env.B2_ENDPOINT,
      },
    },
    imageOptimization: {
      provider: isCloudinaryEnabled() ? 'cloudinary' : 'none',
      configured: {
        CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
      },
    },
    summary: {
      storageReady: true, // Siempre true porque local es el fallback
      cloudStorageReady: isCloudStorageEnabled(),
      imageOptimizationReady: isCloudinaryEnabled(),
    },
  }

  return NextResponse.json(status)
}
