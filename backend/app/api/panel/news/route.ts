import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/security'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug || 'noticia'
  let n = 0
  while (true) {
    const existing = await prisma.newsItem.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    })
    if (!existing) return slug
    n += 1
    slug = `${baseSlug}-${n}`
  }
}

const createSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  summary: z.string().min(1, 'La descripción breve es requerida'),
  content: z.string().min(1, 'El contenido es requerido'),
  categoryId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
})

const updateSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).optional(),
  summary: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
})

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string(), order: z.number() })),
})

/**
 * GET /api/panel/news - Lista todas las noticias con categorías y etiquetas (para gestión)
 */
export async function GET(request: Request) {
  try {
    await requireAuth(request)
    const [items, categories, tags] = await Promise.all([
      prisma.newsItem.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        include: {
          category: { select: { id: true, name: true, slug: true } },
          tags: { select: { id: true, name: true } },
        },
      }),
      prisma.newsCategory.findMany({ orderBy: { order: 'asc' }, select: { id: true, name: true, slug: true } }),
      prisma.newsTag.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    ])
    return NextResponse.json({ items, categories, tags }, { headers: CORS })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener noticias' },
      { status: error.message?.includes('No autorizado') ? 401 : 500, headers: CORS }
    )
  }
}

/**
 * POST /api/panel/news - Crear noticia
 */
export async function POST(request: Request) {
  try {
    await requireAuth(request)
    const body = await request.json()
    const { title, summary, content, categoryId, tagIds } = createSchema.parse(body)

    const baseSlug = slugify(title)
    const slug = await ensureUniqueSlug(baseSlug)

    const maxOrder = await prisma.newsItem
      .aggregate({ _max: { order: true } })
      .then((r) => r._max.order ?? -1)

    const item = await prisma.newsItem.create({
      data: {
        slug,
        title,
        summary,
        content,
        order: maxOrder + 1,
        categoryId: categoryId || null,
        tags: tagIds?.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
      },
    })
    return NextResponse.json({ item }, { headers: CORS })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const msg = error.errors[0]?.message || 'Datos inválidos'
      return NextResponse.json({ error: msg }, { status: 400, headers: CORS })
    }
    return NextResponse.json(
      { error: error.message || 'Error al crear noticia' },
      { status: error.message?.includes('No autorizado') ? 401 : 500, headers: CORS }
    )
  }
}

/**
 * PUT /api/panel/news - Actualizar una noticia o reordenar lista
 * Body: { id, title?, summary?, content?, isActive? } para actualizar
 *   o   { items: [ { id, order } ] } para reordenar
 */
export async function PUT(request: Request) {
  try {
    await requireAuth(request)
    const body = await request.json()

    if (body.items && Array.isArray(body.items)) {
      const { items } = reorderSchema.parse(body)
      await Promise.all(
        items.map(({ id, order }) =>
          prisma.newsItem.update({ where: { id }, data: { order } })
        )
      )
      const list = await prisma.newsItem.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      })
      return NextResponse.json({ items: list }, { headers: CORS })
    }

    const { id, title, summary, content, isActive, categoryId, tagIds } = updateSchema.parse(body)
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere id para actualizar' },
        { status: 400, headers: CORS }
      )
    }

    const data: {
      title?: string
      summary?: string
      content?: string
      isActive?: boolean
      slug?: string
      categoryId?: string | null
      tags?: { set: { id: string }[] }
    } = {}
    if (title !== undefined) data.title = title
    if (summary !== undefined) data.summary = summary
    if (content !== undefined) data.content = content
    if (isActive !== undefined) data.isActive = isActive
    if (categoryId !== undefined) data.categoryId = categoryId
    if (tagIds !== undefined) data.tags = { set: tagIds.map((tagId) => ({ id: tagId })) }

    if (title !== undefined) {
      const baseSlug = slugify(title)
      data.slug = await ensureUniqueSlug(baseSlug, id)
    }

    const item = await prisma.newsItem.update({
      where: { id },
      data,
    })
    return NextResponse.json({ item }, { headers: CORS })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const msg = error.errors[0]?.message || 'Datos inválidos'
      return NextResponse.json({ error: msg }, { status: 400, headers: CORS })
    }
    return NextResponse.json(
      { error: error.message || 'Error al actualizar' },
      { status: error.message?.includes('No autorizado') ? 401 : 500, headers: CORS }
    )
  }
}

/**
 * DELETE /api/panel/news?id=xxx - Eliminar noticia
 */
export async function DELETE(request: Request) {
  try {
    await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere id' },
        { status: 400, headers: CORS }
      )
    }
    await prisma.newsItem.delete({ where: { id } })
    return NextResponse.json({ ok: true }, { headers: CORS })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al eliminar' },
      { status: error.message?.includes('No autorizado') ? 401 : 500, headers: CORS }
    )
  }
}
