'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Plus, Trash2, Copy, X } from 'lucide-react'
import { format, addDays, startOfDay } from 'date-fns'
import es from 'date-fns/locale/es'
import { utcToZonedTime } from 'date-fns-tz'
import { API_URL } from '@/lib/api'
import { authFetch } from '@/lib/auth-client'
import { useToast } from '@/hooks/use-toast'

const TIMEZONE = 'America/Argentina/Buenos_Aires'

interface OverridesTabProps {
  professionalId: string
}

interface OverrideRange {
  startTime: string
  endTime: string
  modality?: string | null
  locationLabel?: string | null
}

interface Override {
  id: string
  date: string
  isUnavailable: boolean
  slotMinutes: number
  bufferMinutes: number
  ranges: OverrideRange[]
}

export function OverridesTab({ professionalId }: OverridesTabProps) {
  const { toast } = useToast()
  const [overrides, setOverrides] = useState<Override[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingOverride, setEditingOverride] = useState<Override | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [isUnavailable, setIsUnavailable] = useState(false)
  const [slotMinutes, setSlotMinutes] = useState(50)
  const [bufferMinutes, setBufferMinutes] = useState(10)
  const [ranges, setRanges] = useState<OverrideRange[]>([])

  useEffect(() => {
    loadOverrides()
  }, [professionalId])

  const loadOverrides = async () => {
    try {
      const from = startOfDay(new Date())
      const to = addDays(from, 90)
      const res = await authFetch(
        `${API_URL}/api/panel/overrides?from=${from.toISOString()}&to=${to.toISOString()}`
      )
      if (res.ok) {
        const data = await res.json()
        setOverrides(
          data.overrides.map((ov: any) => ({
            ...ov,
            date: ov.date,
          }))
        )
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Error al cargar días especiales' }))
        toast({
          title: 'Error',
          description: errorData.error || 'No se pudieron cargar los días especiales',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error loading overrides:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar los días especiales',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadWeeklyRulesForDate = async (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const localDate = utcToZonedTime(date, TIMEZONE)
      const dayOfWeek = localDate.getDay()

      const res = await authFetch(`${API_URL}/api/panel/availability`)
      if (res.ok) {
        const data = await res.json()
        const rulesForDay = (data.rules || []).filter((r: any) => r.dayOfWeek === dayOfWeek)
        
        if (rulesForDay.length > 0) {
          const copiedRanges: OverrideRange[] = rulesForDay.map((rule: any) => ({
            startTime: rule.startTime,
            endTime: rule.endTime,
            modality: rule.modality || null,
            locationLabel: rule.locationLabel || null,
          }))
          setRanges(copiedRanges)
          setSlotMinutes(rulesForDay[0].slotMinutes || 50)
          setBufferMinutes(rulesForDay[0].bufferMinutes || 10)
          toast({
            title: 'Horarios copiados',
            description: `Se copiaron ${rulesForDay.length} regla(s) del horario semanal`,
          })
        } else {
          toast({
            title: 'Sin reglas',
            description: 'No hay reglas de horario semanal para este día',
            variant: 'default',
          })
        }
      }
    } catch (error) {
      console.error('Error loading weekly rules:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar las reglas semanales',
        variant: 'destructive',
      })
    }
  }

  const handleSave = async () => {
    try {
      const payload: any = {
        date: selectedDate,
        isUnavailable,
        slotMinutes,
        bufferMinutes,
      }

      if (!isUnavailable) {
        payload.ranges = ranges
      }

      const url = editingOverride
        ? `${API_URL}/api/panel/overrides/${editingOverride.id}`
        : `${API_URL}/api/panel/overrides`
      const method = editingOverride ? 'PUT' : 'POST'

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast({
          title: 'Éxito',
          description: editingOverride ? 'Día especial actualizado correctamente' : 'Día especial creado correctamente',
        })
        resetForm()
        loadOverrides()
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Error al guardar' }))
        toast({
          title: 'Error',
          description: errorData.error || 'No se pudo guardar el día especial',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving override:', error)
      toast({
        title: 'Error',
        description: 'Error al guardar el día especial',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este día especial?')) {
      return
    }

    try {
      const res = await authFetch(`${API_URL}/api/panel/overrides/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({
          title: 'Éxito',
          description: 'Día especial eliminado correctamente',
        })
        loadOverrides()
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Error al eliminar' }))
        toast({
          title: 'Error',
          description: errorData.error || 'No se pudo eliminar el día especial',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting override:', error)
      toast({
        title: 'Error',
        description: 'Error al eliminar el día especial',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (override: Override) => {
    const dateLocal = utcToZonedTime(new Date(override.date), TIMEZONE)
    setSelectedDate(format(dateLocal, 'yyyy-MM-dd'))
    setIsUnavailable(override.isUnavailable)
    setSlotMinutes(override.slotMinutes)
    setBufferMinutes(override.bufferMinutes)
    setRanges(override.ranges || [])
    setEditingOverride(override)
    setShowForm(true)
  }

  const resetForm = () => {
    setSelectedDate('')
    setIsUnavailable(false)
    setSlotMinutes(50)
    setBufferMinutes(10)
    setRanges([])
    setEditingOverride(null)
    setShowForm(false)
  }

  const addRange = () => {
    setRanges([...ranges, { startTime: '09:00', endTime: '18:00' }])
  }

  const updateRange = (index: number, updates: Partial<OverrideRange>) => {
    const newRanges = [...ranges]
    newRanges[index] = { ...newRanges[index], ...updates }
    setRanges(newRanges)
  }

  const removeRange = (index: number) => {
    setRanges(ranges.filter((_, i) => i !== index))
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Días Especiales
              </CardTitle>
              <CardDescription>
                Configurá horarios específicos para fechas particulares o marcá días como no disponibles
              </CardDescription>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Día Especial
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="border rounded-lg p-4 mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {editingOverride ? 'Editar Día Especial' : 'Nuevo Día Especial'}
                </h3>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    if (e.target.value) {
                      loadWeeklyRulesForDate(e.target.value)
                    }
                  }}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isUnavailable"
                  checked={isUnavailable}
                  onChange={(e) => {
                    setIsUnavailable(e.target.checked)
                    if (e.target.checked) {
                      setRanges([])
                    }
                  }}
                  className="h-4 w-4"
                />
                <Label htmlFor="isUnavailable" className="cursor-pointer">
                  Día completo no disponible
                </Label>
              </div>

              {!isUnavailable && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Duración del turno (min)</Label>
                      <Input
                        type="number"
                        value={slotMinutes}
                        onChange={(e) => setSlotMinutes(parseInt(e.target.value) || 50)}
                      />
                    </div>
                    <div>
                      <Label>Buffer entre turnos (min)</Label>
                      <Input
                        type="number"
                        value={bufferMinutes}
                        onChange={(e) => setBufferMinutes(parseInt(e.target.value) || 10)}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Rangos Horarios</Label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={loadWeeklyRulesForDate.bind(null, selectedDate)}
                          disabled={!selectedDate}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar desde horario semanal
                        </Button>
                        <Button size="sm" variant="outline" onClick={addRange}>
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar Rango
                        </Button>
                      </div>
                    </div>

                    {ranges.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No hay rangos configurados. Agregá al menos uno o marcá el día como no disponible.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {ranges.map((range, index) => (
                          <div key={index} className="flex gap-3 items-end p-3 bg-muted rounded-md">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div>
                                <Label>Desde</Label>
                                <Input
                                  type="time"
                                  value={range.startTime}
                                  onChange={(e) => updateRange(index, { startTime: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Hasta</Label>
                                <Input
                                  type="time"
                                  value={range.endTime}
                                  onChange={(e) => updateRange(index, { endTime: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Modalidad (opcional)</Label>
                                <Input
                                  type="text"
                                  placeholder="online, presencial"
                                  value={range.modality || ''}
                                  onChange={(e) => updateRange(index, { modality: e.target.value || null })}
                                />
                              </div>
                              <div>
                                <Label>Ubicación (opcional)</Label>
                                <Input
                                  type="text"
                                  placeholder="CABA, Zona Norte"
                                  value={range.locationLabel || ''}
                                  onChange={(e) => updateRange(index, { locationLabel: e.target.value || null })}
                                />
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeRange(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={!selectedDate || (!isUnavailable && ranges.length === 0)}>
                  {editingOverride ? 'Actualizar' : 'Guardar'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold">Días Especiales Configurados</h3>
            {overrides.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay días especiales configurados</p>
            ) : (
              <div className="space-y-2">
                {overrides.map((override) => {
                  const dateLocal = utcToZonedTime(new Date(override.date), TIMEZONE)
                  return (
                    <div key={override.id} className="border rounded-md p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">
                            {format(dateLocal, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                          </p>
                          {override.isUnavailable ? (
                            <p className="text-sm text-destructive">Día completo no disponible</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {override.ranges.length} rango(s) | Slot: {override.slotMinutes}min | Buffer: {override.bufferMinutes}min
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(override)}>
                            Editar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(override.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {!override.isUnavailable && override.ranges.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {override.ranges.map((range, idx) => (
                            <p key={idx} className="text-sm text-muted-foreground">
                              • {range.startTime} - {range.endTime}
                              {range.modality && ` (${range.modality})`}
                              {range.locationLabel && ` - ${range.locationLabel}`}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

