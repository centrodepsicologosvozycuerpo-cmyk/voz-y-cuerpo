import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPublicUrl } from '@/lib/storage'
import { getOptimizedImageUrl } from '@/lib/cloudinary-urls'

// Handler para preflight CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

function buildPhotoUrls(photo: string | null): { original: string; thumbnail: string; avatar: string; profile: string } | null {
  if (!photo || !photo.trim()) return null
  const sourceUrl = photo.startsWith('http')
    ? photo
    : getPublicUrl(photo.startsWith('professionals/') ? photo : `professionals/${photo}`)
  return {
    original: sourceUrl,
    thumbnail: getOptimizedImageUrl(sourceUrl, 'thumbnail'),
    avatar: getOptimizedImageUrl(sourceUrl, 'avatar'),
    profile: getOptimizedImageUrl(sourceUrl, 'profile'),
  }
}

export async function GET() {
  try {
    const professionals = await prisma.professional.findMany({
      where: { isActive: true },
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        slug: true,
        fullName: true,
        title: true,
        modalities: true,
        languages: true,
        specialties: true,
        approach: true,
        isActive: true,
        contactEmail: true,
        whatsappPhone: true,
        photo: true,
        description: true,
      },
    })

    const withPhotoUrls = professionals.map(p => ({
      ...p,
      photoUrls: buildPhotoUrls(p.photo),
    }))

    return NextResponse.json(withPhotoUrls)
  } catch (error) {
    console.error('Error fetching professionals:', error)
    return NextResponse.json(
      { error: 'Error al obtener profesionales' },
      { status: 500 }
    )
  }
}
