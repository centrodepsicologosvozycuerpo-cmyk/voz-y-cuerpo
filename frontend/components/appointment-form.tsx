'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AppointmentFormProps {
  professionalId: string
  startAt: string
  modality: string
}

export function AppointmentForm({ professionalId, startAt, modality }: AppointmentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('=== SUBMIT INICIADO ===')
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      professionalId,
      startAt,
      modality,
      clientName: formData.get('clientName') as string,
      clientEmail: formData.get('clientEmail') as string,
      clientPhone: formData.get('clientPhone') as string,
      acceptPolicies: formData.get('acceptPolicies') === 'on',
    }

    console.log('Datos a enviar:', data)

    try {
      const API_URL = 'http://localhost:3002'
      console.log('Haciendo fetch a:', `${API_URL}/api/appointments`)
      
      const response = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear el turno')
      }

      const result = await response.json()
      router.push(`/turnos/exito?id=${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el turno')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de Contacto</CardTitle>
        <CardDescription>
          Completá tus datos para confirmar la reserva
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="clientName">Nombre completo *</Label>
            <Input
              id="clientName"
              name="clientName"
              required
              placeholder="Tu nombre completo"
            />
          </div>

          <div>
            <Label htmlFor="clientEmail">Email *</Label>
            <Input
              id="clientEmail"
              name="clientEmail"
              type="email"
              required
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <Label htmlFor="clientPhone">Teléfono *</Label>
            <Input
              id="clientPhone"
              name="clientPhone"
              type="tel"
              required
              placeholder="+54 11 0000-0000"
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="acceptPolicies"
              name="acceptPolicies"
              required
              className="mt-1"
            />
            <Label htmlFor="acceptPolicies" className="text-sm">
              Acepto las{' '}
              <a href="/politicas" target="_blank" className="text-primary hover:underline">
                políticas de privacidad
              </a>{' '}
              y confirmo que los datos proporcionados son correctos. *
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Confirmando...' : 'Confirmar Reserva'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}



