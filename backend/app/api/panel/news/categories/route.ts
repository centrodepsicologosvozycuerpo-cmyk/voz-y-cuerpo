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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const schema = z.object({ name: z.string().min(1, 'El nombre es requerido') })

/**
 * POST /api/panel/news/categories - Crear categoría
 */
export async function POST(request: Request) {
  try {
    await requireAuth(request)
    const body = await request.json()
    const { name } = schema.parse(body)
    const slug = slugify(name)
    const existing = await prisma.newsCategory.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese nombre' },
        { status: 400, headers: CORS }
      )
    }
    const maxOrder = await prisma.newsCategory
      .aggregate({ _max: { order: true } })
      .then((r) => r._max.order ?? -1)
    const category = await prisma.newsCategory.create({
      data: { name: name.trim(), slug, order: maxOrder + 1 },
    })
    return NextResponse.json({ category }, { headers: CORS })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const msg = error.errors[0]?.message || 'Datos inválidos'
      return NextResponse.json({ error: msg }, { status: 400, headers: CORS })
    }
    return NextResponse.json(
      { error: error.message || 'Error al crear categoría' },
      { status: error.message?.includes('No autorizado') ? 401 : 500, headers: CORS }
    )
  }
}
