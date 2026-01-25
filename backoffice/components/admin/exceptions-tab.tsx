'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import type { Professional } from '@/lib/types'

interface ExceptionsTabProps {
  professionals: (Professional & {
    exceptionDates: any[]
  })[]
}

export function ExceptionsTab({ professionals }: ExceptionsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fechas Excepcionales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {professionals.map((prof) => (
              <div key={prof.id}>
                <h3 className="font-semibold mb-3">{prof.fullName}</h3>
                {prof.exceptionDates.length > 0 ? (
                  <div className="space-y-2">
                    {prof.exceptionDates.map((ex) => (
                      <div key={ex.id} className="border rounded-md p-3 text-sm">
                        <p>
                          <strong>{format(new Date(ex.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</strong>
                        </p>
                        <p className="text-muted-foreground">
                          {ex.isUnavailable ? 'Día completo no disponible' : `Bloque: ${ex.startTime} - ${ex.endTime}`}
                        </p>
                        {ex.note && (
                          <p className="text-muted-foreground italic">Nota: {ex.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No hay excepciones configuradas</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


