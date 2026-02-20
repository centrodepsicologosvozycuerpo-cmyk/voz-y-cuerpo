/**
 * Templates de email - Diseño minimalista y moderno
 */

import { format } from 'date-fns'
import es from 'date-fns/locale/es'

const CLINIC_NAME = 'Voz y Cuerpo'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Estilos base
const styles = {
  body: 'margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;',
  container: 'max-width: 560px; margin: 0 auto; padding: 40px 20px;',
  card: 'background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);',
  logo: 'font-size: 18px; font-weight: 600; color: #111; margin-bottom: 32px; text-align: center;',
  title: 'font-size: 24px; font-weight: 600; color: #111; margin: 0 0 8px 0; text-align: center;',
  subtitle: 'font-size: 15px; color: #666; margin: 0 0 32px 0; text-align: center;',
  divider: 'border: none; border-top: 1px solid #eee; margin: 24px 0;',
  label: 'font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;',
  value: 'font-size: 16px; color: #111; margin: 0 0 16px 0; font-weight: 500;',
  button: 'display: inline-block; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;',
  buttonPrimary: 'background: #111; color: #fff;',
  buttonSecondary: 'background: #f5f5f5; color: #111; border: 1px solid #ddd;',
  buttonDanger: 'background: #dc2626; color: #fff;',
  buttonWhatsapp: 'background: #25D366; color: #fff;',
  footer: 'text-align: center; margin-top: 32px; font-size: 13px; color: #888;',
  alert: 'background: #fef3c7; border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 24px 0;',
  alertText: 'margin: 0; font-size: 14px; color: #92400e;',
}

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${CLINIC_NAME}</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.card}">
      <div style="${styles.logo}">${CLINIC_NAME}</div>
      ${content}
    </div>
    <div style="${styles.footer}">
      <a href="${APP_URL}" style="color: #666; text-decoration: none;">${APP_URL.replace('https://', '').replace('http://', '')}</a>
    </div>
  </div>
</body>
</html>`
}

function formatDate(date: Date): string {
  return format(date, "EEEE d 'de' MMMM", { locale: es })
}

function formatTime(date: Date): string {
  return format(date, 'HH:mm', { locale: es })
}

// ============================================
// TEMPLATES PARA PACIENTES
// ============================================

/**
 * Email: Turno PRE-CONFIRMADO (esperando confirmación del profesional)
 */
export function patientPreConfirmationEmail(data: {
  patientName: string
  professionalName: string
  professionalPhone?: string
  appointmentDate: Date
  modality: string
  locationLabel?: string
  cancelUrl: string
}): { subject: string; html: string } {
  
  const whatsappUrl = data.professionalPhone 
    ? `https://wa.me/${data.professionalPhone.replace(/[^0-9]/g, '')}`
    : null

  const content = `
    <h1 style="${styles.title}">Turno Solicitado</h1>
    <p style="${styles.subtitle}">
      Hola ${data.patientName}, tu turno está pendiente de confirmación.
    </p>
    
    <hr style="${styles.divider}">
    
    <p style="${styles.label}">Profesional</p>
    <p style="${styles.value}">${data.professionalName}</p>
    
    <p style="${styles.label}">Fecha</p>
    <p style="${styles.value}">${formatDate(data.appointmentDate)}</p>
    
    <p style="${styles.label}">Hora</p>
    <p style="${styles.value}">${formatTime(data.appointmentDate)} hs</p>
    
    <p style="${styles.label}">Modalidad</p>
    <p style="${styles.value}">${data.modality === 'online' ? '💻 Online' : '🏢 Presencial'}${data.locationLabel ? ` — ${data.locationLabel}` : ''}</p>
    
    <hr style="${styles.divider}">
    
    <div style="${styles.alert}">
      <p style="${styles.alertText}">
        <strong>⏳ Pendiente de confirmación</strong><br>
        El profesional revisará tu solicitud y confirmará el turno. Te notificaremos por email cuando esté confirmado.
      </p>
    </div>
    
    <p style="text-align: center; margin: 24px 0; font-size: 14px; color: #666;">
      ¿Querés coordinar algo antes? Contactá al profesional:
    </p>
    
    <div style="text-align: center; margin-bottom: 24px;">
      ${whatsappUrl ? `<a href="${whatsappUrl}" style="${styles.button} ${styles.buttonWhatsapp}">💬 Abrir WhatsApp</a>` : ''}
    </div>
    
    <hr style="${styles.divider}">
    
    <p style="text-align: center; font-size: 13px; color: #888; margin-bottom: 16px;">
      Podés cancelar hasta 24 horas hábiles antes
    </p>
    
    <div style="text-align: center;">
      <a href="${data.cancelUrl}" style="${styles.button} ${styles.buttonSecondary}">Cancelar turno</a>
    </div>
  `

  return {
    subject: `⏳ Turno solicitado con ${data.professionalName} — Pendiente de confirmación`,
    html: baseTemplate(content),
  }
}

