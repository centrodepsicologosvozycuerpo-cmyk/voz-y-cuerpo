'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { AppointmentForm } from '@/components/appointment-form'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

interface Professional {
  id: string
  fullName: string
  title: string
  isActive: boolean
}

export function ConfirmarTurnoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const professionalId = searchParams.get('professionalId')
  const startAt = searchParams.get('startAt')
  const modality = searchParams.get('modality')
  
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!professionalId || !startAt || !modality) {
      router.push('/turnos/')
      return
    }
    
    fetch(`${API_URL}/api/professionals/${professionalId}`)
      .then(res => {
        if (!res.ok) throw new Error('Profesional no encontrado')
        return res.json()
      })
      .then(data => {
        const prof = data.professional || data
        if (!prof || !prof.isActive) {
          setError('Profesional no encontrado o inactivo')
        } else {
          setProfessional(prof)
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [professionalId, startAt, modality, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !professional || !professionalId || !startAt || !modality) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error || 'Datos inválidos'}</p>
            <Link href="/turnos/">
              <Button className="w-full mt-4">Volver a turnos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const slotStart = new Date(startAt)
  const slotEnd = new Date(slotStart.getTime() + 50 * 60 * 1000)

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Confirmar Turno</h1>
          <p className="text-muted-foreground">
            Completá tus datos para confirmar la reserva
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Resumen del Turno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Profesional:</span>
                <p className="font-medium">{professional.fullName}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Fecha y Hora:</span>
                <p className="font-medium">
                  {format(slotStart, "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })} - {format(slotEnd, 'HH:mm')}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Modalidad:</span>
                <div className="mt-1">
                  <Chip>{modality === 'online' ? 'Online' : 'Presencial'}</Chip>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <AppointmentForm
          professionalId={professionalId}
          startAt={slotStart.toISOString()}
          modality={modality}
        />
      </div>
    </div>
  )
}

