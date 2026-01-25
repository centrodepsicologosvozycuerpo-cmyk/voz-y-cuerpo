import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/security'
import { uploadFile, isCloudStorageEnabled } from '@/lib/storage'
import { getOptimizedImageUrl } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

// Handler para preflight CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Professional-Id',
    },
  })
}

export async function POST(request: Request) {
  try {
    await requireAuth(request) // Solo usuarios autenticados pueden subir fotos
    
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Archivo requerido' },
        { status: 400 }
      )
    }

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo debe ser una imagen' },
        { status: 400 }
      )
    }

    // Validar tamaño (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'La imagen no debe superar los 5MB' },
        { status: 400 }
      )
    }

    // Subir archivo a storage (B2 o local)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const result = await uploadFile(buffer, file.name, {
      folder: 'professionals',
      contentType: file.type,
    })

    // Generar URLs optimizadas si Cloudinary está habilitado
    const urls = {
      original: result.url,
      thumbnail: getOptimizedImageUrl(result.url, 'thumbnail'),
      avatar: getOptimizedImageUrl(result.url, 'avatar'),
      profile: getOptimizedImageUrl(result.url, 'profile'),
    }

    return NextResponse.json({
      storageName: result.key.split('/').pop(), // Mantener compatibilidad con código existente
      storageKey: result.key,
      url: result.url,
      urls,
      provider: result.provider,
      size: result.size,
      cloudStorage: isCloudStorageEnabled(),
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error uploading photo:', error)
    return NextResponse.json(
      { error: error.message || 'Error al subir foto' },
      { status: error.message?.includes('No autorizado') ? 401 : 500 }
    )
  }
}
