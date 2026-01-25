import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/debug/notifications
 * 
 * Muestra los últimos logs de notificaciones
 */
export async function GET(request: Request) {
  // Solo en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const appointmentId = searchParams.get('appointmentId')

  const where = appointmentId ? { appointmentId } : {}

  const logs = await prisma.notificationLog.findMany({
    where,
    orderBy: { sentAt: 'desc' },
    take: limit,
    include: {
      appointment: {
        select: {
          clientName: true,
          clientEmail: true,
          professional: {
            select: {
              fullName: true,
              user: {
                select: { email: true }
              }
            }
          }
        }
      }
    }
  })

  // Formatear para mejor lectura
  const formatted = logs.map(log => ({
    id: log.id,
    type: log.type,
    status: log.status,
    sentAt: log.sentAt,
    payload: log.payloadPreview ? JSON.parse(log.payloadPreview) : null,
    appointment: {
      clientName: log.appointment.clientName,
      clientEmail: log.appointment.clientEmail,
      professionalName: log.appointment.professional.fullName,
      professionalEmail: log.appointment.professional.user?.email || 'NO CONFIGURADO',
    }
  }))

  return NextResponse.json({
    total: logs.length,
    logs: formatted,
  })
}
