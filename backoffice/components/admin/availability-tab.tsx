'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Professional } from '@/lib/types'

interface AvailabilityTabProps {
  professionals: (Professional & {
    availabilityRules: any[]
  })[]
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function AvailabilityTab({ professionals }: AvailabilityTabProps) {
  return (
    <div className="space-y-6">
      {professionals.map((prof) => {
        const rulesByDay: Record<number, any[]> = {}
        prof.availabilityRules.forEach((rule) => {
          if (!rulesByDay[rule.dayOfWeek]) {
            rulesByDay[rule.dayOfWeek] = []
          }
          rulesByDay[rule.dayOfWeek].push(rule)
        })

        return (
          <Card key={prof.id}>
            <CardHeader>
              <CardTitle>{prof.fullName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(rulesByDay).map(([day, rules]) => (
                  <div key={day} className="border rounded-md p-4">
                    <h4 className="font-semibold mb-2">{DAYS[parseInt(day)]}</h4>
                    {rules.map((rule, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        <p>
                          {rule.startTime} - {rule.endTime} | 
                          Slot: {rule.slotMinutes} min | 
                          Buffer: {rule.bufferMinutes} min
                          {rule.modality && ` | Modalidad: ${rule.modality}`}
                          {rule.locationLabel && ` | Ubicación: ${rule.locationLabel}`}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
                {Object.keys(rulesByDay).length === 0 && (
                  <p className="text-muted-foreground text-sm">No hay reglas de disponibilidad configuradas</p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}



