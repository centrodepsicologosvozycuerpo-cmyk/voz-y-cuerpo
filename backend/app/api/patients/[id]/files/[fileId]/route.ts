import { NextResponse } from 'next/server'
import { requirePatientAccess } from '@/lib/security'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { getFile, deleteFile } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const { user, patient } = await requirePatientAccess(params.id, request)

    const file = await prisma.patientFile.findUnique({
      where: { id: params.fileId },
    })

    if (!file || file.patientId !== patient.id) {
      return NextResponse.json(
        { error: 'Archivo no encontrado' },
        { status: 404 }
      )
    }

    // Si hay una URL directa (B2), podemos redirigir
    if (file.storageUrl && file.storageProvider === 'b2') {
      return NextResponse.redirect(file.storageUrl)
    }

    // Para archivos locales, obtener el contenido
    const fileBuffer = await getFile(file.storageName)
    
    if (!fileBuffer) {
      return NextResponse.json(
        { error: 'Archivo físico no encontrado' },
        { status: 404 }
      )
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.originalName}"`,
        'Content-Length': file.size.toString(),
      },
    })
  } catch (error: any) {
    console.error('Error downloading file:', error)
    return NextResponse.json(
      { error: error.message || 'Error al descargar archivo' },
      { status: error.message?.includes('No autorizado') || error.message?.includes('no encontrado') ? 404 : 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const { user, patient } = await requirePatientAccess(params.id, request)

    const file = await prisma.patientFile.findUnique({
      where: { id: params.fileId },
    })

    if (!file || file.patientId !== patient.id) {
      return NextResponse.json(
        { error: 'Archivo no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar del storage (B2 o local)
    await deleteFile(file.storageName)

    // Eliminar registro de DB
    await prisma.patientFile.delete({
      where: { id: file.id },
    })

    await logAudit(user.id, 'DELETE_FILE', 'PATIENT_FILE', file.id, {
      patientId: patient.id,
      fileName: file.originalName,
      provider: file.storageProvider,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar archivo' },
      { status: error.message?.includes('No autorizado') || error.message?.includes('no encontrado') ? 404 : 500 }
    )
  }
}
