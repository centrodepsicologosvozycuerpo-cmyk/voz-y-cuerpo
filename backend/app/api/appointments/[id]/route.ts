import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Handler para preflight CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204, // 204 No Content es el estándar para OPTIONS
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control',
      'Access-Control-Max-Age': '86400', // 24 horas
    },
  })
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Headers CORS que se usarán en todas las respuestas
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control',
  }

  try {
    const { id } = params
    
    console.log(`[GET /api/appointments/[id]] Params recibidos:`, params)
    console.log(`[GET /api/appointments/[id]] ID extraído:`, id)
    
    if (!id) {
      console.error('[GET /api/appointments/[id]] ID no proporcionado')
      return NextResponse.json(
        { error: 'ID de turno requerido' },
        { 
          status: 400,
          headers: corsHeaders,
        }
      )
    }

    console.log(`[GET /api/appointments/${id}] Buscando turno...`)
    
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        professional: {
          select: {
            id: true,
            slug: true,
            fullName: true,
            title: true,
            photo: true,
            whatsappPhone: true,
          },
        },
      },
    })

    if (!appointment) {
      console.log(`[GET /api/appointments/${id}] Turno no encontrado`)
      return NextResponse.json(
        { error: 'Turno no encontrado' },
        { 
          status: 404,
          headers: corsHeaders,
        }
      )
    }

    // Asegurar que el status se devuelva correctamente
    const response = {
      ...appointment,
      status: appointment.status || 'PENDING_CONFIRMATION',
    }

    // Debug log (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[GET /api/appointments/${id}] Status:`, response.status)
    }

    console.log(`[GET /api/appointments/${id}] Turno encontrado, devolviendo respuesta`)
    return NextResponse.json(response, {
      headers: corsHeaders,
    })
  } catch (error) {
    console.error('[GET /api/appointments/[id]] Error capturado:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('[GET /api/appointments/[id]] Error details:', { errorMessage, errorStack })
    
    return NextResponse.json(
      { 
        error: 'Error al obtener el turno',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { 
        status: 500,
        headers: corsHeaders,
      }
    )
  }
}

