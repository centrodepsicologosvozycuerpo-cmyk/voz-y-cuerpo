import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/get-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
})

export async function POST(req: Request) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    const validated = changePasswordSchema.parse(body)

    // Verificar que la contraseña actual sea correcta
    const isValid = await bcrypt.compare(validated.currentPassword, user.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'La contraseña actual es incorrecta' },
        { status: 401 }
      )
    }

    // Hashear la nueva contraseña
    const newPasswordHash = await bcrypt.hash(validated.newPassword, 10)

    // Actualizar la contraseña
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    })

    return NextResponse.json({ message: 'Contraseña actualizada correctamente' })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al cambiar la contraseña' },
      { status: 500 }
    )
  }
}

