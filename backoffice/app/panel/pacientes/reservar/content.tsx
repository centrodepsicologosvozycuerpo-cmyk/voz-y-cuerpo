'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { API_URL } from '@/lib/api'

interface Patient {
  id: string
  firstName: string
  lastName: string
}

export function ReservarHorarioContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams.get('id')

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    startAt: '',
    endAt: '',
    recurrence: 'single' as 'single' | 'weekly',
    weeks: 1,
  })

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
      }
    } catch (error) {
      console.error('Error loading patient:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        patientId,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: formData.endAt ? new Date(formData.endAt).toISOString() : undefined,
        recurrence: formData.recurrence,
        weeks: formData.recurrence === 'weekly' ? formData.weeks : undefined,
      }

      const res = await fetch(`${API_URL}/api/holds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        router.push(`/panel/pacientes/detalle/?id=${patientId}`)
      } else {
        const error = await res.json()
        alert(error.error || 'Error al crear reserva')
      }
    } catch (error) {
      console.error('Error creating hold:', error)
      alert('Error al crear reserva')
    } finally {
      setSaving(false)
    }
  }

  const handleStartAtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startAt = e.target.value
    setFormData({ ...formData, startAt })
    
    if (startAt && !formData.endAt) {
      const startDate = new Date(startAt)
      const endDate = new Date(startDate.getTime() + 50 * 60 * 1000)
      setFormData(prev => ({
        ...prev,
        startAt,
        endAt: endDate.toISOString().slice(0, 16),
      }))
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

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Cargando...</div>
  }

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Paciente no encontrado</p>
        <Link href="/panel">
          <Button variant="outline" className="mt-4">
            Volver al Panel
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/panel/pacientes/detalle/?id=${patientId}`}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Paciente
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Reservar Horario para {patient.firstName} {patient.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="startAt">Fecha y Hora de Inicio *</Label>
              <Input
                id="startAt"
                type="datetime-local"
                required
                value={formData.startAt}
                onChange={handleStartAtChange}
              />
            </div>

            <div>
              <Label htmlFor="endAt">Fecha y Hora de Fin</Label>
              <Input
                id="endAt"
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Si no se especifica, se calculará automáticamente (50 minutos después del inicio)
              </p>
            </div>

            <div>
              <Label htmlFor="recurrence">Recurrencia</Label>
              <select
                id="recurrence"
                value={formData.recurrence}
                onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as 'single' | 'weekly' })}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="single">Único</option>
                <option value="weekly">Semanal (repetir cada semana)</option>
              </select>
            </div>

            {formData.recurrence === 'weekly' && (
              <div>
                <Label htmlFor="weeks">Número de Semanas</Label>
                <Input
                  id="weeks"
                  type="number"
                  min="1"
                  max="52"
                  value={formData.weeks}
                  onChange={(e) => setFormData({ ...formData, weeks: parseInt(e.target.value) || 1 })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Se crearán reservas para las próximas {formData.weeks} semanas
                </p>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Link href={`/panel/pacientes/detalle/?id=${patientId}`}>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Crear Reserva'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

