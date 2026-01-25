import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/security'
import { sendBookingConfirmationNotifications } from '@/lib/notifications'

const confirmSchema = z.object({
  appointmentId: z.string(),
})

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
    const user = await requireAuth(request)
    const body = await request.json()
    const { appointmentId } = confirmSchema.parse(body)

    // Buscar el turno
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { professional: true },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Turno no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el profesional tiene permiso (es su turno o es admin)
    if (user.role !== 'ADMIN' && user.professionalId !== appointment.professionalId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Verificar que el turno está pendiente de confirmación
    if (appointment.status !== 'PENDING_CONFIRMATION') {
      return NextResponse.json(
        { error: `El turno no puede ser confirmado (estado actual: ${appointment.status})` },
        { status: 400 }
      )
    }

    // Confirmar el turno
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedBy: user.id,
      },
    })

    // Enviar notificación al paciente
    await sendBookingConfirmationNotifications(updated)

    return NextResponse.json({
      message: 'Turno confirmado exitosamente',
      appointment: {
        id: updated.id,
        status: updated.status,
        confirmedAt: updated.confirmedAt,
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error confirming appointment:', error)
    return NextResponse.json(
      { error: error.message || 'Error al confirmar el turno' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    )
  }
}
