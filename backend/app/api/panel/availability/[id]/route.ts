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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const validated = updateSchema.parse(body)

    // LOG TEMPORAL: Verificar payload y professionalId
    console.log('[DEBUG PATCH /api/panel/availability/' + params.id + ']')
    console.log('  Payload recibido:', JSON.stringify(validated, null, 2))
    console.log('  User professionalId:', user.professionalId)
    console.log('  Rule ID:', params.id)

    // Verificar que la regla pertenece al profesional
    const rule = await prisma.availabilityRule.findUnique({
      where: { id: params.id },
    })

    if (!rule || rule.professionalId !== user.professionalId) {
      console.log('  ERROR: Regla no encontrada o no pertenece al profesional')
      console.log('    Rule professionalId:', rule?.professionalId)
      console.log('    User professionalId:', user.professionalId)
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const updated = await prisma.availabilityRule.update({
      where: { id: params.id },
      data: validated,
    })

    console.log('  Regla actualizada:', {
      id: updated.id,
      professionalId: updated.professionalId,
      dayOfWeek: updated.dayOfWeek,
      startTime: updated.startTime,
      endTime: updated.endTime,
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

