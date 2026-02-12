import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/security'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Professional-Id',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS })
}

const schema = z.object({ name: z.string().min(1, 'El nombre es requerido') })

/**
 * POST /api/panel/news/tags - Crear etiqueta
 */
export async function POST(request: Request) {
  try {
    await requireAuth(request)
    const body = await request.json()
    const { name } = schema.parse(body)
    const nameTrim = name.trim()
    const existing = await prisma.newsTag.findUnique({ where: { name: nameTrim } })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una etiqueta con ese nombre' },
        { status: 400, headers: CORS }
      )
    }
    const tag = await prisma.newsTag.create({ data: { name: nameTrim } })
    return NextResponse.json({ tag }, { headers: CORS })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const msg = error.errors[0]?.message || 'Datos inválidos'
      return NextResponse.json({ error: msg }, { status: 400, headers: CORS })
    }
    return NextResponse.json(
      { error: error.message || 'Error al crear etiqueta' },
      { status: error.message?.includes('No autorizado') ? 401 : 500, headers: CORS }
    )
  }
}
