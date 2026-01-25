'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Plus, Trash2 } from 'lucide-react'
import { API_URL } from '@/lib/api'
import { authFetch } from '@/lib/auth-client'

interface CalendarTabProps {
  professionalId: string
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function CalendarTab({ professionalId }: CalendarTabProps) {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRules()
  }, [professionalId])

  const loadRules = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/panel/availability`)
      if (res.ok) {
        const data = await res.json()
        setRules(data.rules || [])
      }
    } catch (error) {
      console.error('Error loading rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const addRule = async (dayOfWeek: number) => {
    try {
      const res = await authFetch(`${API_URL}/api/panel/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek,
          startTime: '09:00',
          endTime: '18:00',
          slotMinutes: 50,
          bufferMinutes: 10,
        }),
      })

      if (res.ok) {
        loadRules()
      } else {
        const errorData = await res.json()
        console.error('Error adding rule:', errorData)
      }
    } catch (error) {
      console.error('Error adding rule:', error)
    }
  }

  const updateRule = async (ruleId: string, updates: any) => {
    try {
      const res = await authFetch(`${API_URL}/api/panel/availability/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (res.ok) {
        loadRules()
      } else {
        const errorData = await res.json()
        console.error('Error updating rule:', errorData)
      }
    } catch (error) {
      console.error('Error updating rule:', error)
    }
  }

  const deleteRule = async (ruleId: string) => {
    try {
      const res = await authFetch(`${API_URL}/api/panel/availability/${ruleId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        loadRules()
      } else {
        const errorData = await res.json()
        console.error('Error deleting rule:', errorData)
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  const rulesByDay: Record<number, any[]> = {}
  rules.forEach((rule) => {
    if (!rulesByDay[rule.dayOfWeek]) {
      rulesByDay[rule.dayOfWeek] = []
    }
    rulesByDay[rule.dayOfWeek].push(rule)
  })

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Disponibilidad Semanal
          </CardTitle>
          <CardDescription>
            Configurá tus horarios de atención por día de la semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <div key={day} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{DAYS[day]}</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addRule(day)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Rango
                  </Button>
                </div>

                {rulesByDay[day]?.length > 0 ? (
                  <div className="space-y-3">
                    {rulesByDay[day].map((rule) => (
                      <div key={rule.id} className="flex gap-3 items-end p-3 bg-muted rounded-md">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <Label>Desde</Label>
                            <Input
                              type="time"
                              value={rule.startTime}
                              onChange={(e) =>
                                updateRule(rule.id, { startTime: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <Label>Hasta</Label>
                            <Input
                              type="time"
                              value={rule.endTime}
                              onChange={(e) =>
                                updateRule(rule.id, { endTime: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <Label>Duración (min)</Label>
                            <Input
                              type="number"
                              value={rule.slotMinutes}
                              onChange={(e) =>
                                updateRule(rule.id, { slotMinutes: parseInt(e.target.value) })
                              }
                            />
                          </div>
                          <div>
                            <Label>Buffer (min)</Label>
                            <Input
                              type="number"
                              value={rule.bufferMinutes}
                              onChange={(e) =>
                                updateRule(rule.id, { bufferMinutes: parseInt(e.target.value) })
                              }
                            />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay horarios configurados</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


