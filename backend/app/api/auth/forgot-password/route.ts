import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

const BACKOFFICE_URL = process.env.NEXT_PUBLIC_BACKOFFICE_URL || 'http://localhost:3001'
const CLINIC_NAME = 'Voz y Cuerpo'

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
 * POST /api/auth/forgot-password
 * 
 * Genera un token de recuperación y envía email
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        professional: {
          select: { fullName: true },
        },
      },
    })

    // IMPORTANTE: Siempre responder success aunque el email no exista
    // Esto evita que alguien pueda enumerar emails válidos
    if (!user) {
      console.log(`[Forgot Password] Email no encontrado: ${email}`)
      return NextResponse.json(
        { success: true, message: 'Si el email existe, recibirás un enlace de recuperación.' },
        { headers: corsHeaders }
      )
    }

    // Generar token único
    const resetToken = randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Guardar token en DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    })

    // Generar URL de reset
    const resetUrl = `${BACKOFFICE_URL}/panel/reset-password?token=${resetToken}`

    // Obtener nombre del usuario (puede no tener professional asociado)
    const userName = user.professional?.fullName || user.email.split('@')[0]

    // Enviar email
    const emailHtml = generatePasswordResetEmail({
      userName,
      resetUrl,
      expiresIn: '1 hora',
    })

    await sendEmail({
      to: user.email,
      subject: `Recuperar contraseña — ${CLINIC_NAME}`,
      html: emailHtml,
    })

    console.log(`[Forgot Password] Token enviado a: ${user.email}`)

    return NextResponse.json(
      { success: true, message: 'Si el email existe, recibirás un enlace de recuperación.' },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error en forgot-password:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Template de email para reset de password
function generatePasswordResetEmail(data: {
  userName: string
  resetUrl: string
  expiresIn: string
}): string {
  const styles = {
    body: 'margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;',
    container: 'max-width: 560px; margin: 0 auto; padding: 40px 20px;',
    card: 'background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);',
    logo: 'font-size: 18px; font-weight: 600; color: #111; margin-bottom: 32px; text-align: center;',
    title: 'font-size: 24px; font-weight: 600; color: #111; margin: 0 0 8px 0; text-align: center;',
    subtitle: 'font-size: 15px; color: #666; margin: 0 0 32px 0; text-align: center;',
    divider: 'border: none; border-top: 1px solid #eee; margin: 24px 0;',
    button: 'display: inline-block; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; background: #111; color: #fff;',
    footer: 'text-align: center; margin-top: 32px; font-size: 13px; color: #888;',
    alert: 'background: #fef3c7; border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 24px 0;',
    alertText: 'margin: 0; font-size: 14px; color: #92400e;',
  }

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperar Contraseña</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.card}">
      <div style="${styles.logo}">${CLINIC_NAME}</div>
      
      <h1 style="${styles.title}">Recuperar Contraseña</h1>
      <p style="${styles.subtitle}">
        Hola ${data.userName}, recibimos una solicitud para restablecer tu contraseña.
      </p>
      
      <hr style="${styles.divider}">
      
      <p style="text-align: center; margin: 24px 0; font-size: 14px; color: #666;">
        Hacé clic en el botón para crear una nueva contraseña:
      </p>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="${data.resetUrl}" style="${styles.button}">Restablecer Contraseña</a>
      </div>
      
      <hr style="${styles.divider}">
      
      <div style="${styles.alert}">
        <p style="${styles.alertText}">
          <strong>⏳ Este enlace expira en ${data.expiresIn}</strong><br>
          Si no solicitaste este cambio, podés ignorar este email.
        </p>
      </div>
      
      <p style="text-align: center; font-size: 12px; color: #999; margin-top: 24px;">
        Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>
        <a href="${data.resetUrl}" style="color: #666; word-break: break-all;">${data.resetUrl}</a>
      </p>
    </div>
    <div style="${styles.footer}">
      Este email fue enviado automáticamente. Por favor no respondas.
    </div>
  </div>
</body>
</html>`
}
