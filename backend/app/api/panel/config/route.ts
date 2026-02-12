import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/get-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Professional-Id',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS })
}

const updateConfigSchema = z.object({
  consultationFeePesos: z
    .number()
    .int()
    .min(0, 'El monto debe ser mayor o igual a 0')
    .nullable(),
})

/**
 * GET /api/panel/config
 * Obtener configuración (para edición en panel)
 */
export async function GET() {
  try {
    await requireAuth()
    const config = await prisma.siteConfig.findUnique({
      where: { id: 'default' },
    })
    return NextResponse.json(
      {
        consultationFeePesos: config?.consultationFeePesos ?? null,
      },
      { headers: CORS_HEADERS }
    )
  } catch (error: any) {
    if (error?.message === 'No autorizado') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401, headers: CORS_HEADERS }
      )
    }
    console.error('Error fetching panel config:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

/**
 * PUT /api/panel/config
 * Actualizar honorarios (cualquier profesional autenticado puede modificar)
 */
export async function PUT(req: Request) {
  try {
    await requireAuth()
    const body = await req.json()
    const validated = updateConfigSchema.parse(body)

    const config = await prisma.siteConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        consultationFeePesos: validated.consultationFeePesos,
      },
      update: {
        consultationFeePesos: validated.consultationFeePesos,
      },
    })

    return NextResponse.json(
      { consultationFeePesos: config.consultationFeePesos },
      { headers: CORS_HEADERS }
    )
  } catch (error: any) {
    if (error?.message === 'No autorizado') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401, headers: CORS_HEADERS }
      )
    }
    if (error instanceof z.ZodError) {
      const first = error.errors[0]
      return NextResponse.json(
        { error: first?.message ?? 'Datos inválidos' },
        { status: 400, headers: CORS_HEADERS }
      )
    }
    console.error('Error updating panel config:', error)
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
