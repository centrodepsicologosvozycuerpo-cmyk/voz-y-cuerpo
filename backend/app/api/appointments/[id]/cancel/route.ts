import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Turno no encontrado' },
        { status: 404 }
      )
    }

    await prisma.appointment.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({
      message: 'Turno cancelado exitosamente',
    })
  } catch (error) {
    console.error('Error canceling appointment:', error)
    return NextResponse.json(
      { error: 'Error al cancelar el turno' },
      { status: 500 }
    )
  }
}