/**
 * Email: Turno CONFIRMADO por el profesional
 */
export function patientConfirmationEmail(data: {
  patientName: string
  professionalName: string
  professionalPhone?: string
  appointmentDate: Date
  modality: string
  locationLabel?: string
  cancelUrl: string
}): { subject: string; html: string } {

  const whatsappUrl = data.professionalPhone 
    ? `https://wa.me/${data.professionalPhone.replace(/[^0-9]/g, '')}`
    : null

  const content = `
    <h1 style="${styles.title}">✓ Turno Confirmado</h1>
    <p style="${styles.subtitle}">
      Hola ${data.patientName}, tu turno ha sido confirmado.
    </p>
    
    <hr style="${styles.divider}">
    
    <p style="${styles.label}">Profesional</p>
    <p style="${styles.value}">${data.professionalName}</p>
    
    <p style="${styles.label}">Fecha</p>
    <p style="${styles.value}">${formatDate(data.appointmentDate)}</p>
    
    <p style="${styles.label}">Hora</p>
    <p style="${styles.value}">${formatTime(data.appointmentDate)} hs</p>
    
    <p style="${styles.label}">Modalidad</p>
    <p style="${styles.value}">${data.modality === 'online' ? '💻 Online' : '🏢 Presencial'}${data.locationLabel ? ` — ${data.locationLabel}` : ''}</p>
    
    <hr style="${styles.divider}">
    
    <div style="background: #dcfce7; border-left: 3px solid #22c55e; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
      <p style="margin: 0; font-size: 14px; color: #166534;">
        <strong>✓ Confirmado</strong> — Te esperamos en la fecha y hora indicadas.
      </p>
    </div>
    
    ${whatsappUrl ? `
      <p style="text-align: center; margin: 24px 0; font-size: 14px; color: #666;">
        ¿Tenés alguna consulta?
      </p>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${whatsappUrl}" style="${styles.button} ${styles.buttonWhatsapp}">💬 Contactar por WhatsApp</a>
      </div>
    ` : ''}
    
    <hr style="${styles.divider}">
    
    <p style="text-align: center; font-size: 13px; color: #888; margin-bottom: 16px;">
      Podés cancelar hasta 24 horas hábiles antes
    </p>
    
    <div style="text-align: center;">
      <a href="${data.cancelUrl}" style="${styles.button} ${styles.buttonSecondary}">Cancelar turno</a>
    </div>
  `

  return {
    subject: `✓ Turno confirmado con ${data.professionalName} — ${formatDate(data.appointmentDate)}`,
    html: baseTemplate(content),
  }
}

/**
 * Email: Turno CANCELADO (con motivo)
 */
