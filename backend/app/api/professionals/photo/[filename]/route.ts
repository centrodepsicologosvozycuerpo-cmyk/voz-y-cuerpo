import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'professionals')

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const filePath = join(UPLOAD_DIR, params.filename)
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Foto no encontrada' },
        { status: 404 }
      )
    }

    const fileBuffer = await readFile(filePath)
    
    // Detectar tipo MIME basado en extensión
    const extension = params.filename.substring(params.filename.lastIndexOf('.'))
    let contentType = 'image/jpeg'
    if (extension === '.png') contentType = 'image/png'
    if (extension === '.gif') contentType = 'image/gif'
    if (extension === '.webp') contentType = 'image/webp'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error: any) {
    console.error('Error serving photo:', error)
    return NextResponse.json(
      { error: 'Error al servir foto' },
      { status: 500 }
    )
  }
}


