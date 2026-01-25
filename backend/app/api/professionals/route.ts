import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    return NextResponse.json(professionals)
  } catch (error) {
    console.error('Error fetching professionals:', error)
    return NextResponse.json(
      { error: 'Error al obtener profesionales' },
      { status: 500 }
    )
  }
}
