'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { API_URL } from '@/lib/api'
import { getAuthToken, getAuthUser, authFetch } from '@/lib/auth-client'
import { 
  Upload, 
  Trash2, 
  GripVertical, 
  Eye, 
  EyeOff, 
  Image as ImageIcon, 
  Film,
  Loader2,
  AlertCircle,
  Lock,
  X,
  Settings,
  DollarSign
} from 'lucide-react'

interface Banner {
  id: string
  title: string | null
  mediaType: 'image' | 'video'
  url: string
  urls: {
    original: string
    thumbnail?: string
    hero?: string
  }
  order: number
  isActive: boolean
  fileSize: number
  uploadedByName: string
  createdAt: string
}

// Helper para obtener headers de autenticación
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = getAuthToken()
  const user = getAuthUser()
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (user?.professionalId) {
    headers['X-Professional-Id'] = user.professionalId
  }
  return headers
}

export function ConfigTab() {
  const { toast } = useToast()
  
  // Estado de Banners
  const [banners, setBanners] = useState<Banner[]>([])
  const [loadingBanners, setLoadingBanners] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado de Honorarios
  const [consultationFeePesos, setConsultationFeePesos] = useState<number | ''>('')
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [savingFee, setSavingFee] = useState(false)

  // Estado de Contraseña
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // =====================
  // BANNERS
  // =====================

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${API_URL}/api/panel/banners`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Error al cargar banners')
      const data = await res.json()
      setBanners(data.banners || [])
    } catch (error) {
      console.error('Error fetching banners:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los banners',
        variant: 'destructive',
      })
    } finally {
      setLoadingBanners(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/api/panel/config`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Error al cargar configuración')
      const data = await res.json()
      setConsultationFeePesos(data.consultationFeePesos ?? '')
    } catch (error) {
      console.error('Error fetching config:', error)
      toast({
        title: 'Error',
        description: 'No se pudo cargar la configuración de honorarios',
        variant: 'destructive',
      })
    } finally {
      setLoadingConfig(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  const handleSaveFee = async () => {
    const value = consultationFeePesos === '' ? null : Number(consultationFeePesos)
    if (value !== null && (value < 0 || !Number.isInteger(value))) {
      toast({
        title: 'Valor inválido',
        description: 'Los honorarios deben ser un número entero mayor o igual a 0 (pesos argentinos).',
        variant: 'destructive',
      })
      return
    }
    setSavingFee(true)
    try {
      const res = await fetch(`${API_URL}/api/panel/config`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultationFeePesos: value }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }
      toast({
        title: 'Honorarios actualizados',
        description: 'El valor se mostrará en el sitio y en la FAQ.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron guardar los honorarios',
        variant: 'destructive',
      })
    } finally {
      setSavingFee(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    
    if (!isImage && !isVideo) {
      toast({
        title: 'Tipo no válido',
        description: 'Solo se permiten imágenes (JPEG, PNG, WebP, GIF) o videos (MP4, WebM)',
        variant: 'destructive',
      })
      return
    }

    const maxSize = isImage ? 5 * 1024 * 1024 : 25 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: 'Archivo muy grande',
        description: `El límite es ${isImage ? '5MB' : '25MB'} para ${isImage ? 'imágenes' : 'videos'}. Para videos usá 720p y máx 30 segundos.`,
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (title.trim()) {
        formData.append('title', title.trim())
      }

      const res = await fetch(`${API_URL}/api/panel/banners`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al subir banner')
      }

      const data = await res.json()
      setBanners([...banners, data.banner])
      setTitle('')
      
      toast({
        title: 'Banner subido',
        description: 'El banner se agregó correctamente',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo subir el banner',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const toggleActive = async (banner: Banner) => {
    try {
      const res = await fetch(`${API_URL}/api/panel/banners`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          banners: [{ id: banner.id, isActive: !banner.isActive }],
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al actualizar')
      }

      setBanners(banners.map(b => 
        b.id === banner.id ? { ...b, isActive: !b.isActive } : b
      ))

      toast({
        title: banner.isActive ? 'Banner desactivado' : 'Banner activado',
        description: banner.isActive 
          ? 'El banner ya no se mostrará en el sitio'
          : 'El banner ahora se mostrará en el sitio',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el banner',
        variant: 'destructive',
      })
    }
  }

  const deleteBanner = async (banner: Banner) => {
    if (!confirm('¿Estás seguro de eliminar este banner? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/panel/banners?id=${banner.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }

      setBanners(banners.filter(b => b.id !== banner.id))
      
      toast({
        title: 'Banner eliminado',
        description: 'El banner fue eliminado correctamente',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el banner',
        variant: 'destructive',
      })
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newBanners = [...banners]
    const [draggedItem] = newBanners.splice(draggedIndex, 1)
    newBanners.splice(index, 0, draggedItem)
    
    setBanners(newBanners)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null) return
    setDraggedIndex(null)

    try {
      const updates = banners.map((b, index) => ({
        id: b.id,
        order: index,
      }))

      const res = await fetch(`${API_URL}/api/panel/banners`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners: updates }),
      })

      if (!res.ok) throw new Error('Error al guardar orden')
      
      toast({
        title: 'Orden actualizado',
        description: 'El orden de los banners fue guardado',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar el orden',
        variant: 'destructive',
      })
      fetchBanners()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // =====================
  // CONTRASEÑA
  // =====================

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Las contraseñas no coinciden',
      })
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'La nueva contraseña debe tener al menos 8 caracteres',
      })
      return
    }

    setChangingPassword(true)

    try {
      const res = await authFetch(`${API_URL}/api/panel/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (res.ok) {
        toast({
          variant: 'success',
          title: 'Éxito',
          description: 'Contraseña actualizada correctamente',
        })
        setShowChangePassword(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        const error = await res.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Error al cambiar la contraseña',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al cambiar la contraseña',
      })
    } finally {
      setChangingPassword(false)
    }
  }

  const activeBanners = banners.filter(b => b.isActive).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Configuración</h2>
      </div>

      {/* ===================== */}
      {/* HONORARIOS DE CONSULTA */}
      {/* ===================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Honorarios de consulta
          </CardTitle>
          <CardDescription>
            Monto en pesos argentinos (ARS). Es el mismo para todos los profesionales y se muestra en el perfil y en la FAQ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingConfig ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando...
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 max-w-md">
              <div className="flex-1">
                <Label htmlFor="consultationFeePesos">Monto por sesión (ARS)</Label>
                <Input
                  id="consultationFeePesos"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Ej: 15000"
                  value={consultationFeePesos === '' ? '' : consultationFeePesos}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '') setConsultationFeePesos('')
                    else {
                      const n = parseInt(v, 10)
                      if (!Number.isNaN(n) && n >= 0) setConsultationFeePesos(n)
                    }
                  }}
                  disabled={savingFee}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSaveFee} disabled={savingFee}>
                  {savingFee ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===================== */}
      {/* CAMBIO DE CONTRASEÑA */}
      {/* ===================== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Cambiar Contraseña
              </CardTitle>
              <CardDescription>
                Actualizá tu contraseña de acceso al panel
              </CardDescription>
            </div>
            <Button
              variant={showChangePassword ? 'outline' : 'default'}
              onClick={() => {
                setShowChangePassword(!showChangePassword)
                if (showChangePassword) {
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  })
                }
              }}
            >
              {showChangePassword ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Cambiar
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {showChangePassword && (
          <CardContent>
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="currentPassword">Contraseña Actual *</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  placeholder="Ingresá tu contraseña actual"
                  required
                />
              </div>
              <div>
                <Label htmlFor="newPassword">Nueva Contraseña *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  La contraseña debe tener al menos 8 caracteres
                </p>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  placeholder="Repetí la nueva contraseña"
                  required
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              >
                {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ===================== */}
      {/* BANNERS */}
      {/* ===================== */}
      
      {/* Subir nuevo banner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Banners del Sitio
          </CardTitle>
          <CardDescription>
            Imágenes hasta 5MB (JPEG, PNG, WebP, GIF) o videos hasta 25MB (MP4, WebM).
            <br />
            <span className="text-muted-foreground">
              Videos recomendados: resolución 720p, duración máxima 30 segundos.
            </span>
            <br />
            Máximo 10 banners activos. Los cambios se reflejan para todos los profesionales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="title">Título (opcional)</Label>
              <Input
                id="title"
                placeholder="Ej: Banner promoción verano"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={uploading}
              />
            </div>
            <div className="flex items-end">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || activeBanners >= 10}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Seleccionar archivo
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {activeBanners >= 10 && (
            <div className="mt-4 flex items-center gap-2 text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              Límite de 10 banners activos alcanzado. Desactiva alguno para subir más.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de banners */}
      <Card>
        <CardHeader>
          <CardTitle>Banners ({banners.length})</CardTitle>
          <CardDescription>
            {activeBanners} activo{activeBanners !== 1 ? 's' : ''} de 10 máximo. 
            Arrastra para reordenar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingBanners ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No hay banners. ¡Sube el primero!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {banners.map((banner, index) => (
                <div
                  key={banner.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                    banner.isActive 
                      ? 'bg-background border-border' 
                      : 'bg-muted/50 border-muted'
                  } ${draggedIndex === index ? 'opacity-50' : ''}`}
                >
                  {/* Drag handle */}
                  <div className="cursor-grab active:cursor-grabbing text-muted-foreground">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  {/* Preview */}
                  <div className="w-20 h-14 rounded overflow-hidden bg-muted flex-shrink-0">
                    {banner.mediaType === 'image' ? (
                      <img
                        src={banner.urls.thumbnail || banner.url}
                        alt={banner.title || 'Banner'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <Film className="h-6 w-6 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {banner.mediaType === 'image' ? (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Film className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium truncate">
                        {banner.title || `Banner ${index + 1}`}
                      </span>
                      {!banner.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatFileSize(banner.fileSize)} • Por {banner.uploadedByName}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(banner)}
                      title={banner.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {banner.isActive ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBanner(banner)}
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

      {/* Preview */}
      {activeBanners > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista previa</CardTitle>
            <CardDescription>
              Así se verá el carrusel en el sitio (solo banners activos)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {banners
                .filter(b => b.isActive)
                .map((banner, index) => (
                  <div key={banner.id} className="relative">
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      {banner.mediaType === 'image' ? (
                        <img
                          src={banner.urls.thumbnail || banner.url}
                          alt={banner.title || `Banner ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={banner.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                    </div>
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
