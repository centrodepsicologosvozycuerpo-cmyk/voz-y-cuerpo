import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/security'
import { uploadFile, deleteFile, isCloudStorageEnabled } from '@/lib/storage'
import { getOptimizedImageUrl } from '@/lib/cloudinary-urls'

export const dynamic = 'force-dynamic'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

// Límites de archivos
const MAX_IMAGE_SIZE = 5 * 1024 * 1024    // 5MB para imágenes
const MAX_VIDEO_SIZE = 25 * 1024 * 1024   // 25MB para videos (recomendado: 720p, max 30seg)
const MAX_BANNERS = 10                     // Máximo banners activos

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']

/**
 * GET /api/panel/banners - Lista todos los banners (incluyendo inactivos)
 */
export async function GET(request: Request) {
  try {
    await requireAuth(request)

    const banners = await prisma.banner.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        uploadedBy: {
          select: {
            id: true,
            professional: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    })

    // Agregar URLs optimizadas para imágenes
    const bannersWithUrls = banners.map(banner => ({
      ...banner,
      uploadedByName: banner.uploadedBy.professional.fullName,
      urls: banner.mediaType === 'image' 
        ? {
            original: banner.url,
            thumbnail: getOptimizedImageUrl(banner.url, 'thumbnail'),
            hero: getOptimizedImageUrl(banner.url, 'hero'),
          }
        : { original: banner.url },
    }))

    return NextResponse.json({ banners: bannersWithUrls }, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Error fetching banners:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener banners' },
      { status: error.message?.includes('No autorizado') ? 401 : 500, headers: corsHeaders }
    )
  }
}

/**
 * POST /api/panel/banners - Sube un nuevo banner
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth(request)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'Archivo requerido' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Determinar tipo de archivo
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Use imágenes (JPEG, PNG, WebP, GIF) o videos (MP4, WebM)' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validar tamaño según tipo
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
    const maxSizeMB = maxSize / (1024 * 1024)
    
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `El archivo no debe superar los ${maxSizeMB}MB` },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verificar límite de banners activos
    const activeBannersCount = await prisma.banner.count({
      where: { isActive: true },
    })

    if (activeBannersCount >= MAX_BANNERS) {
      return NextResponse.json(
        { error: `Límite de ${MAX_BANNERS} banners activos alcanzado. Desactiva alguno primero.` },
        { status: 400, headers: corsHeaders }
      )
    }

    // Obtener el orden máximo actual para agregar al final
    const maxOrder = await prisma.banner.aggregate({
      _max: { order: true },
    })
    const newOrder = (maxOrder._max.order ?? -1) + 1

    // Subir archivo a storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadResult = await uploadFile(buffer, file.name, {
      folder: 'banners',
      contentType: file.type,
    })

    // Crear registro en DB
    const banner = await prisma.banner.create({
      data: {
        title: title || null,
        mediaType: isImage ? 'image' : 'video',
        url: uploadResult.url,
        storageKey: uploadResult.key,
        provider: uploadResult.provider,
        fileSize: uploadResult.size,
        order: newOrder,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: {
          select: {
            professional: {
              select: { fullName: true },
            },
          },
        },
      },
    })

    return NextResponse.json({
      banner: {
        ...banner,
        uploadedByName: banner.uploadedBy.professional.fullName,
        urls: banner.mediaType === 'image'
          ? {
              original: banner.url,
              thumbnail: getOptimizedImageUrl(banner.url, 'thumbnail'),
              hero: getOptimizedImageUrl(banner.url, 'hero'),
            }
          : { original: banner.url },
      },
      cloudStorage: isCloudStorageEnabled(),
    }, { status: 201, headers: corsHeaders })
  } catch (error: any) {
    console.error('Error uploading banner:', error)
    return NextResponse.json(
      { error: error.message || 'Error al subir banner' },
      { status: error.message?.includes('No autorizado') ? 401 : 500, headers: corsHeaders }
    )
  }
}

/**
 * PUT /api/panel/banners - Actualiza banners (orden, título, activo)
 * 
 * Body: { banners: [{ id, order?, title?, isActive? }] }
 */
export async function PUT(request: Request) {
  try {
    await requireAuth(request)

    const body = await request.json()
    const { banners } = body as { banners: Array<{ id: string; order?: number; title?: string; isActive?: boolean }> }

    if (!banners || !Array.isArray(banners)) {
      return NextResponse.json(
        { error: 'Se requiere un array de banners' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verificar límite de banners activos
    const willBeActive = banners.filter(b => b.isActive === true).length
    const currentActive = await prisma.banner.count({ where: { isActive: true } })
    const changedToInactive = banners.filter(b => b.isActive === false).length
    
    // Calcular total estimado de activos después del update
    // Esto es una estimación simplificada
    if (willBeActive > 0) {
      const bannersToActivate = banners.filter(b => b.isActive === true).map(b => b.id)
      const currentlyActive = await prisma.banner.count({
        where: { id: { in: bannersToActivate }, isActive: true },
      })
      const newActivations = willBeActive - currentlyActive
      
      if (currentActive + newActivations - changedToInactive > MAX_BANNERS) {
        return NextResponse.json(
          { error: `Límite de ${MAX_BANNERS} banners activos alcanzado` },
          { status: 400, headers: corsHeaders }
        )
      }
    }

    // Actualizar cada banner
    const updates = await Promise.all(
      banners.map(async ({ id, order, title, isActive }) => {
        const data: any = {}
        if (order !== undefined) data.order = order
        if (title !== undefined) data.title = title
        if (isActive !== undefined) data.isActive = isActive

        return prisma.banner.update({
          where: { id },
          data,
        })
      })
    )

    return NextResponse.json({ updated: updates.length }, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Error updating banners:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar banners' },
      { status: error.message?.includes('No autorizado') ? 401 : 500, headers: corsHeaders }
    )
  }
}

/**
 * DELETE /api/panel/banners - Elimina un banner
 * 
 * Query: ?id=xxx
 */
export async function DELETE(request: Request) {
  try {
    await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de banner requerido' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Buscar el banner
    const banner = await prisma.banner.findUnique({
      where: { id },
    })

    if (!banner) {
      return NextResponse.json(
        { error: 'Banner no encontrado' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Eliminar archivo del storage
    if (banner.storageKey) {
      try {
        await deleteFile(banner.storageKey)
      } catch (error) {
        console.error('Error deleting banner file:', error)
        // Continuar con la eliminación del registro aunque falle el archivo
      }
    }

    // Eliminar registro de DB
    await prisma.banner.delete({
      where: { id },
    })

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Error deleting banner:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar banner' },
      { status: error.message?.includes('No autorizado') ? 401 : 500, headers: corsHeaders }
    )
  }
}
