'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { API_URL } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface EditProfessionalDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  professionalId: string
}

export function EditProfessionalDialog({ open, onClose, onSuccess, professionalId }: EditProfessionalDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    title: '',
    contactEmail: '',
    whatsappPhone: '',
    specialties: '',
    modalities: '',
    languages: '',
    approach: '',
    description: '',
    photo: '',
  })

  useEffect(() => {
    if (open && professionalId) {
      loadProfessional()
    }
  }, [open, professionalId])

  const loadProfessional = async () => {
    try {
      setLoadingData(true)
      const res = await fetch(`${API_URL}/api/professionals/${professionalId}`)
      if (res.ok) {
        const data = await res.json()
        const prof = data.professional
        const specialties = JSON.parse(prof.specialties || '[]')
        const modalities = JSON.parse(prof.modalities || '[]')
        const languages = JSON.parse(prof.languages || '[]')

        setFormData({
          fullName: prof.fullName || '',
          title: prof.title || '',
          contactEmail: prof.contactEmail || '',
          whatsappPhone: prof.whatsappPhone || '',
          specialties: specialties.join(', '),
          modalities: modalities.join(', '),
          languages: languages.join(', '),
          approach: prof.approach || '',
          description: prof.description || '',
          photo: prof.photo || '',
        })

        if (prof.photoUrls?.avatar ?? prof.photoUrls?.original) {
          setPhotoPreview(prof.photoUrls?.avatar ?? prof.photoUrls?.original ?? null)
        } else if (prof.photo) {
          setPhotoPreview(`${API_URL}/api/professionals/photo/${prof.photo}`)
        }
      }
    } catch (error) {
      console.error('Error loading professional:', error)
      toast({ title: 'Error al cargar los datos del profesional', variant: 'destructive' })
    } finally {
      setLoadingData(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Por favor, seleccioná un archivo de imagen', variant: 'destructive' })
        return
      }
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'La imagen no debe superar los 5MB', variant: 'destructive' })
        return
      }
      setPhotoFile(file)
      // Crear preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let photoUrl = formData.photo
      
      // Si hay nueva foto, subirla primero
      if (photoFile) {
        const photoFormData = new FormData()
        photoFormData.append('file', photoFile)
        
        const photoRes = await fetch(`${API_URL}/api/professionals/photo`, {
          method: 'POST',
          headers: {
            'X-Professional-Id': professionalId,
          },
          body: photoFormData,
        })
        
        if (photoRes.ok) {
          const photoData = await photoRes.json()
          photoUrl = photoData.storageName
          setPhotoPreview(photoData.urls?.avatar ?? photoData.urls?.original ?? photoData.url ?? null)
        } else {
          toast({ title: 'Error al subir la foto', variant: 'destructive' })
          setLoading(false)
          return
        }
      }

      const res = await fetch(`${API_URL}/api/professionals/${professionalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Professional-Id': professionalId,
        },
        body: JSON.stringify({
          ...formData,
          photo: photoUrl,
          specialties: formData.specialties.split(',').map(s => s.trim()).filter(s => s),
          modalities: formData.modalities.split(',').map(m => m.trim()).filter(m => m),
          languages: formData.languages.split(',').map(l => l.trim()).filter(l => l),
        }),
      })

      if (res.ok) {
        toast({ title: 'Profesional actualizado correctamente' })
        setPhotoFile(null)
        setPhotoPreview(null)
        onSuccess()
      } else {
        const error = await res.json()
        toast({ title: error.error || 'Error al actualizar el profesional', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error al actualizar el profesional', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <div className="py-8 text-center">Cargando...</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Profesional</DialogTitle>
          <DialogDescription>
            Actualizá los datos del profesional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Nombre Completo *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Psicóloga"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactEmail">Email de Contacto</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="whatsappPhone">WhatsApp</Label>
              <Input
                id="whatsappPhone"
                value={formData.whatsappPhone}
                onChange={(e) => setFormData({ ...formData, whatsappPhone: e.target.value })}
                placeholder="+541100000000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="specialties">Especialidades (separadas por coma) *</Label>
            <Input
              id="specialties"
              value={formData.specialties}
              onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
              required
              placeholder="ansiedad, depresión, terapia individual"
            />
          </div>

          <div>
            <Label htmlFor="modalities">Modalidades (separadas por coma) *</Label>
            <Input
              id="modalities"
              value={formData.modalities}
              onChange={(e) => setFormData({ ...formData, modalities: e.target.value })}
              required
              placeholder="online, presencial"
            />
          </div>

          <div>
            <Label htmlFor="languages">Idiomas (separados por coma)</Label>
            <Input
              id="languages"
              value={formData.languages}
              onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
              placeholder="español, inglés"
            />
          </div>

          <div>
            <Label htmlFor="approach">Enfoque Terapéutico</Label>
            <textarea
              id="approach"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.approach}
              onChange={(e) => setFormData({ ...formData, approach: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción de lo que realiza</Label>
            <textarea
              id="description"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción de las actividades y servicios que ofrece el profesional..."
            />
          </div>

          <div>
            <Label htmlFor="photo">Foto del Profesional</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="cursor-pointer"
            />
            {photoPreview && (
              <div className="mt-2">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-md border"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Formatos aceptados: JPG, PNG, GIF. Tamaño máximo: 5MB
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


