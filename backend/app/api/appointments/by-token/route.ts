import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cancelToken = searchParams.get('cancelToken')

    if (!cancelToken) {
      return NextResponse.json(
        { error: 'Token requerido' },
        { status: 400 }
      )
    }

    const appointment = await prisma.appointment.findUnique({
      where: { cancelToken },
      include: {
        professional: {
          select: {
            id: true,
            slug: true,
            fullName: true,
            title: true,
            photo: true,
          },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Turno no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error fetching appointment by token:', error)
    return NextResponse.json(
      { error: 'Error al obtener el turno' },
      { status: 500 }
    )
  }
}

