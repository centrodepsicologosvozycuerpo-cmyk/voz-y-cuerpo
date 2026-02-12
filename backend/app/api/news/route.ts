import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS })
}

const DEFAULT_LIMIT = 9
const MAX_LIMIT = 24

/**
 * GET /api/news
 * Lista de noticias activas con filtros, búsqueda y paginación.
 * Query: category (slug), tag (id), q (búsqueda), page, limit
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('category')?.trim() || undefined
    const tagId = searchParams.get('tag')?.trim() || undefined
    const q = searchParams.get('q')?.trim() || undefined
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)))

    const where: Prisma.NewsItemWhereInput = { isActive: true }

    if (categorySlug) {
      where.category = { slug: categorySlug }
    }

    if (tagId) {
      where.tags = { some: { id: tagId } }
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.newsItem.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          createdAt: true,
          category: { select: { id: true, name: true, slug: true } },
          tags: { select: { id: true, name: true } },
        },
      }),
      prisma.newsItem.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json(
      {
        items,
        total,
        page,
        totalPages,
        limit,
      },
      { headers: CORS }
    )
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'Error al obtener noticias' },
      { status: 500, headers: CORS }
    )
  }
}
