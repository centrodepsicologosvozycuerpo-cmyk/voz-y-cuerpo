import { prisma } from './prisma'

export type AuditAction =
  | 'CREATE_PATIENT'
  | 'UPDATE_PATIENT'
  | 'DELETE_PATIENT'
  | 'UPLOAD_FILE'
  | 'DELETE_FILE'
  | 'CREATE_NOTE'
  | 'UPDATE_NOTE'
  | 'DELETE_NOTE'
  | 'CREATE_SLOT_HOLD'
  | 'DELETE_SLOT_HOLD'
  | 'CONVERT_HOLD_TO_APPOINTMENT'

export type AuditEntity = 'PATIENT' | 'PATIENT_FILE' | 'PATIENT_NOTE' | 'SLOT_HOLD'

/**
 * Registra una acción en el log de auditoría
 */
export async function logAudit(
  userId: string,
  action: AuditAction,
  entity: AuditEntity,
  entityId?: string,
  metadata?: Record<string, any>
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })
  } catch (error) {
    // No fallar la operación principal si falla el log
    console.error('Error logging audit:', error)
  }
}


