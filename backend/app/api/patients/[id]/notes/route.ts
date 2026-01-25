import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePatientAccess } from '@/lib/security'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { sanitizeText } from '@/lib/security'

const createNoteSchema = z.object({
  content: z.string().min(1, 'El contenido de la nota es requerido'),
})

const updateNoteSchema = z.object({
  content: z.string().min(1, 'El contenido de la nota es requerido'),
})

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user, patient } = await requirePatientAccess(params.id, request)
    const body = await request.json()
    
    const validated = createNoteSchema.parse(body)

    // Sanitizar contenido para prevenir XSS
    const sanitizedContent = sanitizeText(validated.content)

    const note = await prisma.patientNote.create({
      data: {
        patientId: patient.id,
        content: sanitizedContent,
      },
    })

    await logAudit(user.id, 'CREATE_NOTE', 'PATIENT_NOTE', note.id, {
      patientId: patient.id,
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear nota' },
      { status: error.message?.includes('No autorizado') || error.message?.includes('no encontrado') ? 404 : 500 }
    )
  }
}


