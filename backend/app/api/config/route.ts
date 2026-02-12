import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS })
}

/**
 * GET /api/config
 * Configuración pública del sitio (honorarios, etc.) — sin autenticación
 */
export async function GET() {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { id: 'default' },
    })

    return NextResponse.json(
      {
        consultationFeePesos: config?.consultationFeePesos ?? null,
      },
      { headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('Error fetching site config:', error)
    // Si la tabla no existe (migración no aplicada), devolver null en lugar de 500
    return NextResponse.json(
      { consultationFeePesos: null },
      { status: 200, headers: CORS_HEADERS }
    )
  }
}