export function patientCancellationEmail(data: {
  patientName: string
  professionalName: string
  professionalPhone?: string
  appointmentDate: Date
  cancellationReason?: string
  cancelledBy: 'patient' | 'professional' | 'system'
  rescheduleUrl: string
}): { subject: string; html: string } {

  const whatsappUrl = data.professionalPhone 
    ? `https://wa.me/${data.professionalPhone.replace(/[^0-9]/g, '')}`
    : null

  const cancelledByText = {
    patient: 'a tu solicitud',
    professional: 'por el profesional',
    system: 'por el sistema',
  }

  const content = `
    <h1 style="${styles.title}">Turno Cancelado</h1>
    <p style="${styles.subtitle}">
      Hola ${data.patientName}, tu turno ha sido cancelado ${cancelledByText[data.cancelledBy]}.
    </p>
    
    <hr style="${styles.divider}">
    
    <p style="${styles.label}">Profesional</p>
    <p style="${styles.value}">${data.professionalName}</p>
    
    <p style="${styles.label}">Fecha del turno cancelado</p>
    <p style="${styles.value}">${formatDate(data.appointmentDate)} a las ${formatTime(data.appointmentDate)} hs</p>
    
    ${data.cancellationReason ? `
      <hr style="${styles.divider}">
      <p style="${styles.label}">Motivo de cancelación</p>
      <p style="${styles.value}">${data.cancellationReason}</p>
    ` : ''}
    
    <hr style="${styles.divider}">
    
    <p style="text-align: center; margin: 24px 0; font-size: 14px; color: #666;">
      ¿Querés agendar un nuevo turno?
    </p>
    
    <div style="text-align: center; margin-bottom: 16px;">
      <a href="${data.rescheduleUrl}" style="${styles.button} ${styles.buttonPrimary}">Reservar nuevo turno</a>
    </div>
    
    ${whatsappUrl && data.cancelledBy === 'professional' ? `
      <div style="text-align: center;">
        <a href="${whatsappUrl}" style="${styles.button} ${styles.buttonSecondary}">Contactar al profesional</a>
      </div>
    ` : ''}
  `

  return {
    subject: `Turno cancelado — ${formatDate(data.appointmentDate)}`,
    html: baseTemplate(content),
  }
}

// ============================================
// TEMPLATES PARA PROFESIONALES
// ============================================

/**
 * Email: Nueva solicitud de turno (para el profesional)
 */
export function professionalNewBookingEmail(data: {
  professionalName: string
  patientName: string
  patientEmail: string
  patientPhone: string
  appointmentDate: Date
  modality: string
  locationLabel?: string
  panelUrl: string
}): { subject: string; html: string } {

  const whatsappUrl = `https://wa.me/${data.patientPhone.replace(/[^0-9]/g, '')}`

  const content = `
    <h1 style="${styles.title}">Nueva Solicitud de Turno</h1>
    <p style="${styles.subtitle}">
      ${data.patientName} solicitó un turno. Revisá los detalles y confirmá.
    </p>
    
    <hr style="${styles.divider}">
    
    <p style="${styles.label}">Paciente</p>
    <p style="${styles.value}">${data.patientName}</p>
    
    <p style="${styles.label}">Email</p>
    <p style="${styles.value}"><a href="mailto:${data.patientEmail}" style="color: #111;">${data.patientEmail}</a></p>
    
    <p style="${styles.label}">Teléfono</p>
    <p style="${styles.value}"><a href="tel:${data.patientPhone}" style="color: #111;">${data.patientPhone}</a></p>
    
    <hr style="${styles.divider}">
    
    <p style="${styles.label}">Fecha solicitada</p>
    <p style="${styles.value}">${formatDate(data.appointmentDate)}</p>
    
    <p style="${styles.label}">Hora</p>
    <p style="${styles.value}">${formatTime(data.appointmentDate)} hs</p>
    
    <p style="${styles.label}">Modalidad</p>
    <p style="${styles.value}">${data.modality === 'online' ? '💻 Online' : '🏢 Presencial'}${data.locationLabel ? ` — ${data.locationLabel}` : ''}</p>
    
    <hr style="${styles.divider}">
    
    <div style="${styles.alert}">
      <p style="${styles.alertText}">
        <strong>⏳ Acción requerida</strong><br>
        Ingresá al panel para confirmar o rechazar este turno.
      </p>
    </div>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="${data.panelUrl}" style="${styles.button} ${styles.buttonPrimary}">Ir al Panel</a>
    </div>
    
    <p style="text-align: center; font-size: 13px; color: #888;">
      O contactá al paciente directamente:
    </p>
    
    <div style="text-align: center; margin-top: 16px;">
      <a href="${whatsappUrl}" style="${styles.button} ${styles.buttonWhatsapp}; margin-right: 8px;">WhatsApp</a>
      <a href="mailto:${data.patientEmail}" style="${styles.button} ${styles.buttonSecondary}">Email</a>
    </div>
  `

  return {
    subject: `🆕 Nueva solicitud: ${data.patientName} — ${formatDate(data.appointmentDate)} ${formatTime(data.appointmentDate)}hs`,
    html: baseTemplate(content),
  }
}

