import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

/**
 * POST /api/auth/reset-password
 * 
 * Valida el token y actualiza la contraseña
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token y contraseña requeridos' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validar longitud de contraseña
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Buscar usuario por token
    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verificar que el token no haya expirado
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      // Limpiar token expirado
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      })

      return NextResponse.json(
        { error: 'El enlace ha expirado. Solicitá uno nuevo.' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(password, 12)

    // Actualizar contraseña y limpiar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    })

    console.log(`[Reset Password] Contraseña actualizada para: ${user.email}`)

    return NextResponse.json(
      { success: true, message: 'Contraseña actualizada correctamente' },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error en reset-password:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500, headers: corsHeaders }
    )
  }
}
