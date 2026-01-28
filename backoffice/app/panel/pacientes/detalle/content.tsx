'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Plus, Calendar } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import { API_URL } from '@/lib/api'
import { authFetch } from '@/lib/auth-client'
import { useToast } from '@/hooks/use-toast'

interface Patient {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
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
  notes: any[]
  slotHolds: any[]
}

export function PatientDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams.get('id')
  const { toast } = useToast()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>(null)
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    if (patientId) {
      loadPatient()
    } else {
      setLoading(false)
    }
  }, [patientId])

  const loadPatient = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/patients/${patientId}`)
      if (res.ok) {
        const data = await res.json()
        setPatient(data.patient)
        setFormData({
          firstName: data.patient.firstName,
          lastName: data.patient.lastName,
          email: data.patient.email || '',
          phone: data.patient.phone || '',
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

      const res = await authFetch(`${API_URL}/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        loadPatient()
        toast({ title: 'Paciente actualizado correctamente' })
      } else {
        const error = await res.json()
        toast({ title: error.error || 'Error al actualizar paciente', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error updating patient:', error)
      toast({ title: 'Error al actualizar paciente', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    try {
      const res = await authFetch(`${API_URL}/api/patients/${patientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      })

      if (res.ok) {
        setNewNote('')
        loadPatient()
        toast({ title: 'Nota agregada correctamente' })
      } else {
        const error = await res.json()
        toast({ title: error.error || 'Error al crear nota', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error creating note:', error)
      toast({ title: 'Error al crear nota', variant: 'destructive' })
    }
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
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Para notificaciones de turnos"
                  />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+54 11 1234-5678"
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
                                  const res = await authFetch(`${API_URL}/api/holds/${hold.id}/convert-to-appointment`, {
                                    method: 'POST',
                                  })
                                  if (res.ok) {
                                    loadPatient()
                                    toast({ title: 'Reserva convertida en turno confirmado' })
                                  } else {
                                    toast({ title: 'Error al convertir reserva', variant: 'destructive' })
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

