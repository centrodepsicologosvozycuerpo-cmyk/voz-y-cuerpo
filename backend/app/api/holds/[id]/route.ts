import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/security'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    const hold = await prisma.slotHold.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
      },
    })

    if (!hold) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    // Verificar acceso
    if (hold.professionalId !== user.professionalId && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    await prisma.slotHold.delete({
      where: { id: hold.id },
    })

    await logAudit(user.id, 'DELETE_SLOT_HOLD', 'SLOT_HOLD', hold.id, {
      patientId: hold.patientId,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting hold:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar reserva' },
      { status: error.message?.includes('No autorizado') ? 401 : 500 }
    )
  }
}


