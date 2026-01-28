import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/get-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  slotMinutes: z.number().positive().optional(),
  bufferMinutes: z.number().min(0).optional(),
  modality: z.string().optional().nullable(),
  locationLabel: z.string().optional().nullable(),
})

// Convierte "HH:MM" a minutos desde medianoche
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Verifica si dos rangos se solapan
function rangesOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return start1 < end2 && end1 > start2
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const validated = updateSchema.parse(body)

    // Verificar que la regla pertenece al profesional
    const rule = await prisma.availabilityRule.findUnique({
      where: { id: params.id },
    })

    if (!rule || rule.professionalId !== user.professionalId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Calcular los valores finales (actualizados o existentes)
    const finalStartTime = validated.startTime ?? rule.startTime
    const finalEndTime = validated.endTime ?? rule.endTime
    const newStart = timeToMinutes(finalStartTime)
    const newEnd = timeToMinutes(finalEndTime)

    // Validar que el horario de inicio sea menor al de fin
    if (newStart >= newEnd) {
      return NextResponse.json(
        { error: 'El horario de inicio debe ser anterior al horario de fin' },
        { status: 400 }
      )
    }

    // Obtener otras reglas del mismo día (excluyendo la actual)
    const existingRules = await prisma.availabilityRule.findMany({
      where: {
        professionalId: user.professionalId,
        dayOfWeek: rule.dayOfWeek,
        id: { not: params.id },
      },
    })

    // Verificar solapamiento con otras reglas
    for (const existing of existingRules) {
      const existingStart = timeToMinutes(existing.startTime)
      const existingEnd = timeToMinutes(existing.endTime)

      if (rangesOverlap(newStart, newEnd, existingStart, existingEnd)) {
        return NextResponse.json(
          { 
            error: `El rango ${finalStartTime}-${finalEndTime} se solapa con el rango existente ${existing.startTime}-${existing.endTime}` 
          },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.availabilityRule.update({
      where: { id: params.id },
      data: validated,
    })

    return NextResponse.json({ rule: updated })
  } catch (error: any) {
    console.error('[DEBUG PATCH /api/panel/availability] ERROR:', error)
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

    const rule = await prisma.availabilityRule.findUnique({
      where: { id: params.id },
    })

    if (!rule || rule.professionalId !== user.professionalId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await prisma.availabilityRule.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al eliminar' }, { status: 500 })
  }
}

