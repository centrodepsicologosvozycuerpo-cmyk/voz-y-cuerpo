import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

export async function GET(request: Request) {
  try {
    // Obtener professionalId del header o query param
    const url = new URL(request.url)
    const professionalId = request.headers.get('X-Professional-Id') || url.searchParams.get('professionalId')

    if (!professionalId) {
      return NextResponse.json({ error: 'Professional ID requerido' }, { status: 400 })
    }

    const appointments = await prisma.appointment.findMany({
      where: { professionalId },
      include: {
        professional: {
          select: {
            id: true,
            fullName: true,
            slug: true,
          },
        },
      },
      orderBy: { startAt: 'desc' },
    })

    return NextResponse.json({ appointments })
  } catch (error: any) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 })
  }
}


