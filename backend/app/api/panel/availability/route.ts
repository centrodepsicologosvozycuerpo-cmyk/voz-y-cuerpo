import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/get-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ruleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  slotMinutes: z.number().positive(),
  bufferMinutes: z.number().min(0),
  modality: z.string().optional(),
  locationLabel: z.string().optional(),
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

export async function GET() {
  try {
    const user = await requireAuth()

    const rules = await prisma.availabilityRule.findMany({
      where: { professionalId: user.professionalId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json({ rules })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'No autorizado' }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const validated = ruleSchema.parse(body)

    const newStart = timeToMinutes(validated.startTime)
    const newEnd = timeToMinutes(validated.endTime)

    // Validar que el horario de inicio sea menor al de fin
    if (newStart >= newEnd) {
      return NextResponse.json(
        { error: 'El horario de inicio debe ser anterior al horario de fin' },
        { status: 400 }
      )
    }

    // Obtener reglas existentes del mismo día
    const existingRules = await prisma.availabilityRule.findMany({
      where: {
        professionalId: user.professionalId,
        dayOfWeek: validated.dayOfWeek,
      },
    })

    // Verificar solapamiento con reglas existentes
    for (const existing of existingRules) {
      const existingStart = timeToMinutes(existing.startTime)
      const existingEnd = timeToMinutes(existing.endTime)

      if (rangesOverlap(newStart, newEnd, existingStart, existingEnd)) {
        return NextResponse.json(
          { 
            error: `El rango ${validated.startTime}-${validated.endTime} se solapa con el rango existente ${existing.startTime}-${existing.endTime}` 
          },
          { status: 400 }
        )
      }
    }

    const rule = await prisma.availabilityRule.create({
      data: {
        professionalId: user.professionalId,
        ...validated,
      },
    })

    return NextResponse.json({ rule })
  } catch (error: any) {
    console.error('[DEBUG POST /api/panel/availability] ERROR:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Error al crear regla' }, { status: 500 })
  }
}

