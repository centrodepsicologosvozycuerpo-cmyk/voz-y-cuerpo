'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { API_URL } from '@/lib/api'

export function ConfigTab() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleRunReminders = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`${API_URL}/api/cron/reminders`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Error al ejecutar recordatorios')
      }

      const data = await response.json()
      setResult(`Recordatorios procesados: ${data.reminders24h.sent} de 24h, ${data.reminders2h.sent} de 2h`)
    } catch (error) {
      setResult('Error al ejecutar recordatorios')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
          <CardDescription>
            Ajustes globales del sistema de turnos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Ventana de Cancelación</h4>
              <p className="text-sm text-muted-foreground">
                Los pacientes pueden cancelar turnos hasta 12 horas antes del horario programado.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Recordatorios Automáticos</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Los recordatorios se envían automáticamente 24 horas y 2 horas antes del turno.
              </p>
              <Button onClick={handleRunReminders} disabled={loading}>
                {loading ? 'Ejecutando...' : 'Ejecutar Recordatorios (Demo)'}
              </Button>
              {result && (
                <p className="text-sm mt-2 text-muted-foreground">{result}</p>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Nota sobre Producción</h4>
              <p className="text-sm text-muted-foreground">
                En producción, los recordatorios deben ejecutarse mediante un cron job real 
                (Vercel Cron, server cron, etc.) y no manualmente desde este panel.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



