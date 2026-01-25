'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { format, differenceInHours } from 'date-fns'
import es from 'date-fns/locale/es'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CancelTurnoForm } from '@/components/cancel-turno-form'
import { AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
const CANCEL_WINDOW_HOURS = 12

interface Appointment {
  id: string
  startAt: string
  modality: string
  status: string
  professional?: {
    fullName: string
  }
}

export function CancelarTurnoContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Token no válido')
      setLoading(false)
      return
    }
    
    fetch(`${API_URL}/api/appointments/by-token?cancelToken=${token}`)
      .then(res => {
        if (!res.ok) throw new Error('Turno no encontrado')
        return res.json()
      })
      .then(data => setAppointment(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error || 'Turno no encontrado'}</p>
            <Link href="/">
              <Button className="w-full mt-4">Volver al inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (appointment.status === 'CANCELLED') {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Turno ya cancelado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Este turno ya ha sido cancelado anteriormente.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const startAt = new Date(appointment.startAt)
  const now = new Date()
  const hoursUntilAppointment = differenceInHours(startAt, now)
  const canCancel = hoursUntilAppointment >= CANCEL_WINDOW_HOURS

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Cancelar Turno</h1>
          <p className="text-muted-foreground">
            Confirmá la cancelación de tu turno
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detalles del Turno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Profesional:</span>
                <p className="font-medium">{appointment.professional?.fullName || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Fecha y Hora:</span>
                <p className="font-medium">
                  {format(startAt, "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Modalidad:</span>
                <p className="font-medium">{appointment.modality === 'online' ? 'Online' : 'Presencial'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {!canCancel && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                    No se puede cancelar automáticamente
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    El turno es en menos de {CANCEL_WINDOW_HOURS} horas. Contactanos directamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {canCancel && token && (
          <CancelTurnoForm cancelToken={token} />
        )}

        <div className="mt-6 text-center">
          <Link href="/">
            <Button variant="outline">Volver al Inicio</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

