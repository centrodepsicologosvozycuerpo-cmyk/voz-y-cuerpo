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
 * GET /api/news/[slug]
 * Una nota completa por slug (para la página de detalle)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const item = await prisma.newsItem.findUnique({
      where: { slug, isActive: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true } },
      },
    })
    if (!item) {
      return NextResponse.json(
        { error: 'Noticia no encontrada' },
        { status: 404, headers: CORS }
      )
    }
    return NextResponse.json(item, { headers: CORS })
  } catch (error) {
    console.error('Error fetching news item:', error)
    return NextResponse.json(
      { error: 'Error al obtener la noticia' },
      { status: 500, headers: CORS }
    )
  }
}
