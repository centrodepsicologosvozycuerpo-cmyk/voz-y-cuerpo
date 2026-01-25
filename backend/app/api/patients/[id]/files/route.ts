import { NextResponse } from 'next/server'
import { requirePatientAccess, validateFile } from '@/lib/security'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { uploadFile } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user, patient } = await requirePatientAccess(params.id, request)
    
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Archivo requerido' },
        { status: 400 }
      )
    }

    // Validar archivo
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Subir archivo a storage (B2 o local)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const result = await uploadFile(buffer, file.name, {
      folder: `patients/${patient.id}`,
      contentType: file.type,
    })

    // Guardar metadata en DB
    const patientFile = await prisma.patientFile.create({
      data: {
        patientId: patient.id,
        originalName: file.name,
        storageName: result.key, // Ahora guardamos la key completa
        storageUrl: result.url,
        storageProvider: result.provider,
        mimeType: file.type,
        size: file.size,
      },
    })

    await logAudit(user.id, 'UPLOAD_FILE', 'PATIENT_FILE', patientFile.id, {
      patientId: patient.id,
      fileName: file.name,
      size: file.size,
      provider: result.provider,
    })

    return NextResponse.json({ file: patientFile }, { status: 201 })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: error.message || 'Error al subir archivo' },
      { status: error.message?.includes('No autorizado') || error.message?.includes('no encontrado') ? 404 : 500 }
    )
  }
}
