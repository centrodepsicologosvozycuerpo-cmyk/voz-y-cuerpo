'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CancelTurnoFormProps {
  cancelToken: string
}

export function CancelTurnoForm({ cancelToken }: CancelTurnoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleCancel = async () => {
    setLoading(true)
    setError(null)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
      const response = await fetch(`${API_URL}/api/appointments/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelToken }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cancelar el turno')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar el turno')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="border-green-500 bg-green-50 dark:bg-green-950">
        <CardContent className="pt-6">
          <p className="text-center font-medium text-green-900 dark:text-green-100">
            Turno cancelado exitosamente. Serás redirigido al inicio...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirmar Cancelación</CardTitle>
        <CardDescription>
          ¿Estás seguro de que querés cancelar este turno?
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Al cancelar, el horario quedará disponible para otros pacientes. 
            Si necesitás reprogramar, podés reservar un nuevo turno.
          </p>

          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Cancelando...' : 'Sí, cancelar turno'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              disabled={loading}
              className="flex-1"
            >
              No, mantener turno
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



