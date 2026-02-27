import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/security'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { generateToken } from '@/lib/utils'
import { sendEmail } from '@/lib/email'
import { patientConfirmationEmail } from '@/lib/email-templates'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)

    const hold = await prisma.slotHold.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        professional: { include: { user: { select: { email: true } } } },
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
        clientEmail: hold.patient.email || '',
        clientPhone: hold.patient.phone || hold.patient.emergencyPhone,
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

    // Enviar email al paciente si tiene email registrado
    if (hold.patient.email) {
      const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const cancelUrl = `${APP_URL}/turnos/cancelar/?token=${cancelToken}`

      const professionalEmail = hold.professional.contactEmail || hold.professional.user?.email || undefined
      const emailData = patientConfirmationEmail({
        patientName: hold.patient.firstName,
        professionalName: hold.professional.fullName,
        professionalPhone: hold.professional.whatsappPhone || undefined,
        professionalEmail,
        appointmentDate: hold.startAt,
        modality: 'presencial',
        cancelUrl,
      })

      await sendEmail({
        to: hold.patient.email,
        subject: emailData.subject,
        html: emailData.html,
      })
    }

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error: any) {
    console.error('Error converting hold to appointment:', error)
    return NextResponse.json(
      { error: error.message || 'Error al convertir reserva en turno' },
      { status: error.message?.includes('No autorizado') ? 401 : 500 }
    )
  }
}


