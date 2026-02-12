'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { API_URL } from '@/lib/api'
import { getAuthToken, getAuthUser } from '@/lib/auth-client'
import { Chip } from '@/components/ui/chip'
import { GripVertical, Loader2, Newspaper, Plus, Pencil, Trash2, X } from 'lucide-react'

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
  content: string
  order: number
  isActive: boolean
  categoryId?: string | null
  category?: NewsCategory | null
  tags?: NewsTag[]
  createdAt: string
  updatedAt: string
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = getAuthToken()
  const user = getAuthUser()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (user?.professionalId) headers['X-Professional-Id'] = user.professionalId
  return headers
}

export function NewsTab() {
  const { toast } = useToast()
  const [items, setItems] = useState<NewsItem[]>([])
  const [categories, setCategories] = useState<NewsCategory[]>([])
  const [tags, setTags] = useState<NewsTag[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [creatingTag, setCreatingTag] = useState(false)

  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    categoryId: '' as string | null,
    tagIds: [] as string[],
  })

  const fetchNews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/panel/news`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Error al cargar notas')
      const data = await res.json()
      setItems(data.items || [])
      setCategories(data.categories || [])
      setTags(data.tags || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las notas',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm({ title: '', summary: '', content: '', categoryId: null, tagIds: [] })
    setDialogOpen(true)
  }

  const openEdit = (item: NewsItem) => {
    setEditingId(item.id)
    setForm({
      title: item.title,
      summary: item.summary,
      content: item.content,
      categoryId: item.categoryId ?? item.category?.id ?? null,
      tagIds: item.tags?.map((t) => t.id) ?? [],
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.summary.trim() || !form.content.trim()) {
      toast({
        title: 'Campos requeridos',
        description: 'Completá título, descripción breve y contenido.',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch(`${API_URL}/api/panel/news`, {
          method: 'PUT',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            title: form.title.trim(),
            summary: form.summary.trim(),
            content: form.content.trim(),
            categoryId: form.categoryId || null,
            tagIds: form.tagIds,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al guardar')
        }
        toast({ title: 'Nota actualizada', description: 'Los cambios se guardaron correctamente.' })
      } else {
        const res = await fetch(`${API_URL}/api/panel/news`, {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title.trim(),
            summary: form.summary.trim(),
            content: form.content.trim(),
            categoryId: form.categoryId || null,
            tagIds: form.tagIds,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al crear')
        }
        toast({ title: 'Nota creada', description: 'La nota ya está publicada en el sitio.' })
      }
      setDialogOpen(false)
      fetchNews()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: NewsItem) => {
    if (!confirm(`¿Eliminar la nota "${item.title}"? Esta acción no se puede deshacer.`)) return
    try {
      const res = await fetch(`${API_URL}/api/panel/news?id=${item.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Error al eliminar')
      toast({ title: 'Nota eliminada', description: 'La nota fue eliminada correctamente.' })
      fetchNews()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar',
        variant: 'destructive',
      })
    }
  }

  const handleDragStart = (index: number) => setDraggedIndex(index)
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex == null || draggedIndex === index) return
    const newItems = [...items]
    const [removed] = newItems.splice(draggedIndex, 1)
    newItems.splice(index, 0, removed)
    setItems(newItems)
    setDraggedIndex(index)
  }
  const handleCreateCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) return
    setCreatingCategory(true)
    try {
      const res = await fetch(`${API_URL}/api/panel/news/categories`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Error')
      }
      const { category } = await res.json()
      setCategories((prev) => [...prev, category])
      setForm((f) => ({ ...f, categoryId: category.id }))
      setNewCategoryName('')
      setCategoryDialogOpen(false)
      toast({ title: 'Categoría creada' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleCreateTag = async () => {
    const name = newTagName.trim()
    if (!name) return
    setCreatingTag(true)
    try {
      const res = await fetch(`${API_URL}/api/panel/news/tags`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Error')
      }
      const { tag } = await res.json()
      setTags((prev) => [...prev, tag])
      setForm((f) => ({ ...f, tagIds: [...f.tagIds, tag.id] }))
      setNewTagName('')
      setTagDialogOpen(false)
      toast({ title: 'Etiqueta creada' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setCreatingTag(false)
    }
  }

  const handleDragEnd = async () => {
    if (draggedIndex == null) return
    setDraggedIndex(null)
    try {
      const updates = items.map((it, i) => ({ id: it.id, order: i }))
      const res = await fetch(`${API_URL}/api/panel/news`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updates }),
      })
      if (!res.ok) throw new Error('Error al guardar orden')
      toast({ title: 'Orden actualizado', description: 'El orden de las notas fue guardado.' })
      fetchNews()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el orden',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Notas y novedades</h2>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva nota
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de notas</CardTitle>
          <CardDescription>
            Las notas se muestran en el sitio en el orden indicado. Arrastrá para reordenar. Todos los profesionales ven las mismas noticias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Newspaper className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No hay notas. Creá la primera desde &quot;Nueva nota&quot;.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-4 p-4 rounded-lg border bg-card ${
                    draggedIndex === index ? 'opacity-50' : ''
                  }`}
                >
                  <div className="cursor-grab active:cursor-grabbing text-muted-foreground">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{item.summary}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.category && (
                        <Chip variant="secondary" className="text-xs">{item.category.name}</Chip>
                      )}
                      {item.tags?.map((t) => (
                        <Chip key={t.id} variant="outline" className="text-xs">{t.name}</Chip>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item)}
                      className="text-destructive hover:text-destructive"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar nota' : 'Nueva nota'}</DialogTitle>
            <DialogDescription>
              Título y descripción breve aparecen en la tarjeta. El contenido completo se muestra al abrir la nota.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="news-title">Título *</Label>
              <Input
                id="news-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ej: Nuevo taller de mindfulness"
              />
            </div>
            <div>
              <Label htmlFor="news-summary">Descripción breve (para la tarjeta) *</Label>
              <Input
                id="news-summary"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Una o dos líneas que se verán en el listado"
              />
            </div>
            <div>
              <Label>Categoría</Label>
              <div className="flex gap-2 mt-1">
                <select
                  value={form.categoryId ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value ? e.target.value : null })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Ninguna</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewCategoryName('')
                    setCategoryDialogOpen(true)
                  }}
                >
                  Nueva
                </Button>
              </div>
            </div>
            <div>
              <Label>Etiquetas</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {form.tagIds.map((id) => {
                  const tag = tags.find((t) => t.id === id)
                  return (
                    <Chip key={id} variant="secondary" className="gap-1">
                      {tag?.name ?? id}
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, tagIds: f.tagIds.filter((x) => x !== id) }))
                        }
                        className="ml-1 rounded hover:bg-muted"
                        aria-label="Quitar"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Chip>
                  )
                })}
                <select
                  value=""
                  onChange={(e) => {
                    const id = e.target.value
                    if (!id) return
                    e.target.value = ''
                    if (!form.tagIds.includes(id)) {
                      setForm((f) => ({ ...f, tagIds: [...f.tagIds, id] }))
                    }
                  }}
                  className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm"
                >
                  <option value="">Agregar etiqueta...</option>
                  {tags.filter((t) => !form.tagIds.includes(t.id)).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewTagName('')
                    setTagDialogOpen(true)
                  }}
                >
                  Nueva etiqueta
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="news-content">Contenido completo *</Label>
              <textarea
                id="news-content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Texto completo de la nota..."
                rows={12}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Nueva categoría */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
            <DialogDescription>
              Creá una categoría para organizar las notas. Podés usarla en esta nota y en otras.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="new-category-name">Nombre</Label>
            <Input
              id="new-category-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ej: Talleres, Novedades..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCategory} disabled={creatingCategory || !newCategoryName.trim()}>
              {creatingCategory ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear categoría'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Nueva etiqueta */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva etiqueta</DialogTitle>
            <DialogDescription>
              Creá una etiqueta para esta nota. Podés usarla en otras notas desde el selector.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="new-tag-name">Nombre</Label>
            <Input
              id="new-tag-name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Ej: mindfulness, adultos..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTag} disabled={creatingTag || !newTagName.trim()}>
              {creatingTag ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear etiqueta'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
