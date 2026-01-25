import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/get-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createRequestSchema = z.object({
  type: z.enum(['ADD_PROFESSIONAL', 'REMOVE_PROFESSIONAL']),
  payloadJson: z.string().optional(),
  targetProfessionalId: z.string().optional(),
})

export async function GET() {
  try {
    const user = await requireAuth()

    const requests = await prisma.changeRequest.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
          },
        },
        targetProfessional: {
          select: {
            id: true,
            fullName: true,
            title: true,
          },
        },
        votes: {
          include: {
            voter: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ requests })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'No autorizado' }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    const validated = createRequestSchema.parse(body)

    const changeRequest = await prisma.changeRequest.create({
      data: {
        type: validated.type,
        status: 'PENDING',
        createdByUserId: user.id,
        payloadJson: validated.payloadJson || null,
        targetProfessionalId: validated.targetProfessionalId || null,
      },
    })

    return NextResponse.json({ request: changeRequest })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Error al crear solicitud' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(req.url)
    const requestId = searchParams.get('id')

    if (!requestId) {
      return NextResponse.json({ error: 'ID de solicitud requerido' }, { status: 400 })
    }

    // Verificar que la solicitud existe y pertenece al usuario
    const changeRequest = await prisma.changeRequest.findUnique({
      where: { id: requestId },
    })

    if (!changeRequest) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    // Solo el creador puede eliminar su solicitud
    if (changeRequest.createdByUserId !== user.id) {
      return NextResponse.json({ error: 'No autorizado: solo puedes eliminar tus propias solicitudes' }, { status: 403 })
    }

    // Solo se pueden eliminar solicitudes pendientes
    if (changeRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Solo se pueden eliminar solicitudes pendientes' }, { status: 400 })
    }

    // Eliminar la solicitud (esto también eliminará los votes por cascade)
    await prisma.changeRequest.delete({
      where: { id: requestId },
    })

    return NextResponse.json({ message: 'Solicitud eliminada correctamente' })
  } catch (error: any) {
    console.error('Delete change request error:', error)
    return NextResponse.json({ error: error.message || 'Error al eliminar solicitud' }, { status: 500 })
  }
}


