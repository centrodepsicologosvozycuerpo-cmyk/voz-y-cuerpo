import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOptimizedImageUrl } from '@/lib/cloudinary-urls'

export const dynamic = 'force-dynamic'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

/**
 * GET /api/banners - Obtiene los banners activos (endpoint público)
 * 
 * Retorna solo banners activos, ordenados por el campo `order`
 * Incluye URLs optimizadas de Cloudinary para imágenes
 */
export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        mediaType: true,
        url: true,
        order: true,
      },
    })

    // Generar URLs optimizadas para imágenes
    const bannersWithUrls = banners.map(banner => {
      if (banner.mediaType === 'image') {
        return {
          ...banner,
          urls: {
            original: banner.url,
            hero: getOptimizedImageUrl(banner.url, 'hero'),
          },
        }
      }
      // Para videos, solo retornar la URL original
      return {
        ...banner,
        urls: {
          original: banner.url,
        },
      }
    })

    return NextResponse.json({ banners: bannersWithUrls }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching banners:', error)
    return NextResponse.json(
      { error: 'Error al obtener banners' },
      { status: 500, headers: corsHeaders }
    )
  }
}
