import { prisma } from './prisma'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import { utcToZonedTime } from 'date-fns-tz'
import type { Appointment } from '@prisma/client'
import { sendEmail } from './email'
import {
  patientPreConfirmationEmail,
  patientConfirmationEmail,
  patientCancellationEmail,
  patientReminderEmail,
  professionalNewBookingEmail,
  professionalCancellationEmail,
} from './email-templates'

const TIMEZONE = 'America/Argentina/Buenos_Aires'
const PANEL_URL = process.env.NEXT_PUBLIC_PANEL_URL || 'http://localhost:3001'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Envía email de PRE-CONFIRMACIÓN al paciente (turno pendiente de confirmación)
 */
export async function sendPreConfirmationEmail(appointment: Appointment) {
  const professional = await prisma.professional.findUnique({
    where: { id: appointment.professionalId },
  })

  if (!professional) return

  const localStart = utcToZonedTime(appointment.startAt, TIMEZONE)
  const cancelUrl = `${APP_URL}/turnos/cancelar?token=${appointment.cancelToken}`

  const { subject, html } = patientPreConfirmationEmail({
    patientName: appointment.clientName,
    professionalName: professional.fullName,
    professionalPhone: professional.whatsappPhone || undefined,
    appointmentDate: localStart,
    modality: appointment.modality,
    locationLabel: appointment.locationLabel || undefined,
    cancelUrl,
  })

  const sent = await sendEmail({
    to: appointment.clientEmail,
    subject,
    html,
  })

  await prisma.notificationLog.create({
    data: {
      appointmentId: appointment.id,
      type: 'EMAIL_PRECONFIRM',
      status: sent ? 'SENT' : 'FAILED',
      payloadPreview: JSON.stringify({ to: appointment.clientEmail, subject }),
    },
  })
}

/**
 * Envía email de CONFIRMACIÓN al paciente (confirmado por el profesional)
 */
export async function sendConfirmationEmail(appointment: Appointment) {
  const professional = await prisma.professional.findUnique({
    where: { id: appointment.professionalId },
  })

  if (!professional) return

  const localStart = utcToZonedTime(appointment.startAt, TIMEZONE)
  const cancelUrl = `${APP_URL}/turnos/cancelar?token=${appointment.cancelToken}`

  const { subject, html } = patientConfirmationEmail({
    patientName: appointment.clientName,
    professionalName: professional.fullName,
    professionalPhone: professional.whatsappPhone || undefined,
    appointmentDate: localStart,
    modality: appointment.modality,
    locationLabel: appointment.locationLabel || undefined,
    cancelUrl,
  })

  const sent = await sendEmail({
    to: appointment.clientEmail,
    subject,
    html,
  })

  await prisma.notificationLog.create({
    data: {
      appointmentId: appointment.id,
      type: 'EMAIL_CONFIRM',
      status: sent ? 'SENT' : 'FAILED',
      payloadPreview: JSON.stringify({ to: appointment.clientEmail, subject }),
    },
  })
}

/**
 * Envía email de nueva solicitud al PROFESIONAL
 */
export async function sendNewBookingEmailToProfessional(appointment: Appointment) {
  const professional = await prisma.professional.findUnique({
    where: { id: appointment.professionalId },
    include: {
      user: {
        select: { email: true },
      },
    },
  })

  if (!professional || !professional.user?.email) {
    console.log('Professional sin email configurado')
    return
  }

  const localStart = utcToZonedTime(appointment.startAt, TIMEZONE)

  const { subject, html } = professionalNewBookingEmail({
    professionalName: professional.fullName,
    patientName: appointment.clientName,
    patientEmail: appointment.clientEmail,
    patientPhone: appointment.clientPhone,
    appointmentDate: localStart,
    modality: appointment.modality,
    locationLabel: appointment.locationLabel || undefined,
    panelUrl: `${PANEL_URL}/panel`,
  })

  const sent = await sendEmail({
    to: professional.user.email,
    subject,
    html,
  })

  // También enviar al email de contacto si es diferente
  if (professional.contactEmail && professional.contactEmail !== professional.user.email) {
    await sendEmail({ to: professional.contactEmail, subject, html })
  }

  await prisma.notificationLog.create({
    data: {
      appointmentId: appointment.id,
      type: 'EMAIL_PROFESSIONAL_NEW_BOOKING',
      status: sent ? 'SENT' : 'FAILED',
      payloadPreview: JSON.stringify({ to: professional.user.email, subject }),
    },
  })
}

