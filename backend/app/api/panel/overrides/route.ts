import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/get-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { startOfDay, parseISO } from 'date-fns'
import { zonedTimeToUtc } from 'date-fns-tz'

const TIMEZONE = 'America/Argentina/Buenos_Aires'

const overrideRangeSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  modality: z.string().optional().nullable(),
  locationLabel: z.string().optional().nullable(),
})

const overrideSchema = z.object({
  date: z.string(), // ISO string
  isUnavailable: z.boolean().default(false),
  slotMinutes: z.number().positive().optional(),
  bufferMinutes: z.number().min(0).optional(),
  ranges: z.array(overrideRangeSchema).optional(),
})

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    const from = fromParam ? parseISO(fromParam) : new Date()
    const to = toParam ? parseISO(toParam) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 días por defecto

    const overrides = await prisma.availabilityOverride.findMany({
      where: {
        professionalId: user.professionalId,
        date: {
          gte: from,
          lte: to,
        },
      },
      include: {
        ranges: {
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({ overrides })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'No autorizado' }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const validated = overrideSchema.parse(body)

    // Convertir fecha a medianoche en timezone local
    const dateISO = parseISO(validated.date)
    const dateLocal = startOfDay(dateISO)
    const dateUTC = zonedTimeToUtc(dateLocal, TIMEZONE)

    // Validar: si isUnavailable=true, no debe haber ranges
    if (validated.isUnavailable && validated.ranges && validated.ranges.length > 0) {
      return NextResponse.json(
        { error: 'No se pueden definir rangos si el día está marcado como no disponible' },
        { status: 400 }
      )
    }

    // Validar: si isUnavailable=false, debe haber al menos un rango
    if (!validated.isUnavailable && (!validated.ranges || validated.ranges.length === 0)) {
      return NextResponse.json(
        { error: 'Debe definir al menos un rango horario o marcar el día como no disponible' },
        { status: 400 }
      )
    }

    // Upsert: eliminar override existente y crear uno nuevo (para simplificar)
    await prisma.availabilityOverride.deleteMany({
      where: {
        professionalId: user.professionalId,
        date: dateUTC,
      },
    })

    const override = await prisma.availabilityOverride.create({
      data: {
        professionalId: user.professionalId,
        date: dateUTC,
        isUnavailable: validated.isUnavailable,
        slotMinutes: validated.slotMinutes || 50,
        bufferMinutes: validated.bufferMinutes || 10,
        ranges: validated.ranges && !validated.isUnavailable
          ? {
              create: validated.ranges.map((range) => ({
                startTime: range.startTime,
                endTime: range.endTime,
                modality: range.modality || null,
                locationLabel: range.locationLabel || null,
              })),
            }
          : undefined,
      },
      include: {
        ranges: true,
      },
    })

    return NextResponse.json({ override })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Error al crear override' }, { status: 500 })
  }
}

