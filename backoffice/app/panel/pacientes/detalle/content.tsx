'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Upload, Download, Trash2, Plus, Calendar, X } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import { API_URL } from '@/lib/api'

interface Patient {
  id: string
  firstName: string
  lastName: string
  birthDate: string
  address: string
  city: string
  province: string
  emergencyName: string
  emergencyRole: string
  emergencyPhone: string
  hasInsurance: boolean
  insuranceName?: string
  insuranceCardNumber?: string
  createdAt: string
  lastVisitAt?: string
  age: number
  files: any[]
  notes: any[]
  slotHolds: any[]
}

export function PatientDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams.get('id')

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>(null)
  const [newNote, setNewNote] = useState('')
  const [uploadingFile, setUploadingFile] = useState(false)

  useEffect(() => {
    if (patientId) {
      loadPatient()
    } else {
      setLoading(false)
    }
  }, [patientId])

  const loadPatient = async () => {
    try {
      const res = await fetch(`${API_URL}/api/patients/${patientId}`)
      if (res.ok) {
        const data = await res.json()
        setPatient(data.patient)
        setFormData({
          firstName: data.patient.firstName,
          lastName: data.patient.lastName,
          birthDate: data.patient.birthDate.split('T')[0],
          address: data.patient.address,
          city: data.patient.city,
          province: data.patient.province,
          emergencyName: data.patient.emergencyName,
          emergencyRole: data.patient.emergencyRole,
          emergencyPhone: data.patient.emergencyPhone,
          hasInsurance: data.patient.hasInsurance,
          insuranceName: data.patient.insuranceName || '',
          insuranceCardNumber: data.patient.insuranceCardNumber || '',
          lastVisitAt: data.patient.lastVisitAt ? data.patient.lastVisitAt.split('T')[0] : '',
        })
      }
    } catch (error) {
      console.error('Error loading patient:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData) return
    setSaving(true)

    try {
      const payload = {
        ...formData,
        birthDate: new Date(formData.birthDate).toISOString(),
        lastVisitAt: formData.lastVisitAt ? new Date(formData.lastVisitAt).toISOString() : null,
      }

      const res = await fetch(`${API_URL}/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        loadPatient()
        alert('Paciente actualizado correctamente')
      } else {
        const error = await res.json()
        alert(error.error || 'Error al actualizar paciente')
      }
    } catch (error) {
      console.error('Error updating patient:', error)
      alert('Error al actualizar paciente')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch(`${API_URL}/api/patients/${patientId}/files`, {
        method: 'POST',
        body: fd,
      })

      if (res.ok) {
        loadPatient()
      } else {
        const error = await res.json()
        alert(error.error || 'Error al subir archivo')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error al subir archivo')
    } finally {
      setUploadingFile(false)
      e.target.value = ''
    }
  }

  const handleFileDownload = async (fileId: string, fileName: string) => {
    try {
      const res = await fetch(`${API_URL}/api/patients/${patientId}/files/${fileId}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Error al descargar archivo')
    }
  }

  const handleFileDelete = async (fileId: string) => {
    if (!confirm('¿Estás seguro de eliminar este archivo?')) return

    try {
      const res = await fetch(`${API_URL}/api/patients/${patientId}/files/${fileId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        loadPatient()
      } else {
        const error = await res.json()
        alert(error.error || 'Error al eliminar archivo')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Error al eliminar archivo')
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    try {
      const res = await fetch(`${API_URL}/api/patients/${patientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      })

      if (res.ok) {
        setNewNote('')
        loadPatient()
      } else {
        const error = await res.json()
        alert(error.error || 'Error al crear nota')
      }
    } catch (error) {
      console.error('Error creating note:', error)
      alert('Error al crear nota')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!patientId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>ID de paciente no especificado</p>
        <Link href="/panel">
          <Button className="mt-4">Volver al Panel</Button>
        </Link>
      </div>
    )
  }

  if (loading || !patient || !formData) {
    return <div className="container mx-auto px-4 py-8">Cargando...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/panel">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Panel
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {patient.firstName} {patient.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="datos">
            <TabsList>
              <TabsTrigger value="datos">Datos</TabsTrigger>
              <TabsTrigger value="adjuntos">Adjuntos</TabsTrigger>
              <TabsTrigger value="notas">Notas</TabsTrigger>
              <TabsTrigger value="reservas">Reservas</TabsTrigger>
            </TabsList>

            <TabsContent value="datos" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Apellido *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Fecha de Nacimiento *</Label>
                  <Input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Edad</Label>
                  <Input value={`${patient.age} años`} disabled className="bg-muted" />
                </div>
                <div className="md:col-span-2">
                  <Label>Dirección *</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Localidad *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Provincia *</Label>
                  <Input
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Contacto de Emergencia *</Label>
                  <Input
                    value={formData.emergencyName}
                    onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Rol del Contacto *</Label>
                  <Input
                    value={formData.emergencyRole}
                    onChange={(e) => setFormData({ ...formData, emergencyRole: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Teléfono del Contacto *</Label>
                  <Input
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.hasInsurance}
                    onChange={(e) => setFormData({ ...formData, hasInsurance: e.target.checked })}
                  />
                  <Label>¿Tiene obra social?</Label>
                </div>
                {formData.hasInsurance && (
                  <>
                    <div>
                      <Label>Nombre de la Obra Social</Label>
                      <Input
                        value={formData.insuranceName}
                        onChange={(e) => setFormData({ ...formData, insuranceName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Número de Carnet</Label>
                      <Input
                        value={formData.insuranceCardNumber}
                        onChange={(e) => setFormData({ ...formData, insuranceCardNumber: e.target.value })}
                      />
                    </div>
                  </>
                )}
                <div>
                  <Label>Última Atención</Label>
                  <Input
                    type="date"
                    value={formData.lastVisitAt}
                    onChange={(e) => setFormData({ ...formData, lastVisitAt: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="adjuntos" className="space-y-4">
              <div>
                <Label>Subir Archivo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                  />
                  {uploadingFile && <span>Subiendo...</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Formatos permitidos: PDF, DOC, DOCX, TXT, MD (máx. 10MB)
                </p>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Nombre</th>
                      <th className="px-4 py-2 text-left">Tipo</th>
                      <th className="px-4 py-2 text-left">Tamaño</th>
                      <th className="px-4 py-2 text-left">Fecha</th>
                      <th className="px-4 py-2 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.files.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No hay archivos adjuntos
                        </td>
                      </tr>
                    ) : (
                      patient.files.map((file) => (
                        <tr key={file.id} className="border-t">
                          <td className="px-4 py-2">{file.originalName}</td>
                          <td className="px-4 py-2">{file.mimeType}</td>
                          <td className="px-4 py-2">{formatFileSize(file.size)}</td>
                          <td className="px-4 py-2">
                            {format(new Date(file.createdAt), 'dd/MM/yyyy', { locale: es })}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFileDownload(file.id, file.originalName)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFileDelete(file.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="notas" className="space-y-4">
              <div>
                <Label>Nueva Nota</Label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[100px]"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Escribe una nota interna sobre el paciente..."
                />
                <Button onClick={handleAddNote} className="mt-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Nota
                </Button>
              </div>

              <div className="space-y-2">
                {patient.notes.length === 0 ? (
                  <p className="text-muted-foreground">No hay notas registradas</p>
                ) : (
                  patient.notes.map((note) => (
                    <Card key={note.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(note.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{note.content}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="reservas" className="space-y-4">
              <Link href={`/panel/pacientes/reservar/?id=${patientId}`}>
                <Button>
                  <Calendar className="w-4 h-4 mr-2" />
                  Reservar Horario
                </Button>
              </Link>

              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Fecha/Hora</th>
                      <th className="px-4 py-2 text-left">Estado</th>
                      <th className="px-4 py-2 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.slotHolds.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                          No hay reservas activas
                        </td>
                      </tr>
                    ) : (
                      patient.slotHolds.map((hold) => (
                        <tr key={hold.id} className="border-t">
                          <td className="px-4 py-2">
                            {format(new Date(hold.startAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {hold.status === 'HOLD' ? 'Reservado' : hold.status}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {hold.status === 'HOLD' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  const res = await fetch(`${API_URL}/api/holds/${hold.id}/convert-to-appointment`, {
                                    method: 'POST',
                                  })
                                  if (res.ok) {
                                    loadPatient()
                                    alert('Reserva convertida en turno confirmado')
                                  }
                                }}
                              >
                                Convertir a Turno
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