/**
 * Envía email de CANCELACIÓN al paciente (con motivo opcional)
 */
export async function sendCancellationEmail(
  appointment: Appointment,
  cancellationReason?: string,
  cancelledBy: 'patient' | 'professional' | 'system' = 'patient'
) {
  const professional = await prisma.professional.findUnique({
    where: { id: appointment.professionalId },
  })

  if (!professional) return

  const localStart = utcToZonedTime(appointment.startAt, TIMEZONE)
  const rescheduleUrl = `${APP_URL}/turnos/${professional.slug}`

  const { subject, html } = patientCancellationEmail({
    patientName: appointment.clientName,
    professionalName: professional.fullName,
    professionalPhone: professional.whatsappPhone || undefined,
    appointmentDate: localStart,
    cancellationReason,
    cancelledBy,
    rescheduleUrl,
  })

  const sent = await sendEmail({
    to: appointment.clientEmail,
    subject,
    html,
  })

  await prisma.notificationLog.create({
    data: {
      appointmentId: appointment.id,
      type: 'EMAIL_CANCEL',
      status: sent ? 'SENT' : 'FAILED',
      payloadPreview: JSON.stringify({ to: appointment.clientEmail, subject }),
    },
  })
}

/**
 * Envía email de cancelación al PROFESIONAL
 */
export async function sendCancellationEmailToProfessional(
  appointment: Appointment,
  cancelledBy: 'patient' | 'professional' | 'system' = 'patient'
) {
  const professional = await prisma.professional.findUnique({
    where: { id: appointment.professionalId },
    include: { user: { select: { email: true } } },
  })

  if (!professional || !professional.user?.email) return

  const localStart = utcToZonedTime(appointment.startAt, TIMEZONE)

  const { subject, html } = professionalCancellationEmail({
    professionalName: professional.fullName,
    patientName: appointment.clientName,
    patientEmail: appointment.clientEmail,
    patientPhone: appointment.clientPhone,
    appointmentDate: localStart,
    cancelledBy,
  })

  const sent = await sendEmail({
    to: professional.user.email,
    subject,
    html,
  })

  await prisma.notificationLog.create({
    data: {
      appointmentId: appointment.id,
      type: 'EMAIL_PROFESSIONAL_CANCEL',
      status: sent ? 'SENT' : 'FAILED',
      payloadPreview: JSON.stringify({ to: professional.user.email, subject }),
    },
  })
}

/**
 * Envía email de recordatorio al paciente
 */
export async function sendReminderEmail(appointment: Appointment, hoursBefore: number) {
  const professional = await prisma.professional.findUnique({
    where: { id: appointment.professionalId },
  })

  if (!professional) return

  const localStart = utcToZonedTime(appointment.startAt, TIMEZONE)
  const cancelUrl = `${APP_URL}/turnos/cancelar?token=${appointment.cancelToken}`

  const { subject, html } = patientReminderEmail({
    patientName: appointment.clientName,
    professionalName: professional.fullName,
    professionalPhone: professional.whatsappPhone || undefined,
    appointmentDate: localStart,
    modality: appointment.modality,
    locationLabel: appointment.locationLabel || undefined,
    hoursBefore,
    cancelUrl,
  })

  const sent = await sendEmail({
    to: appointment.clientEmail,
    subject,
    html,
  })

  await prisma.notificationLog.create({
    data: {
      appointmentId: appointment.id,
      type: `EMAIL_REMINDER_${hoursBefore}H`,
      status: sent ? 'SENT' : 'FAILED',
      payloadPreview: JSON.stringify({ to: appointment.clientEmail, subject }),
    },
  })
}

