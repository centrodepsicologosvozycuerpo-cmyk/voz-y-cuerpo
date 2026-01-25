import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { differenceInHours, isWeekend, addHours } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'
import { sendAllCancellationNotifications } from '@/lib/notifications'

const TIMEZONE = 'America/Argentina/Buenos_Aires'
const CANCEL_WINDOW_BUSINESS_HOURS = 24 // 24 horas hábiles

/**
 * Calcula las horas hábiles entre dos fechas
 * Considera lunes a viernes de 9 a 18 como horas hábiles
 */
function getBusinessHoursUntil(appointmentDate: Date, now: Date): number {
  let businessHours = 0
  let current = new Date(now)
  
  // Redondear la hora actual hacia arriba para empezar desde la próxima hora completa
  current.setMinutes(0, 0, 0)
  current = addHours(current, 1) // Empezar desde la próxima hora
  
  while (current < appointmentDate) {
    const dayOfWeek = current.getDay() // 0 = domingo, 1 = lunes, ..., 6 = sábado
    const hour = current.getHours()
    
    // Lunes a viernes (1-5) y horas entre 9 y 17 (inclusive)
    const isBusinessHour = dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour < 18
    
    if (isBusinessHour) {
      businessHours++
    }
    
    current = addHours(current, 1)
  }
  
  return businessHours
}

const cancelSchema = z.object({
  cancelToken: z.string(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { cancelToken } = cancelSchema.parse(body)

    const appointment = await prisma.appointment.findUnique({
      where: { cancelToken },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Token de cancelación inválido' },
        { status: 404 }
      )
    }

    if (appointment.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'El turno ya ha sido cancelado' },
        { status: 400 }
      )
    }

    // Verificar ventana de cancelación (24 horas hábiles)
    const localStart = utcToZonedTime(appointment.startAt, TIMEZONE)
    const now = utcToZonedTime(new Date(), TIMEZONE)
    const businessHoursUntil = getBusinessHoursUntil(localStart, now)

    // Debug log para ver qué está pasando
    console.log('[CANCEL] Verificando cancelación:')
    console.log('  Turno:', localStart.toISOString())
    console.log('  Ahora:', now.toISOString())
    console.log('  Horas hábiles hasta el turno:', businessHoursUntil)
    console.log('  Requeridas:', CANCEL_WINDOW_BUSINESS_HOURS)

    if (businessHoursUntil < CANCEL_WINDOW_BUSINESS_HOURS) {
      return NextResponse.json(
        { 
          error: `No se puede cancelar con menos de ${CANCEL_WINDOW_BUSINESS_HOURS} horas hábiles de anticipación`,
          businessHoursRemaining: businessHoursUntil,
          appointmentDate: localStart.toISOString(),
          currentDate: now.toISOString(),
        },
        { status: 400 }
      )
    }

    // Cancelar el turno
    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'CANCELLED',
        cancelledBy: 'CLIENT',
        cancelledAt: new Date(),
      },
    })

    // Enviar notificaciones (al profesional)
    await sendAllCancellationNotifications(updated, undefined, 'patient')

    console.log(`Turno ${appointment.id} cancelado por ${appointment.clientName}`)

    return NextResponse.json({
      message: 'Turno cancelado exitosamente',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error canceling appointment:', error)
    return NextResponse.json(
      { error: 'Error al cancelar el turno' },
      { status: 500 }
    )
  }
}



