'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import { utcToZonedTime } from 'date-fns-tz'
import { Chip } from '@/components/ui/chip'
import type { Appointment, Professional } from '@/lib/types'
import { API_URL } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const TIMEZONE = 'America/Argentina/Buenos_Aires'

type AppointmentWithProfessional = Appointment & { professional: Professional }

interface AppointmentsTabProps {
  appointments: AppointmentWithProfessional[]
  onUpdate: (appointments: AppointmentWithProfessional[]) => void
}

export function AppointmentsTab({ appointments, onUpdate }: AppointmentsTabProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const handleCancel = async (appointmentId: string) => {
    if (!confirm('¿Estás seguro de cancelar este turno?')) {
      return
    }

    setLoading(appointmentId)
    try {
      const response = await fetch(`${API_URL}/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Error al cancelar')
      }

      // Actualizar lista
      const updated = appointments.map((apt) =>
        apt.id === appointmentId ? { ...apt, status: 'CANCELLED' as const } : apt
      )
      onUpdate(updated)
      toast({ title: 'Turno cancelado correctamente' })
    } catch (error) {
      toast({ title: 'Error al cancelar el turno', variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Turnos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Fecha/Hora</th>
                  <th className="text-left p-2">Profesional</th>
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">Modalidad</th>
                  <th className="text-left p-2">Estado</th>
                  <th className="text-left p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => {
                  const localStart = utcToZonedTime(apt.startAt, TIMEZONE)
                  const statusColors = {
                    PENDING_CONFIRMATION: 'bg-amber-100 text-amber-800',
                    PENDING: 'bg-yellow-100 text-yellow-800',
                    CONFIRMED: 'bg-green-100 text-green-800',
                    CANCELLED: 'bg-gray-100 text-gray-800',
                  }

                  return (
                    <tr key={apt.id} className="border-b">
                      <td className="p-2">
                        {format(localStart, "d/M/yyyy HH:mm", { locale: es })}
                      </td>
                      <td className="p-2">{apt.professional.fullName}</td>
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{apt.clientName}</p>
                          <p className="text-xs text-muted-foreground">{apt.clientEmail}</p>
                        </div>
                      </td>
                      <td className="p-2">
                        <Chip className="text-xs">
                          {apt.modality === 'online' ? 'Online' : 'Presencial'}
                        </Chip>
                      </td>
                      <td className="p-2">
                        <Chip variant="secondary" className={`text-xs ${statusColors[apt.status as keyof typeof statusColors]}`}>
                          {apt.status}
                        </Chip>
                      </td>
                      <td className="p-2">
                        {apt.status !== 'CANCELLED' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancel(apt.id)}
                            disabled={loading === apt.id}
                          >
                            {loading === apt.id ? 'Cancelando...' : 'Cancelar'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {appointments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No hay turnos registrados</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