/**
 * Email: Notificación de cancelación al profesional
 */
export function professionalCancellationEmail(data: {
  professionalName: string
  patientName: string
  patientEmail: string
  patientPhone: string
  appointmentDate: Date
  cancelledBy: 'patient' | 'professional' | 'system'
}): { subject: string; html: string } {

  const cancelledByText = {
    patient: 'El paciente canceló el turno',
    professional: 'Cancelaste el turno',
    system: 'El turno fue cancelado por el sistema',
  }

  const content = `
    <h1 style="${styles.title}">Turno Cancelado</h1>
    <p style="${styles.subtitle}">${cancelledByText[data.cancelledBy]}</p>
    
    <hr style="${styles.divider}">
    
    <p style="${styles.label}">Paciente</p>
    <p style="${styles.value}">${data.patientName}</p>
    
    <p style="${styles.label}">Fecha del turno</p>
    <p style="${styles.value}">${formatDate(data.appointmentDate)} a las ${formatTime(data.appointmentDate)} hs</p>
    
    ${data.cancelledBy === 'patient' ? `
      <hr style="${styles.divider}">
      <p style="text-align: center; font-size: 14px; color: #666;">
        ¿Querés contactar al paciente?
      </p>
      <div style="text-align: center; margin-top: 16px;">
        <a href="https://wa.me/${data.patientPhone.replace(/[^0-9]/g, '')}" style="${styles.button} ${styles.buttonWhatsapp}">WhatsApp</a>
      </div>
    ` : ''}
  `

  return {
    subject: `Turno cancelado: ${data.patientName} — ${formatDate(data.appointmentDate)}`,
    html: baseTemplate(content),
  }
}

/**
 * Email: Resumen diario de turnos para el profesional
 */
export function professionalDailySummaryEmail(data: {
  professionalName: string
  date: Date
  appointments: Array<{
    patientName: string
    time: Date
    modality: string
  }>
  panelUrl: string
}): { subject: string; html: string } {

  const appointmentRows = data.appointments.length > 0 
    ? data.appointments.map(apt => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
            <strong>${formatTime(apt.time)} hs</strong>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
            ${apt.patientName}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">
            ${apt.modality === 'online' ? '💻' : '🏢'}
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="3" style="padding: 24px; text-align: center; color: #888;">No tenés turnos para hoy</td></tr>`

  const content = `
    <h1 style="${styles.title}">Agenda del Día</h1>
    <p style="${styles.subtitle}">
      ${formatDate(data.date)} — ${data.appointments.length} turno${data.appointments.length !== 1 ? 's' : ''}
    </p>
    
    <hr style="${styles.divider}">
    
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="text-align: left;">
          <th style="padding: 8px 0; color: #888; font-size: 12px; font-weight: 500;">HORA</th>
          <th style="padding: 8px 0; color: #888; font-size: 12px; font-weight: 500;">PACIENTE</th>
          <th style="padding: 8px 0; color: #888; font-size: 12px; font-weight: 500;"></th>
        </tr>
      </thead>
      <tbody>
        ${appointmentRows}
      </tbody>
    </table>
    
    <hr style="${styles.divider}">
    
    <div style="text-align: center;">
      <a href="${data.panelUrl}" style="${styles.button} ${styles.buttonPrimary}">Ver Panel Completo</a>
    </div>
  `

  return {
    subject: `📋 Tu agenda: ${formatDate(data.date)} — ${data.appointments.length} turno${data.appointments.length !== 1 ? 's' : ''}`,
    html: baseTemplate(content),
  }
}
