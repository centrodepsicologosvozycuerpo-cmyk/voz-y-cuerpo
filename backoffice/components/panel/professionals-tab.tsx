'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Chip } from '@/components/ui/chip'
import { Save, X, Edit, Camera } from 'lucide-react'
import { API_URL } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface ProfessionalsTabProps {
  professionalId: string
}

export function ProfessionalsTab({ professionalId }: ProfessionalsTabProps) {
  const { toast } = useToast()
  const [professional, setProfessional] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
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
    loadProfessional()
  }, [professionalId])

  const loadProfessional = async () => {
    try {
      const res = await fetch(`${API_URL}/api/professionals/${professionalId}`)
      if (res.ok) {
        const data = await res.json()
        const prof = data.professional
        setProfessional(prof)
        
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

        if (prof.photo) {
          setPhotoPreview(`${API_URL}/api/professionals/photo/${prof.photo}`)
        }
      }
    } catch (error) {
      console.error('Error loading professional:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Por favor, seleccioná un archivo de imagen',
        })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'La imagen no debe superar los 5MB',
        })
        return
      }
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      let photoUrl = formData.photo

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
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Error al subir la foto',
          })
          setSaving(false)
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
        toast({
          variant: 'success',
          title: 'Éxito',
          description: 'Perfil actualizado correctamente',
        })
        setPhotoFile(null)
        setEditing(false)
        loadProfessional()
      } else {
        const error = await res.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Error al actualizar el perfil',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al actualizar el perfil',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setPhotoFile(null)
    if (professional) {
      const specialties = JSON.parse(professional.specialties || '[]')
      const modalities = JSON.parse(professional.modalities || '[]')
      const languages = JSON.parse(professional.languages || '[]')

      setFormData({
        fullName: professional.fullName || '',
        title: professional.title || '',
        contactEmail: professional.contactEmail || '',
        whatsappPhone: professional.whatsappPhone || '',
        specialties: specialties.join(', '),
        modalities: modalities.join(', '),
        languages: languages.join(', '),
        approach: professional.approach || '',
        description: professional.description || '',
        photo: professional.photo || '',
      })

      if (professional.photo) {
        setPhotoPreview(`${API_URL}/api/professionals/photo/${professional.photo}`)
      } else {
        setPhotoPreview(null)
      }
    }
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  if (!professional) {
    return <div>Error al cargar el perfil</div>
  }

  const specialties = JSON.parse(professional.specialties || '[]')
  const modalities = JSON.parse(professional.modalities || '[]')
  const languages = JSON.parse(professional.languages || '[]')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mi Perfil</CardTitle>
              <CardDescription>
                Gestioná tu información profesional
              </CardDescription>
            </div>
            {!editing ? (
              <Button onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!editing ? (
            // Vista de lectura
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Foto */}
              <div className="flex flex-col items-center">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={professional.fullName}
                    className="w-40 h-40 object-cover rounded-full border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-40 h-40 bg-gray-200 rounded-full flex items-center justify-center">
                    <Camera className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <h2 className="mt-4 text-xl font-bold text-center">{professional.fullName}</h2>
                <p className="text-muted-foreground">{professional.title}</p>
              </div>

              {/* Información principal */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email de Contacto</h3>
                    <p>{professional.contactEmail || 'No especificado'}</p>
                    {professional.user?.email && (
                      <p className="text-xs text-muted-foreground mt-1">
                        (Email de login: {professional.user.email})
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">WhatsApp</h3>
                    <p>{professional.whatsappPhone || 'No especificado'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Especialidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {specialties.map((spec: string) => (
                      <Chip key={spec} variant="secondary">
                        {spec}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Modalidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {modalities.map((mod: string) => (
                      <Chip key={mod}>
                        {mod === 'online' ? 'Online' : 'Presencial'}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Idiomas</h3>
                  <div className="flex flex-wrap gap-2">
                    {languages.length > 0 ? languages.map((lang: string) => (
                      <Chip key={lang} variant="outline">
                        {lang}
                      </Chip>
                    )) : <span className="text-muted-foreground">No especificado</span>}
                  </div>
                </div>

                {professional.approach && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Enfoque Terapéutico</h3>
                    <p className="text-sm">{professional.approach}</p>
                  </div>
                )}

                {professional.description && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Descripción</h3>
                    <p className="text-sm">{professional.description}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Vista de edición
            <div className="space-y-4">
              <div className="flex flex-col items-center mb-6">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-full border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
                    <Camera className="h-10 w-10 text-gray-400" />
                  </div>
                )}
                <Label htmlFor="photo" className="mt-3 cursor-pointer text-primary hover:underline">
                  Cambiar foto
                </Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Email de Contacto</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Este email también se usará para iniciar sesión en el sistema
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
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.approach}
                  onChange={(e) => setFormData({ ...formData, approach: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción de las actividades y servicios que ofrece..."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
