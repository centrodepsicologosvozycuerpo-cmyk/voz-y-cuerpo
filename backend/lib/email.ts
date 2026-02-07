/**
 * Servicio de envío de emails (Nodemailer + SMTPS).
 *
 * Variables de entorno (en .env o en Render → Environment Variables):
 * - EMAIL_HOST     (default: smtp.gmail.com)
 * - EMAIL_PORT     (default: 465 — usar 465 y SMTPS en Render)
 * - EMAIL_SECURE   (default: true cuando port es 465)
 * - EMAIL_USER     (ej. tu@gmail.com)
 * - EMAIL_PASSWORD (contraseña de aplicación de Gmail: myaccount.google.com/apppasswords)
 * - EMAIL_FROM     (opcional; si no está, se usa EMAIL_USER)
 *
 * En Render: configurar esas variables en el dashboard del servicio. Puerto 465 + secure: true (SMTPS).
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

// Mapeo de variables de este proyecto → opciones de nodemailer
const port = parseInt(process.env.EMAIL_PORT || '465', 10)
const secure = process.env.EMAIL_SECURE !== 'false' && port === 465

const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port,
  secure, // true para 465 (SMTPS) — necesario en Render
  user: process.env.EMAIL_USER || '',
  password: process.env.EMAIL_PASSWORD || '',
  from: process.env.EMAIL_FROM || '',
}

const EMAIL_ENABLED = !!(EMAIL_CONFIG.user && EMAIL_CONFIG.password)

// Transporter creado una vez a nivel de módulo
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
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  })
  console.log('✅ Email service enabled (SMTPS)', { host: EMAIL_CONFIG.host, port: EMAIL_CONFIG.port, secure: EMAIL_CONFIG.secure })
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
