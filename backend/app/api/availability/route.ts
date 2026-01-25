import { NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/availability'
import { parseISO, startOfDay, addDays } from 'date-fns'

export const dynamic = 'force-dynamic'

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const professionalSlug = searchParams.get('professionalSlug')
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const modality = searchParams.get('modality') || undefined

    if (!professionalSlug) {
      return NextResponse.json(
        { error: 'professionalSlug es requerido' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      )
    }

    const { prisma } = await import('@/lib/prisma')
    const professional = await prisma.professional.findUnique({
      where: { slug: professionalSlug },
    })

    if (!professional || !professional.isActive) {
      return NextResponse.json(
        { error: 'Profesional no encontrado' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      )
    }

    const from = fromParam ? parseISO(fromParam) : startOfDay(new Date())
    const to = toParam ? parseISO(toParam) : addDays(from, 21)

    // LOG TEMPORAL: Verificar qué se está consultando
    console.log('[DEBUG GET /api/availability]')
    console.log('  Professional slug:', professionalSlug)
    console.log('  Professional ID:', professional.id)
    console.log('  From:', from.toISOString())
    console.log('  To:', to.toISOString())
    console.log('  Modality:', modality || 'todas')

    // Verificar reglas en DB (usar prisma ya importado)
    const rulesCount = await prisma.availabilityRule.count({
      where: { professionalId: professional.id },
    })
    console.log('  Rules en DB:', rulesCount)

    const slots = await getAvailableSlots(professional.id, from, to, modality)
    console.log('  Slots generados:', slots.length)

    return NextResponse.json({
      professional: {
        id: professional.id,
        fullName: professional.fullName,
      },
      slots: slots.map((slot) => ({
        startAt: slot.startAt.toISOString(),
        endAt: slot.endAt.toISOString(),
        modality: slot.modality,
        locationLabel: slot.locationLabel,
      })),
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    console.error('Error fetching availability:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      { 
        error: 'Error al obtener disponibilidad',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    )
  }
}


