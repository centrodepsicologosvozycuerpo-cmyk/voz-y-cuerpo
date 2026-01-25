// Tipos locales para el backoffice (sin dependencia de Prisma)

export interface Professional {
  id: string
  slug: string
  fullName: string
  title: string
  specialties: string
  modalities: string
  languages: string
  approach?: string | null
  description?: string | null
  photo?: string | null
  isActive: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Appointment {
  id: string
  professionalId: string
  startAt: Date | string
  endAt: Date | string
  modality: string
  locationLabel?: string | null
  status: string
  clientName: string
  clientEmail: string
  clientPhone?: string | null
  notes?: string | null
  cancelToken: string
  holdId?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  professional?: Professional
}

export interface User {
  id: string
  email: string
  passwordHash: string
  professionalId: string
  createdAt: Date | string
  updatedAt: Date | string
  professional?: Professional
}

export interface AvailabilityRule {
  id: string
  professionalId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  modality: string
  locationLabel?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface AvailabilityOverride {
  id: string
  professionalId: string
  date: Date | string
  isWorking: boolean
  startTime?: string | null
  endTime?: string | null
  modality?: string | null
  locationLabel?: string | null
  reason?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Patient {
  id: string
  professionalId: string
  fullName: string
  email?: string | null
  phone?: string | null
  birthDate?: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface ChangeRequest {
  id: string
  type: string
  status: string
  createdByUserId: string
  targetProfessionalId?: string | null
  payloadJson?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

