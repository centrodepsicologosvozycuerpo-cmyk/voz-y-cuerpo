'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import Link from 'next/link'
import { Loader2, Newspaper, ArrowRight, Search, ChevronLeft, ChevronRight } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
const PAGE_SIZE = 9

interface NewsCategory {
  id: string
  name: string
  slug: string
}

interface NewsTag {
  id: string
  name: string
}

interface NewsItem {
  id: string
  slug: string
  title: string
  summary: string
  createdAt: string
  category?: NewsCategory | null
  tags?: NewsTag[]
}

interface ListResponse {
  items: NewsItem[]
  total: number
  page: number
  totalPages: number
  limit: number
}

interface FiltersResponse {
  categories: NewsCategory[]
  tags: NewsTag[]
}

export default function NotasPage() {
  const [filters, setFilters] = useState<FiltersResponse>({ categories: [], tags: [] })
  const [items, setItems] = useState<NewsItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingFilters, setLoadingFilters] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)

  // Debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350)
    return () => clearTimeout(t)
  }, [searchQuery])

  const fetchFilters = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/news/filters`)
      if (!res.ok) return
      const data = await res.json()
      setFilters({ categories: data.categories || [], tags: data.tags || [] })
    } catch {
      // ignore
    } finally {
      setLoadingFilters(false)
    }
  }, [])

  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(PAGE_SIZE))
      if (debouncedSearch) params.set('q', debouncedSearch)
      if (selectedCategory) params.set('category', selectedCategory)
      if (selectedTagId) params.set('tag', selectedTagId)
      const res = await fetch(`${API_URL}/api/news?${params}`)
      if (!res.ok) throw new Error('Error al cargar notas')
      const data: ListResponse = await res.json()
      setItems(Array.isArray(data.items) ? data.items : [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 0)
    } catch (err: any) {
      setError(err.message || 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, selectedCategory, selectedTagId])

  useEffect(() => {
    fetchFilters()
  }, [fetchFilters])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, selectedCategory, selectedTagId])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const handleCategoryClick = (slug: string | null) => {
    setSelectedCategory(slug)
    setPage(1)
  }

  const handleTagClick = (tagId: string | null) => {
    setSelectedTagId(tagId)
    setPage(1)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setDebouncedSearch('')
    setSelectedCategory(null)
    setSelectedTagId(null)
    setPage(1)
  }

  const hasActiveFilters = debouncedSearch || selectedCategory || selectedTagId

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Newspaper className="h-10 w-10 text-primary" />
          Notas y novedades
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Noticias, artículos y novedades de nuestro equipo.
        </p>
      </div>

      {/* Buscador y filtros */}
      <div className="max-w-5xl mx-auto mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por título, descripción o contenido..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="filter-category" className="text-sm font-medium text-muted-foreground">
              Categoría
            </label>
            <select
              id="filter-category"
              value={selectedCategory ?? ''}
              onChange={(e) => handleCategoryClick(e.target.value || null)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Todas las categorías</option>
              {!loadingFilters &&
                filters.categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="filter-tag" className="text-sm font-medium text-muted-foreground">
              Etiqueta
            </label>
            <select
              id="filter-tag"
              value={selectedTagId ?? ''}
              onChange={(e) => handleTagClick(e.target.value || null)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Todas las etiquetas</option>
              {!loadingFilters &&
                filters.tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && items.length === 0 && (
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>
              {hasActiveFilters
                ? 'No hay notas que coincidan con los filtros.'
                : 'Por el momento no hay notas publicadas.'}
            </p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Ver todas
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {items.map((item) => (
              <Link key={item.id} href={`/notas/ver?slug=${encodeURIComponent(item.slug)}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {item.category && (
                        <Chip variant="secondary" className="text-xs">
                          {item.category.name}
                        </Chip>
                      )}
                      {item.tags?.map((t) => (
                        <Chip key={t.id} variant="outline" className="text-xs">
                          {t.name}
                        </Chip>
                      ))}
                    </div>
                    <CardTitle className="line-clamp-2">{item.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {item.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-primary font-medium inline-flex items-center gap-1">
                      Leer más <ArrowRight className="h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-10">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages} ({total} notas)
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
