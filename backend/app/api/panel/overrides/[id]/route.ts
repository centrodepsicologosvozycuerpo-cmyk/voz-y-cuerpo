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

const updateOverrideSchema = z.object({
  date: z.string().optional(),
  isUnavailable: z.boolean().optional(),
  slotMinutes: z.number().positive().optional(),
  bufferMinutes: z.number().min(0).optional(),
  ranges: z.array(overrideRangeSchema).optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const validated = updateOverrideSchema.parse(body)

    const existing = await prisma.availabilityOverride.findUnique({
      where: { id: params.id },
      include: { ranges: true },
    })

    if (!existing || existing.professionalId !== user.professionalId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Si se actualiza la fecha, convertir a UTC
    let dateUTC = existing.date
    if (validated.date) {
      const dateISO = parseISO(validated.date)
      const dateLocal = startOfDay(dateISO)
      dateUTC = zonedTimeToUtc(dateLocal, TIMEZONE)
    }

    // Validaciones
    const isUnavailable = validated.isUnavailable ?? existing.isUnavailable
    const ranges = validated.ranges ?? existing.ranges.map((r) => ({
      startTime: r.startTime,
      endTime: r.endTime,
      modality: r.modality,
      locationLabel: r.locationLabel,
    }))

    if (isUnavailable && ranges.length > 0) {
      return NextResponse.json(
        { error: 'No se pueden definir rangos si el día está marcado como no disponible' },
        { status: 400 }
      )
    }

    if (!isUnavailable && ranges.length === 0) {
      return NextResponse.json(
        { error: 'Debe definir al menos un rango horario o marcar el día como no disponible' },
        { status: 400 }
      )
    }

    // Eliminar rangos existentes y crear nuevos
    await prisma.availabilityOverrideRange.deleteMany({
      where: { overrideId: params.id },
    })

    const updated = await prisma.availabilityOverride.update({
      where: { id: params.id },
      data: {
        date: dateUTC,
        isUnavailable,
        slotMinutes: validated.slotMinutes ?? existing.slotMinutes,
        bufferMinutes: validated.bufferMinutes ?? existing.bufferMinutes,
        ranges: !isUnavailable
          ? {
              create: ranges.map((range) => ({
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

    return NextResponse.json({ override: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    const override = await prisma.availabilityOverride.findUnique({
      where: { id: params.id },
    })

    if (!override || override.professionalId !== user.professionalId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await prisma.availabilityOverride.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al eliminar' }, { status: 500 })
  }
}
