import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addHours } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'
import { sendReminderEmail, sendReminderWhatsApp } from '@/lib/notifications'

const TIMEZONE = 'America/Argentina/Buenos_Aires'
const REMINDER_24H_ENABLED = process.env.REMINDER_24H_ENABLED !== 'false'
const REMINDER_2H_ENABLED = process.env.REMINDER_2H_ENABLED !== 'false'

export async function POST(request: Request) {
  try {
    // Verificar que es una llamada autorizada (en producción, agregar autenticación)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'demo-secret'}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const now = utcToZonedTime(new Date(), TIMEZONE)
    const reminders24h = REMINDER_24H_ENABLED ? addHours(now, 24) : null
    const reminders2h = REMINDER_2H_ENABLED ? addHours(now, 2) : null

    // Buscar turnos confirmados que necesitan recordatorio de 24h
    const appointments24h = REMINDER_24H_ENABLED
      ? await prisma.appointment.findMany({
          where: {
            status: 'CONFIRMED',
            startAt: {
              gte: reminders24h!,
              lt: addHours(reminders24h!, 1),
            },
          },
          include: {
            professional: true,
            notifications: {
              where: {
                type: 'EMAIL_REMINDER_24H',
              },
            },
          },
        })
      : []

    // Buscar turnos confirmados que necesitan recordatorio de 2h
    const appointments2h = REMINDER_2H_ENABLED
      ? await prisma.appointment.findMany({
          where: {
            status: 'CONFIRMED',
            startAt: {
              gte: reminders2h!,
              lt: addHours(reminders2h!, 1),
            },
          },
          include: {
            professional: true,
            notifications: {
              where: {
                type: 'WA_REMINDER_2H',
              },
            },
          },
        })
      : []

    const sent24h: string[] = []
    const sent2h: string[] = []

    // Enviar recordatorios de 24h
    for (const appointment of appointments24h) {
      // Verificar que no se haya enviado ya
      if (appointment.notifications.length > 0) {
        continue
      }

      await sendReminderEmail(appointment, 24)
      sent24h.push(appointment.id)
    }

    // Enviar recordatorios de 2h
    for (const appointment of appointments2h) {
      // Verificar que no se haya enviado ya
      if (appointment.notifications.length > 0) {
        continue
      }

      await sendReminderWhatsApp(appointment, 2)
      sent2h.push(appointment.id)
    }

    return NextResponse.json({
      message: 'Recordatorios procesados',
      reminders24h: {
        sent: sent24h.length,
        appointments: sent24h,
      },
      reminders2h: {
        sent: sent2h.length,
        appointments: sent2h,
      },
    })
  } catch (error) {
    console.error('Error processing reminders:', error)
    return NextResponse.json(
      { error: 'Error al procesar recordatorios' },
      { status: 500 }
    )
  }
}

// También permitir GET para facilitar testing desde el admin
export async function GET() {
  return POST(new Request('http://localhost', { method: 'POST' }))
}



