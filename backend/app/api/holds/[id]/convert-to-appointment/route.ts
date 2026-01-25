import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/security'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { generateToken } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    const hold = await prisma.slotHold.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        professional: true,
      },
    })

    if (!hold) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    if (hold.status !== 'HOLD') {
      return NextResponse.json(
        { error: 'La reserva ya fue procesada' },
        { status: 400 }
      )
    }

    // Verificar acceso
    if (hold.professionalId !== user.professionalId && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Crear el turno
    const confirmationToken = generateToken()
    const cancelToken = generateToken()

    const appointment = await prisma.appointment.create({
      data: {
        professionalId: hold.professionalId,
        patientId: hold.patientId,
        startAt: hold.startAt,
        endAt: hold.endAt,
        modality: 'presencial', // Por defecto, se puede ajustar
        clientName: `${hold.patient.firstName} ${hold.patient.lastName}`,
        clientEmail: '', // Se puede agregar email del paciente si se agrega al modelo
        clientPhone: hold.patient.emergencyPhone,
        status: 'CONFIRMED',
        source: 'HOLD_CONVERTED',
        confirmationToken,
        cancelToken,
      },
    })

    // Actualizar el hold a CONFIRMED
    await prisma.slotHold.update({
      where: { id: hold.id },
      data: { status: 'CONFIRMED' },
    })

    // Actualizar lastVisitAt del paciente
    await prisma.patient.update({
      where: { id: hold.patientId },
      data: { lastVisitAt: hold.startAt },
    })

    await logAudit(user.id, 'CONVERT_HOLD_TO_APPOINTMENT', 'SLOT_HOLD', hold.id, {
      patientId: hold.patientId,
      appointmentId: appointment.id,
    })

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error: any) {
    console.error('Error converting hold to appointment:', error)
    return NextResponse.json(
      { error: error.message || 'Error al convertir reserva en turno' },
      { status: error.message?.includes('No autorizado') ? 401 : 500 }
    )
  }
}


