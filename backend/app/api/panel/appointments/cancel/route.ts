import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/security'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendAllCancellationNotifications, sendCancellationWhatsApp } from '@/lib/notifications'

const cancelSchema = z.object({
  appointmentId: z.string(),
  reason: z.string().min(1, 'El motivo es requerido'),
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
    const { appointmentId, reason } = cancelSchema.parse(body)

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { professional: true },
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 })
    }

    // Verificar permiso (es su turno o es admin)
    if (user.role !== 'ADMIN' && user.professionalId !== appointment.professionalId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (appointment.status === 'CANCELLED') {
      return NextResponse.json({ error: 'El turno ya está cancelado' }, { status: 400 })
    }

    // Cancelar el turno con el motivo
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        cancelledBy: 'PROFESSIONAL',
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    })

    // Enviar notificaciones con el motivo
    await sendAllCancellationNotifications(updated, reason, 'professional')
    
    // Generar URL de WhatsApp
    const whatsappUrl = await sendCancellationWhatsApp(
      updated,
      appointment.professional.fullName,
      appointment.professional.slug
    )

    return NextResponse.json({
      success: true,
      message: 'Turno cancelado exitosamente',
      whatsappUrl,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error cancelling appointment:', error)
    return NextResponse.json(
      { error: error.message || 'Error al cancelar' },
      { status: error.message?.includes('No autorizado') ? 403 : 500 }
    )
  }
}
