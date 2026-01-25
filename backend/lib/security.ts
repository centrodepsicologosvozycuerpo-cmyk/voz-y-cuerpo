import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { NextResponse } from 'next/server'

/**
 * Verifica que el usuario esté autenticado y obtiene su información
 * Soporta autenticación por sesión NextAuth o por header X-Professional-Id
 */
export async function requireAuth(request?: Request) {
  // Primero intentar con sesión NextAuth
  const session = await getServerSession(authOptions)
  
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: {
        professional: true,
      },
    })

    if (user && user.professional) {
      return user
    }
  }

  // Si no hay sesión, intentar con header X-Professional-Id (para backoffice)
  if (request) {
    const professionalId = request.headers.get('X-Professional-Id')
    if (professionalId) {
      const user = await prisma.user.findFirst({
        where: { professionalId },
        include: {
          professional: true,
        },
      })

      if (user && user.professional) {
        return user
      }
    }
  }

  throw new Error('No autorizado: sesión requerida')
}

/**
 * Verifica que el usuario tenga acceso a un paciente específico (anti-IDOR)
 * - Si es PROFESSIONAL: solo puede acceder a sus propios pacientes
 * - Si es ADMIN: puede acceder a todos
 */
export async function requirePatientAccess(patientId: string, request?: Request) {
  const user = await requireAuth(request)
  
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      professional: true,
    },
  })

  if (!patient) {
    throw new Error('Paciente no encontrado')
  }

  // ADMIN puede acceder a todo
  if (user.role === 'ADMIN') {
    return { user, patient }
  }

  // PROFESSIONAL solo puede acceder a sus propios pacientes
  if (patient.professionalId !== user.professionalId) {
    throw new Error('No autorizado: acceso denegado a este paciente')
  }

  return { user, patient }
}

/**
 * Valida que un archivo sea seguro para subir
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_MIMES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ]
  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.md']

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'El archivo excede el tamaño máximo de 10MB' }
  }

  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: 'Tipo de archivo no permitido' }
  }

  if (!ALLOWED_MIMES.includes(file.type)) {
    return { valid: false, error: 'Tipo MIME no permitido' }
  }

  return { valid: true }
}

/**
 * Sanitiza texto para prevenir XSS
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Genera un nombre único para almacenar archivos
 */
export function generateStorageName(originalName: string): string {
  const extension = originalName.substring(originalName.lastIndexOf('.'))
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `${timestamp}-${random}${extension}`
}


