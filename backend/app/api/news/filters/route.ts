import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS })
}

/**
 * GET /api/news/filters
 * Devuelve categorías y etiquetas para los filtros del listado de notas.
 */
export async function GET() {
  try {
    const [categories, tags] = await Promise.all([
      prisma.newsCategory.findMany({
        orderBy: { order: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
      prisma.newsTag.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
    ])
    return NextResponse.json({ categories, tags }, { headers: CORS })
  } catch (error) {
    console.error('Error fetching news filters:', error)
    return NextResponse.json(
      { error: 'Error al obtener filtros' },
      { status: 500, headers: CORS }
    )
  }
}
