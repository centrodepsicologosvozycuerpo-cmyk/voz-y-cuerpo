import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePatientAccess } from '@/lib/security'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { sanitizeText } from '@/lib/security'

const updateNoteSchema = z.object({
  content: z.string().min(1, 'El contenido de la nota es requerido'),
})

export const dynamic = 'force-dynamic'

export async function PUT(
  request: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const { user, patient } = await requirePatientAccess(params.id, request)
    const body = await request.json()
    
    const validated = updateNoteSchema.parse(body)

    // Verificar que la nota pertenece al paciente
    const note = await prisma.patientNote.findUnique({
      where: { id: params.noteId },
    })

    if (!note || note.patientId !== patient.id) {
      return NextResponse.json(
        { error: 'Nota no encontrada' },
        { status: 404 }
      )
    }

    // Sanitizar contenido
    const sanitizedContent = sanitizeText(validated.content)

    const updated = await prisma.patientNote.update({
      where: { id: note.id },
      data: { content: sanitizedContent },
    })

    await logAudit(user.id, 'UPDATE_NOTE', 'PATIENT_NOTE', note.id, {
      patientId: patient.id,
    })

    return NextResponse.json({ note: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating note:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar nota' },
      { status: error.message?.includes('No autorizado') || error.message?.includes('no encontrado') ? 404 : 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const { user, patient } = await requirePatientAccess(params.id, request)

    const note = await prisma.patientNote.findUnique({
      where: { id: params.noteId },
    })

    if (!note || note.patientId !== patient.id) {
      return NextResponse.json(
        { error: 'Nota no encontrada' },
        { status: 404 }
      )
    }

    await prisma.patientNote.delete({
      where: { id: note.id },
    })

    await logAudit(user.id, 'DELETE_NOTE', 'PATIENT_NOTE', note.id, {
      patientId: patient.id,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting note:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar nota' },
      { status: error.message?.includes('No autorizado') || error.message?.includes('no encontrado') ? 404 : 500 }
    )
  }
}