/**
 * Genera URL de WhatsApp para confirmación
 */
export async function sendConfirmationWhatsApp(appointment: Appointment) {
  const professional = await prisma.professional.findUnique({
    where: { id: appointment.professionalId },
  })

  if (!professional) return

  const localStart = utcToZonedTime(appointment.startAt, TIMEZONE)
  const cancelUrl = `${APP_URL}/turnos/cancelar?token=${appointment.cancelToken}`

  const message = `Hola ${appointment.clientName}! Tu turno con ${professional.fullName} está pendiente de confirmación para el ${format(localStart, "d/M/yyyy 'a las' HH:mm", { locale: es })}. Te avisaremos cuando esté confirmado. Para cancelar: ${cancelUrl}`

  const phoneE164 = appointment.clientPhone.replace(/[^0-9+]/g, '')
  const whatsappUrl = `https://wa.me/${phoneE164}?text=${encodeURIComponent(message)}`

  await prisma.notificationLog.create({
    data: {
      appointmentId: appointment.id,
      type: 'WA_PRECONFIRM',
      status: 'SENT',
      payloadPreview: JSON.stringify({ url: whatsappUrl }),
    },
  })

  return whatsappUrl
}

/**
 * Genera URL de WhatsApp para cancelación
 */
export async function sendCancellationWhatsApp(
  appointment: Appointment,
  professionalName: string,
  professionalSlug: string
): Promise<string> {
  const localStart = utcToZonedTime(appointment.startAt, TIMEZONE)
  const turnosUrl = `${APP_URL}/turnos/${professionalSlug}`
  
  const message = `Hola ${appointment.clientName}! Tu turno con ${professionalName} del ${format(localStart, "d/M/yyyy 'a las' HH:mm", { locale: es })} fue cancelado. Para reagendar: ${turnosUrl}`

  const phoneE164 = appointment.clientPhone.replace(/[^0-9+]/g, '')
  const whatsappUrl = `https://wa.me/${phoneE164}?text=${encodeURIComponent(message)}`

  await prisma.notificationLog.create({
    data: {
      appointmentId: appointment.id,
      type: 'WA_CANCEL',
      status: 'SENT',
      payloadPreview: JSON.stringify({ url: whatsappUrl }),
    },
  })

  return whatsappUrl
}

// ============================================
// FUNCIONES DE CONVENIENCIA
// ============================================

/**
 * Envía notificaciones cuando se SOLICITA un turno (pre-confirmación)
 */
export async function sendBookingRequestNotifications(appointment: Appointment) {
  await sendPreConfirmationEmail(appointment)        // Al paciente
  await sendNewBookingEmailToProfessional(appointment) // Al profesional
  console.log('✅ Notificaciones de solicitud enviadas')
}

/**
 * Envía notificaciones cuando el profesional CONFIRMA el turno
 */
export async function sendBookingConfirmationNotifications(appointment: Appointment) {
  await sendConfirmationEmail(appointment)
  console.log('✅ Notificación de confirmación enviada al paciente')
}

/**
 * Envía notificaciones cuando se CANCELA un turno
 */
export async function sendAllCancellationNotifications(
  appointment: Appointment,
  cancellationReason?: string,
  cancelledBy: 'patient' | 'professional' | 'system' = 'patient'
) {
  await sendCancellationEmail(appointment, cancellationReason, cancelledBy)
  
  if (cancelledBy !== 'professional') {
    await sendCancellationEmailToProfessional(appointment, cancelledBy)
  }
  
  console.log('✅ Notificaciones de cancelación enviadas')
}
