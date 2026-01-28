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
import { authFetch } from '@/lib/auth-client'
import { useToast } from '@/hooks/use-toast'

interface Patient {
  id: string
  firstName: string
  lastName: string
}

export function ReservarHorarioContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams.get('id')
  const { toast } = useToast()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
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
      const res = await authFetch(`${API_URL}/api/patients/${patientId}`)
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
      // Combinar fecha + hora para crear los datetime
      const startAt = new Date(`${formData.date}T${formData.startTime}:00`)
      const endAt = new Date(`${formData.date}T${formData.endTime}:00`)

      const payload = {
        patientId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        recurrence: formData.recurrence,
        weeks: formData.recurrence === 'weekly' ? formData.weeks : undefined,
      }

      const res = await authFetch(`${API_URL}/api/holds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast({ title: 'Reserva creada correctamente' })
        router.push(`/panel/pacientes/detalle/?id=${patientId}`)
      } else {
        const error = await res.json()
        toast({ title: error.error || 'Error al crear reserva', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error creating hold:', error)
      toast({ title: 'Error al crear reserva', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startTime = e.target.value
    setFormData(prev => ({ ...prev, startTime }))
    
    // Auto-calcular hora de fin (50 minutos después)
    if (startTime) {
      const [hours, minutes] = startTime.split(':').map(Number)
      const totalMinutes = hours * 60 + minutes + 50
      const endHours = Math.floor(totalMinutes / 60) % 24
      const endMinutes = totalMinutes % 60
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
      setFormData(prev => ({ ...prev, startTime, endTime }))
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
              <Label htmlFor="date">Fecha *</Label>
              <Input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Hora de Inicio *</Label>
                <Input
                  id="startTime"
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={handleStartTimeChange}
                />
              </div>
              <div>
                <Label htmlFor="endTime">Hora de Fin *</Label>
                <Input
                  id="endTime"
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Se calcula automáticamente (+50 min)
                </p>
              </div>
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
                  Se crearán {formData.weeks} reservas (una por semana, mismo día y horario)
                </p>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Link href={`/panel/pacientes/detalle/?id=${patientId}`}>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={saving || !formData.date || !formData.startTime || !formData.endTime}>
                {saving ? 'Guardando...' : 'Crear Reserva'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

