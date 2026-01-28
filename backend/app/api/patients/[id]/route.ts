import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePatientAccess } from '@/lib/security'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { differenceInYears } from 'date-fns'

const updatePatientSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  birthDate: z.string().datetime().optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  province: z.string().min(1).optional(),
  emergencyName: z.string().min(1).optional(),
  emergencyRole: z.string().min(1).optional(),
  emergencyPhone: z.string().min(1).optional(),
  hasInsurance: z.boolean().optional(),
  insuranceName: z.string().optional().nullable(),
  insuranceCardNumber: z.string().optional().nullable(),
  lastVisitAt: z.string().datetime().optional().nullable(),
})

export const dynamic = 'force-dynamic'

// Handler para preflight CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Professional-Id',
    },
  })
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user, patient } = await requirePatientAccess(params.id, request)

    const age = differenceInYears(new Date(), new Date(patient.birthDate))

    // Obtener notas
    const notes = await prisma.patientNote.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
    })

    // Obtener slot holds activos
    const slotHolds = await prisma.slotHold.findMany({
      where: {
        patientId: patient.id,
        status: 'HOLD',
      },
      orderBy: { startAt: 'asc' },
    })

    return NextResponse.json({
      patient: {
        ...patient,
        age,
        notes,
        slotHolds,
      },
    })
  } catch (error: any) {
    console.error('Error fetching patient:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener paciente' },
      { status: error.message?.includes('No autorizado') || error.message?.includes('no encontrado') ? 404 : 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user, patient } = await requirePatientAccess(params.id, request)
    const body = await request.json()
    
    const validated = updatePatientSchema.parse(body)

    const updateData: any = {}
    if (validated.firstName !== undefined) updateData.firstName = validated.firstName
    if (validated.lastName !== undefined) updateData.lastName = validated.lastName
    if (validated.email !== undefined) updateData.email = validated.email || null
    if (validated.phone !== undefined) updateData.phone = validated.phone || null
    if (validated.birthDate !== undefined) updateData.birthDate = new Date(validated.birthDate)
    if (validated.address !== undefined) updateData.address = validated.address
    if (validated.city !== undefined) updateData.city = validated.city
    if (validated.province !== undefined) updateData.province = validated.province
    if (validated.emergencyName !== undefined) updateData.emergencyName = validated.emergencyName
    if (validated.emergencyRole !== undefined) updateData.emergencyRole = validated.emergencyRole
    if (validated.emergencyPhone !== undefined) updateData.emergencyPhone = validated.emergencyPhone
    if (validated.hasInsurance !== undefined) updateData.hasInsurance = validated.hasInsurance
    if (validated.insuranceName !== undefined) updateData.insuranceName = validated.insuranceName
    if (validated.insuranceCardNumber !== undefined) updateData.insuranceCardNumber = validated.insuranceCardNumber
    if (validated.lastVisitAt !== undefined) {
      updateData.lastVisitAt = validated.lastVisitAt ? new Date(validated.lastVisitAt) : null
    }

    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data: updateData,
    })

    await logAudit(user.id, 'UPDATE_PATIENT', 'PATIENT', patient.id, {
      patientName: `${updated.firstName} ${updated.lastName}`,
    })

    return NextResponse.json({ patient: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating patient:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar paciente' },
      { status: error.message?.includes('No autorizado') || error.message?.includes('no encontrado') ? 404 : 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user, patient } = await requirePatientAccess(params.id, request)

    await logAudit(user.id, 'DELETE_PATIENT', 'PATIENT', patient.id, {
      patientName: `${patient.firstName} ${patient.lastName}`,
    })

    await prisma.patient.delete({
      where: { id: patient.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting patient:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar paciente' },
      { status: error.message?.includes('No autorizado') || error.message?.includes('no encontrado') ? 404 : 500 }
    )
  }
}


