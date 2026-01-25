import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/security'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { parseISO, addWeeks } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const TIMEZONE = 'America/Argentina/Buenos_Aires'

const createHoldSchema = z.object({
  patientId: z.string(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  recurrence: z.enum(['single', 'weekly']).default('single'),
  weeks: z.number().int().min(1).max(52).optional(), // Para recurrencia semanal
})

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const professionalId = searchParams.get('professionalId')

    // Verificar acceso: solo puede ver sus propios holds o ser ADMIN
    const targetProfessionalId = professionalId || user.professionalId
    if (user.role !== 'ADMIN' && targetProfessionalId !== user.professionalId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const where: any = {
      professionalId: targetProfessionalId,
    }

    if (from) {
      where.startAt = { gte: parseISO(from) }
    }
    if (to) {
      where.startAt = { ...where.startAt, lte: parseISO(to) }
    }

    const holds = await prisma.slotHold.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { startAt: 'asc' },
    })

    return NextResponse.json({ holds })
  } catch (error: any) {
    console.error('Error fetching holds:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener reservas' },
      { status: error.message?.includes('No autorizado') ? 401 : 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    const validated = createHoldSchema.parse(body)

    // Verificar que el paciente pertenece al profesional
    const patient = await prisma.patient.findUnique({
      where: { id: validated.patientId },
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      )
    }

    if (patient.professionalId !== user.professionalId && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado: acceso denegado a este paciente' },
        { status: 403 }
      )
    }

    const startAt = parseISO(validated.startAt)
    const startLocal = utcToZonedTime(startAt, TIMEZONE)

    // Calcular endAt si no se proporciona (50 minutos por defecto)
    let endAt: Date
    if (validated.endAt) {
      endAt = parseISO(validated.endAt)
    } else {
      endAt = new Date(startAt.getTime() + 50 * 60 * 1000)
    }

    const holds: any[] = []

    if (validated.recurrence === 'single') {
      // Crear un solo hold
      const hold = await prisma.slotHold.create({
        data: {
          professionalId: user.professionalId,
          patientId: validated.patientId,
          startAt,
          endAt,
          status: 'HOLD',
        },
      })
      holds.push(hold)
    } else if (validated.recurrence === 'weekly' && validated.weeks) {
      // Crear holds semanales
      const duration = endAt.getTime() - startAt.getTime()

      for (let week = 0; week < validated.weeks; week++) {
        const weekStartAt = addWeeks(startAt, week)
        const weekEndAt = new Date(weekStartAt.getTime() + duration)

        const hold = await prisma.slotHold.create({
          data: {
            professionalId: user.professionalId,
            patientId: validated.patientId,
            startAt: weekStartAt,
            endAt: weekEndAt,
            status: 'HOLD',
          },
        })
        holds.push(hold)
      }
    }

    await logAudit(user.id, 'CREATE_SLOT_HOLD', 'SLOT_HOLD', holds[0]?.id, {
      patientId: validated.patientId,
      count: holds.length,
    })

    return NextResponse.json({ holds }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating hold:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear reserva' },
      { status: error.message?.includes('No autorizado') ? 401 : 500 }
    )
  }
}

