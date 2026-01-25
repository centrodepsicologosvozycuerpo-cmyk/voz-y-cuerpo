'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { API_URL } from '@/lib/api'
import { authFetch } from '@/lib/auth-client'
import { useToast } from '@/hooks/use-toast'

interface AddProfessionalDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  currentProfessionalId: string
}

export function AddProfessionalDialog({ open, onClose, onSuccess, currentProfessionalId }: AddProfessionalDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    title: '',
    email: '',
    password: '',
    contactEmail: '',
    whatsappPhone: '',
    specialties: '',
    modalities: '',
    languages: '',
    approach: '',
    description: '',
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Por favor, seleccioná un archivo de imagen',
        })
        return
      }
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'La imagen no debe superar los 5MB',
        })
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
      let photoUrl = null
      
      // Si hay foto, subirla primero
      if (photoFile) {
        const photoFormData = new FormData()
        photoFormData.append('file', photoFile)
        
        const photoRes = await fetch(`${API_URL}/api/professionals/photo`, {
          method: 'POST',
          headers: {
            'X-Professional-Id': currentProfessionalId,
          },
          body: photoFormData,
        })
        
        if (photoRes.ok) {
          const photoData = await photoRes.json()
          photoUrl = photoData.storageName
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Error al subir la foto',
          })
          setLoading(false)
          return
        }
      }

      const res = await authFetch(`${API_URL}/api/panel/change-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ADD_PROFESSIONAL',
          payloadJson: JSON.stringify({
            ...formData,
            photo: photoUrl,
            specialties: formData.specialties.split(',').map(s => s.trim()),
            modalities: formData.modalities.split(',').map(m => m.trim()),
            languages: formData.languages.split(',').map(l => l.trim()),
          }),
        }),
      })

      if (res.ok) {
        toast({
          variant: 'success',
          title: 'Éxito',
          description: 'Solicitud creada. Esperá la aprobación de los demás profesionales.',
        })
        setPhotoFile(null)
        setPhotoPreview(null)
        onSuccess()
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Error al crear la solicitud',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al crear la solicitud',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Alta de Profesional</DialogTitle>
          <DialogDescription>
            Completá los datos del nuevo profesional. La solicitud requerirá aprobación unánime.
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
              <Label htmlFor="email">Email de Login *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password Inicial *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
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
              <p className="text-xs text-muted-foreground mt-1">
                Si no se completa, se usará el email de login
              </p>
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
              {loading ? 'Creando...' : 'Crear Solicitud'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


