'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Loader2, ArrowLeft } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

interface NewsItem {
  id: string
  slug: string
  title: string
  summary: string
  content: string
  createdAt: string
  category?: { id: string; name: string; slug: string } | null
  tags?: { id: string; name: string }[]
}

export default function VerNotaPage() {
  const searchParams = useSearchParams()
  const slug = searchParams?.get('slug') ?? ''
  const [item, setItem] = useState<NewsItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setError('Noticia no especificada')
      setLoading(false)
      return
    }
    fetch(`${API_URL}/api/news/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Noticia no encontrada')
        return res.json()
      })
      .then(setItem)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">
              {error || 'Noticia no encontrada'}
            </p>
            <Link href="/notas">
              <Button className="w-full mt-4">Volver a notas</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dateStr = new Date(item.createdAt).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/notas"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a notas
          </Link>
        </div>

        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <p className="text-sm text-muted-foreground">{dateStr}</p>
              {item.category && (
                <Chip variant="secondary">{item.category.name}</Chip>
              )}
              {item.tags?.map((t) => (
                <Chip key={t.id} variant="outline">{t.name}</Chip>
              ))}
            </div>
            <h1 className="text-3xl font-bold mb-4">{item.title}</h1>
            <div className="prose prose-slate max-w-none whitespace-pre-wrap text-muted-foreground">
              {item.content}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
