import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAvailableSlots } from '@/lib/availability'
import { parseISO, isAfter } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'
import { generateToken } from '@/lib/utils'
import { sendBookingRequestNotifications } from '@/lib/notifications'

const TIMEZONE = 'America/Argentina/Buenos_Aires'

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

const appointmentSchema = z.object({
  professionalId: z.string(),
  startAt: z.string().datetime(),
  modality: z.enum(['online', 'presencial']),
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  clientPhone: z.string().min(1),
  acceptPolicies: z.boolean(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = appointmentSchema.parse({
      ...body,
      acceptPolicies: body.acceptPolicies === true || body.acceptPolicies === 'on',
    })

    if (!validated.acceptPolicies) {
      return NextResponse.json(
        { error: 'Debés aceptar las políticas de privacidad' },
        { status: 400 }
      )
    }

    const startAt = parseISO(validated.startAt)
    const now = utcToZonedTime(new Date(), TIMEZONE)
    const slotStart = utcToZonedTime(startAt, TIMEZONE)

    // Verificar que el slot no esté en el pasado
    if (!isAfter(slotStart, now)) {
      return NextResponse.json(
        { error: 'No se puede reservar un turno en el pasado' },
        { status: 400 }
      )
    }

    // Verificar que el profesional existe y está activo
    const professional = await prisma.professional.findUnique({
      where: { id: validated.professionalId },
      include: {
        availabilityRules: true,
      },
    })

    if (!professional || !professional.isActive) {
      return NextResponse.json(
        { error: 'Profesional no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Verificar que el slot está disponible
    const availableSlots = await getAvailableSlots(
      validated.professionalId,
      startAt,
      startAt,
      validated.modality
    )

    const slotExists = availableSlots.some(
      (slot) => slot.startAt.getTime() === startAt.getTime()
    )

    if (!slotExists) {
      return NextResponse.json(
        { error: 'El horario seleccionado ya no está disponible' },
        { status: 400 }
      )
    }

    // Verificar que no haya otro turno en el mismo slot
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        professionalId: validated.professionalId,
        startAt: startAt,
        status: { in: ['PENDING_CONFIRMATION', 'CONFIRMED'] },
      },
    })

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'El horario ya está ocupado' },
        { status: 400 }
      )
    }

    // Calcular endAt (50 minutos por defecto, o según la regla)
    const rule = professional.availabilityRules.find(
      (r) => r.dayOfWeek === slotStart.getDay()
    )
    const slotMinutes = rule?.slotMinutes || 50
    const endAt = new Date(startAt.getTime() + slotMinutes * 60 * 1000)

    // Obtener locationLabel si es presencial
    const locationRule = professional.availabilityRules.find(
      (r) => r.dayOfWeek === slotStart.getDay() && r.locationLabel
    )
    const locationLabel = locationRule?.locationLabel || null

    // Crear el turno
    const confirmationToken = generateToken()
    const cancelToken = generateToken()

    const appointment = await prisma.appointment.create({
      data: {
        professionalId: validated.professionalId,
        startAt: startAt,
        endAt: endAt,
        modality: validated.modality,
        locationLabel: locationLabel,
        clientName: validated.clientName,
        clientEmail: validated.clientEmail,
        clientPhone: validated.clientPhone,
        status: 'PENDING_CONFIRMATION', // Pendiente hasta que el profesional confirme
        confirmationToken,
        cancelToken,
      },
    })

    // Enviar notificaciones en segundo plano (no bloquear la respuesta)
    // En Render el SMTP suele hacer timeout; el turno ya quedó creado
    sendBookingRequestNotifications(appointment).catch((err) => {
      console.error('Notificaciones en segundo plano:', err)
    })

    return NextResponse.json({
      id: appointment.id,
      message: 'Solicitud de turno enviada. El profesional confirmará tu turno pronto.',
      status: 'PENDING_CONFIRMATION',
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Error al crear el turno' },
      { status: 500 }
    )
  }
}



