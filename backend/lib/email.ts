/**
 * Servicio de envío de emails con Gmail
 * 
 * Para usar Gmail necesitás:
 * 1. Habilitar "Acceso de apps menos seguras" O
 * 2. Crear una "Contraseña de aplicación" (recomendado)
 *    - Ir a https://myaccount.google.com/apppasswords
 *    - Generar una contraseña para "Correo" en "Otra aplicación"
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

// Configuración desde variables de entorno
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para otros
  user: process.env.EMAIL_USER || '',
  password: process.env.EMAIL_PASSWORD || '', // Contraseña de aplicación de Gmail
  from: process.env.EMAIL_FROM || '',
}

const EMAIL_ENABLED = !!(EMAIL_CONFIG.user && EMAIL_CONFIG.password)

// Crear transporter de nodemailer
let transporter: Transporter | null = null

if (EMAIL_ENABLED) {
  transporter = nodemailer.createTransport({
    host: EMAIL_CONFIG.host,
    port: EMAIL_CONFIG.port,
    secure: EMAIL_CONFIG.secure,
    auth: {
      user: EMAIL_CONFIG.user,
      pass: EMAIL_CONFIG.password,
    },
  })
  console.log('✅ Email service enabled (Gmail)')
} else {
  console.log('ℹ️  Email service not configured - using mock')
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Envía un email
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, html, text } = options

  if (!EMAIL_ENABLED || !transporter) {
    console.log('📧 [MOCK] Email:', { to, subject })
    return true
  }

  try {
    await transporter.sendMail({
      from: EMAIL_CONFIG.from || EMAIL_CONFIG.user,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML para texto plano
    })
    console.log('📧 Email enviado a:', to)
    return true
  } catch (error) {
    console.error('❌ Error enviando email:', error)
    return false
  }
}

/**
 * Verifica si el servicio de email está configurado
 */
export function isEmailEnabled(): boolean {
  return EMAIL_ENABLED
}

/**
 * Verifica la conexión con el servidor SMTP
 */
export async function verifyEmailConnection(): Promise<boolean> {
  if (!EMAIL_ENABLED || !transporter) {
    return false
  }

  try {
    await transporter.verify()
    return true
  } catch (error) {
    console.error('❌ Error verificando conexión SMTP:', error)
    return false
  }
}
