import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/security'
import { uploadFile, isCloudStorageEnabled } from '@/lib/storage'

export const dynamic = 'force-dynamic'

// Construir URLs de Cloudinary sin importar ningún módulo cloudinary (evita chunk SDK → Invalid URL)
function buildCloudinaryUrl(sourceUrl: string, transform: string): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  if (!cloudName || !sourceUrl || sourceUrl.trim() === '') return sourceUrl || ''
  const encoded = encodeURIComponent(sourceUrl)
  return `https://res.cloudinary.com/${cloudName}/image/fetch/${transform}/${encoded}`
}

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
    console.log('[photo/upload] request', request)
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
    console.log('[photo/upload] subiendo archivo a storage')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const result = await uploadFile(buffer, file.name, {
      folder: 'professionals',
      contentType: file.type,
    })

    console.log('[photo/upload] uploadFile result', {
      key: result.key,
      urlLength: result.url?.length ?? 0,
      urlPreview: result.url ? result.url.slice(0, 100) : result.url,
      provider: result.provider,
    })

    if (!result.url || result.url.trim() === '') {
      console.error('[photo/upload] result.url vacía después de uploadFile, no se llamará getOptimizedImageUrl')
    }

    // URLs optimizadas (Cloudinary fetch) sin cargar SDK; si no hay cloud name, devolvemos la misma URL
    const baseUrl = result.url && result.url.trim() !== '' ? result.url : (result.url ?? '')
    const urls = {
      original: result.url,
      thumbnail: baseUrl ? buildCloudinaryUrl(baseUrl, 'w_150,h_150,c_fill,g_auto,q_auto,f_auto') : baseUrl,
      avatar: baseUrl ? buildCloudinaryUrl(baseUrl, 'w_200,h_200,c_fill,g_face,q_auto,f_auto') : baseUrl,
      profile: baseUrl ? buildCloudinaryUrl(baseUrl, 'w_600,h_600,c_fill,g_face,q_auto,f_auto') : baseUrl,
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
