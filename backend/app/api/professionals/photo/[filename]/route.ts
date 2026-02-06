import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { isCloudStorageEnabled, getPublicUrl } from '@/lib/storage'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'professionals')

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename
    if (!filename) {
      return NextResponse.json({ error: 'Filename requerido' }, { status: 400 })
    }

    // Con B2, la foto está en la nube: redirigir a la URL pública
    if (isCloudStorageEnabled()) {
      const key = filename.startsWith('professionals/') ? filename : `professionals/${filename}`
      const publicUrl = getPublicUrl(key)
      return NextResponse.redirect(publicUrl, 302)
    }

    // Local: servir desde disco (filename puede ser "xxx.jpg" o "professionals/xxx.jpg")
    const localFilename = filename.includes('/') ? filename.split('/').pop()! : filename
    const filePath = join(UPLOAD_DIR, localFilename)
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Foto no encontrada' },
        { status: 404 }
      )
    }

    const fileBuffer = await readFile(filePath)
    const extension = filename.substring(filename.lastIndexOf('.'))
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


