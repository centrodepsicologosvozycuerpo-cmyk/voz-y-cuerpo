'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Calendar, MessageCircle, X, Loader2 } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

interface Appointment {
  id: string
  startAt: string
  endAt: string
  modality: string
  locationLabel?: string
  cancelToken: string
  status: string
  professional?: {
    fullName: string
    whatsappPhone?: string
  }
}

export function TurnoExitoContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('ID de turno no encontrado')
      setLoading(false)
      return
    }
    
    // Forzar recarga sin caché para obtener el estado más reciente
    console.log(`[Frontend] Intentando obtener appointment con ID: ${id}`)
    console.log(`[Frontend] URL: ${API_URL}/api/appointments/${id}`)
    
    fetch(`${API_URL}/api/appointments/${id}`, {
      method: 'GET',
      cache: 'no-store',
      mode: 'cors', // Asegurar que use CORS
      credentials: 'omit', // No enviar cookies
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
      },
    })
      .then(res => {
        if (!res.ok) {
          // Intentar obtener el mensaje de error del servidor
          return res.json().then(errData => {
            throw new Error(errData.error || `Error ${res.status}: ${res.statusText}`)
          }).catch(() => {
            throw new Error(`Error ${res.status}: ${res.statusText}`)
          })
        }
        return res.json()
      })
      .then(data => {
        console.log('Appointment data received:', data)
        setAppointment(data)
      })
      .catch(err => {
        console.error('Error fetching appointment:', err)
        // Mensaje más descriptivo según el tipo de error
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          setError('No se pudo conectar con el servidor. Verificá que el backend esté corriendo en ' + API_URL)
        } else {
          setError(err.message || 'Error al cargar el turno')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

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

  const startAt = new Date(appointment.startAt)
  const endAt = new Date(appointment.endAt)

  const professionalName = appointment.professional?.fullName || 'el profesional'
  const professionalWhatsapp = appointment.professional?.whatsappPhone
  const whatsappUrl = professionalWhatsapp 
    ? `https://wa.me/${professionalWhatsapp.replace(/[^0-9]/g, '')}`
    : null

  // Normalizar el estado (trim y uppercase para evitar problemas de formato)
  const normalizedStatus = (appointment.status || '').trim().toUpperCase()
  const isPending = normalizedStatus === 'PENDING_CONFIRMATION'
  const isConfirmed = normalizedStatus === 'CONFIRMED'
  const isCancelled = normalizedStatus === 'CANCELLED'

  // Debug: mostrar el estado en consola (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('Appointment status:', appointment.status, 'Normalized:', normalizedStatus, 'isPending:', isPending)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          {isConfirmed ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">¡Turno Confirmado!</h1>
              <p className="text-muted-foreground text-lg">
                Tu turno ha sido confirmado por el profesional.
              </p>
            </>
          ) : isCancelled ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Turno Cancelado</h1>
              <p className="text-muted-foreground text-lg">
                Este turno ha sido cancelado.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">¡Turno Solicitado!</h1>
              <p className="text-muted-foreground text-lg">
                Tu solicitud fue enviada. El profesional confirmará tu turno pronto.
              </p>
            </>
          )}
        </div>

        {/* Alerta informativa */}
        {isPending && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Pendiente de confirmación</p>
                  <p className="text-sm text-amber-700 mt-1">
                    El profesional revisará tu solicitud y confirmará el turno. 
                    Te enviaremos un email cuando esté confirmado.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {isConfirmed && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Calendar className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Turno confirmado</p>
                  <p className="text-sm text-green-700 mt-1">
                    Tu turno ha sido confirmado. Te esperamos en la fecha y hora acordada.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detalles del Turno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Profesional:</span>
                <p className="font-medium">{professionalName}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Fecha y Hora Solicitada:</span>
                <p className="font-medium">
                  {format(startAt, "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })} - {format(endAt, 'HH:mm')}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Modalidad:</span>
                <p className="font-medium">{appointment.modality === 'online' ? '💻 Online' : '🏢 Presencial'}</p>
              </div>
              {appointment.locationLabel && (
                <div>
                  <span className="text-sm text-muted-foreground">Ubicación:</span>
                  <p className="font-medium">{appointment.locationLabel}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full bg-green-50 hover:bg-green-100 border-green-300 text-green-700">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contactar al Profesional por WhatsApp
                  </Button>
                </a>
              )}
              <Link href={`/turnos/cancelar/?token=${appointment.cancelToken}`}>
                <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50">
                  <X className="mr-2 h-4 w-4" />
                  Cancelar Solicitud
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              <strong>¿Necesitás coordinar algo?</strong> Podés contactar al profesional directamente 
              por WhatsApp para consultar sobre el turno o cualquier duda que tengas.
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline">Volver al Inicio</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
