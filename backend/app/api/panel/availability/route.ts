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

    // LOG TEMPORAL: Verificar payload y professionalId
    console.log('[DEBUG POST /api/panel/availability]')
    console.log('  Payload recibido:', JSON.stringify(validated, null, 2))
    console.log('  User professionalId:', user.professionalId)
    console.log('  User email:', user.email)

    const rule = await prisma.availabilityRule.create({
      data: {
        professionalId: user.professionalId,
        ...validated,
      },
    })

    console.log('  Regla creada:', {
      id: rule.id,
      professionalId: rule.professionalId,
      dayOfWeek: rule.dayOfWeek,
      startTime: rule.startTime,
      endTime: rule.endTime,
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

