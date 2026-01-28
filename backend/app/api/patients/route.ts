import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/security'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { differenceInYears } from 'date-fns'

const createPatientSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  birthDate: z.string().datetime(),
  address: z.string().min(1, 'La dirección es requerida'),
  city: z.string().min(1, 'La localidad es requerida'),
  province: z.string().min(1, 'La provincia es requerida'),
  emergencyName: z.string().min(1, 'El nombre del contacto de emergencia es requerido'),
  emergencyRole: z.string().min(1, 'El rol del contacto es requerido'),
  emergencyPhone: z.string().min(1, 'El teléfono del contacto es requerido'),
  hasInsurance: z.boolean().default(false),
  insuranceName: z.string().optional(),
  insuranceCardNumber: z.string().optional(),
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Obtener professionalId del header o query param (pattern usado por otros endpoints del panel)
    const professionalId = request.headers.get('X-Professional-Id') || searchParams.get('professionalId')
    
    if (!professionalId) {
      // Intentar con requireAuth para compatibilidad
      try {
        const user = await requireAuth(request)
        const search = searchParams.get('search') || ''
        const hasInsuranceParam = searchParams.get('hasInsurance')
        const isFrequentParam = searchParams.get('isFrequent')

        const where: any = {
          professionalId: user.role === 'ADMIN' ? undefined : user.professionalId,
        }

        if (search) {
          where.OR = [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
          ]
        }

        if (hasInsuranceParam === 'true') {
          where.hasInsurance = true
        } else if (hasInsuranceParam === 'false') {
          where.hasInsurance = false
        }

        if (isFrequentParam === 'true') {
          where.slotHolds = {
            some: {
              status: 'HOLD',
            },
          }
        }

        const patients = await prisma.patient.findMany({
          where,
          include: {
            slotHolds: {
              where: { status: 'HOLD' },
              take: 1,
            },
            _count: {
              select: {
                appointments: true,
              },
            },
          },
          orderBy: [
            { lastName: 'asc' },
            { firstName: 'asc' },
          ],
        })

        const formatted = patients.map((patient) => {
          const age = differenceInYears(new Date(), new Date(patient.birthDate))
          return {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            fullName: `${patient.firstName} ${patient.lastName}`,
            age,
            city: patient.city,
            province: patient.province,
            hasInsurance: patient.hasInsurance,
            createdAt: patient.createdAt,
            lastVisitAt: patient.lastVisitAt,
            isFrequent: patient.slotHolds.length > 0,
            appointmentsCount: patient._count.appointments,
          }
        })

        return NextResponse.json({ patients: formatted })
      } catch {
        return NextResponse.json(
          { error: 'Professional ID requerido o sesión inválida' },
          { status: 401 }
        )
      }
    }
    
    const search = searchParams.get('search') || ''
    const hasInsurance = searchParams.get('hasInsurance')
    const isFrequent = searchParams.get('isFrequent') // pacientes con turnos reservados

    // Construir filtros con professionalId del header
    const where: any = {
      professionalId,
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (hasInsurance === 'true') {
      where.hasInsurance = true
    } else if (hasInsurance === 'false') {
      where.hasInsurance = false
    }

    if (isFrequent === 'true') {
      where.slotHolds = {
        some: {
          status: 'HOLD',
        },
      }
    }

    const patients = await prisma.patient.findMany({
      where,
      include: {
        slotHolds: {
          where: { status: 'HOLD' },
          take: 1,
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    })

    // Calcular edad y formatear datos
    const formatted = patients.map((patient) => {
      const age = differenceInYears(new Date(), new Date(patient.birthDate))
      return {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        fullName: `${patient.firstName} ${patient.lastName}`,
        age,
        city: patient.city,
        province: patient.province,
        hasInsurance: patient.hasInsurance,
        createdAt: patient.createdAt,
        lastVisitAt: patient.lastVisitAt,
        isFrequent: patient.slotHolds.length > 0,
        appointmentsCount: patient._count.appointments,
      }
    })

    return NextResponse.json({ patients: formatted })
  } catch (error: any) {
    console.error('Error fetching patients:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener pacientes' },
      { status: error.message?.includes('No autorizado') ? 401 : 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    const validated = createPatientSchema.parse(body)

    // Verificar que el profesional existe
    const professional = await prisma.professional.findUnique({
      where: { id: user.professionalId },
    })

    if (!professional) {
      return NextResponse.json(
        { error: 'Profesional no encontrado' },
        { status: 404 }
      )
    }

    const patient = await prisma.patient.create({
      data: {
        professionalId: user.professionalId,
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email || null,
        phone: validated.phone || null,
        birthDate: new Date(validated.birthDate),
        address: validated.address,
        city: validated.city,
        province: validated.province,
        emergencyName: validated.emergencyName,
        emergencyRole: validated.emergencyRole,
        emergencyPhone: validated.emergencyPhone,
        hasInsurance: validated.hasInsurance,
        insuranceName: validated.hasInsurance ? validated.insuranceName : null,
        insuranceCardNumber: validated.hasInsurance ? validated.insuranceCardNumber : null,
      },
    })

    await logAudit(user.id, 'CREATE_PATIENT', 'PATIENT', patient.id, {
      patientName: `${patient.firstName} ${patient.lastName}`,
    })

    return NextResponse.json({ patient }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating patient:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear paciente' },
      { status: error.message?.includes('No autorizado') ? 401 : 500 }
    )
  }
}


