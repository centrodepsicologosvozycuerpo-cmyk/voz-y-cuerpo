'use client'

import { useState, useMemo, useEffect } from 'react'
import { format, addDays, startOfDay, isSameDay, parseISO } from 'date-fns'
import es from 'date-fns/locale/es'
import { utcToZonedTime, formatInTimeZone } from 'date-fns-tz'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Calendar, Clock, RefreshCw } from 'lucide-react'
import Link from 'next/link'

const TIMEZONE = 'America/Argentina/Buenos_Aires'

// Tipo local para Professional (sin dependencia de Prisma)
interface Professional {
  id: string
  slug: string
  fullName: string
  title: string
  isActive: boolean
}

interface AvailableSlot {
  startAt: Date | string
  endAt: Date | string
  modality: string
  locationLabel?: string
}

interface CalendarSlotPickerProps {
  professional: Professional
  initialSlots: AvailableSlot[]
  modalities: string[]
}

export function CalendarSlotPicker({ professional, initialSlots, modalities }: CalendarSlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedModality, setSelectedModality] = useState<string | null>(null)
  const [slots, setSlots] = useState<AvailableSlot[]>(initialSlots)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Recargar slots desde el servidor
  const reloadSlots = async () => {
    setLoading(true)
    setError(null)
    try {
      const from = startOfDay(new Date())
      const to = addDays(from, 21)
      const fromISO = from.toISOString()
      const toISO = to.toISOString()
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
      const res = await fetch(
        `${API_URL}/api/availability?professionalSlug=${professional.slug}&from=${fromISO}&to=${toISO}${selectedModality ? `&modality=${selectedModality}` : ''}`
      )
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Error al cargar disponibilidad' }))
        throw new Error(errorData.error || errorData.details || `Error ${res.status}: ${res.statusText}`)
      }
      
      const data = await res.json()
      const parsedSlots = (data.slots || []).map((slot: any) => ({
        startAt: new Date(slot.startAt),
        endAt: new Date(slot.endAt),
        modality: slot.modality,
        locationLabel: slot.locationLabel,
      }))
      setSlots(parsedSlots)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar disponibilidad'
      console.error('Error reloading slots:', errorMessage, error)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Cargar slots inicialmente si no hay slots iniciales
  useEffect(() => {
    if (initialSlots.length === 0) {
      reloadSlots()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recargar cuando cambia la modalidad seleccionada
  useEffect(() => {
    if (selectedModality !== null) {
      reloadSlots()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModality])

  // Agrupar slots por fecha exacta (usando timezone BA)
  const slotsByDate = useMemo(() => {
    const grouped: Record<string, AvailableSlot[]> = {}
    
    slots.forEach((slot) => {
      // Asegurar que startAt es un Date
      const startDate = slot.startAt instanceof Date ? slot.startAt : new Date(slot.startAt)
      // Usar formatInTimeZone para obtener la fecha exacta en timezone BA
      const dateKey = formatInTimeZone(startDate, TIMEZONE, 'yyyy-MM-dd')
      
      if (!selectedModality || slot.modality === selectedModality) {
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push({
          ...slot,
          startAt: startDate,
          endAt: slot.endAt instanceof Date ? slot.endAt : new Date(slot.endAt),
        })
      }
    })

    return grouped
  }, [slots, selectedModality])

  // Calcular el máximo de turnos disponibles en cualquier día para determinar "la mitad"
  const maxSlotsPerDay = useMemo(() => {
    const counts = Object.values(slotsByDate).map(slots => slots.length)
    return counts.length > 0 ? Math.max(...counts) : 0
  }, [slotsByDate])
  
  const halfSlots = Math.ceil(maxSlotsPerDay / 2)

  // Generar próximos 21 días
  // IMPORTANTE: Usar la misma zona horaria que los slots para evitar desajustes
  const upcomingDays = useMemo(() => {
    const days: Date[] = []
    const today = new Date()
    const todayLocal = utcToZonedTime(today, TIMEZONE)
    const todayStart = startOfDay(todayLocal)
    for (let i = 0; i < 21; i++) {
      days.push(addDays(todayStart, i))
    }
    return days
  }, [])

  // Construir grilla de calendario alineada con header (Dom=0, Lun=1, ..., Sáb=6)
  // Cada celda debe estar en la columna correcta según su día de la semana
  const calendarGrid = useMemo(() => {
    const grid: (Date | null)[] = []
    
    // Calcular el día de la semana del primer día
    const firstDay = upcomingDays[0]
    const firstDayLocal = utcToZonedTime(firstDay, TIMEZONE)
    const firstDayOfWeek = firstDayLocal.getDay() // 0=Dom, 1=Lun, ..., 6=Sáb
    
    // Agregar celdas vacías al inicio si el primer día no es domingo
    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push(null)
    }
    
    // Agregar todos los días
    upcomingDays.forEach((day) => {
      grid.push(day)
    })
    
    // Completar la última semana con celdas vacías si es necesario
    const remainingCells = grid.length % 7
    if (remainingCells !== 0) {
      const cellsToAdd = 7 - remainingCells
      for (let i = 0; i < cellsToAdd; i++) {
        grid.push(null)
      }
    }
    
    return grid
  }, [upcomingDays])

  const selectedDateSlots = selectedDate
    ? slotsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Seleccionar Fecha y Hora</CardTitle>
            <CardDescription>
              Elegí la modalidad y luego seleccioná una fecha disponible
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={reloadSlots}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Mensaje de error */}
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {/* Filtro de modalidad */}
          {modalities.length > 1 && (
            <div>
              <h3 className="font-semibold mb-3">Modalidad</h3>
              <div className="flex gap-2">
                <Button
                  variant={selectedModality === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedModality(null)}
                >
                  Todas
                </Button>
                {modalities.map((mod) => (
                  <Button
                    key={mod}
                    variant={selectedModality === mod ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedModality(mod)}
                  >
                    {mod === 'online' ? 'Online' : 'Presencial'}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Calendario semanal */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fechas Disponibles
            </h3>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarGrid.map((day, cellIndex) => {
                if (!day) {
                  // Celda vacía para alinear la semana
                  return <div key={`empty-${cellIndex}`} className="aspect-square" />
                }
                
                // Calcular fecha exacta en timezone BA
                const dayLocal = utcToZonedTime(day, TIMEZONE)
                const dateKey = formatInTimeZone(day, TIMEZONE, 'yyyy-MM-dd')
                const dayOfWeek = dayLocal.getDay() // 0=Dom, 1=Lun, ..., 6=Sáb
                const columnIndex = cellIndex % 7 // Índice de columna (0-6)
                
                // ASSERT: Verificar alineación (solo en dev)
                if (process.env.NODE_ENV === 'development') {
                  // Para 2025-12-24 (Miércoles, día 3)
                  if (dateKey === '2025-12-24' && columnIndex !== 3) {
                    console.warn(`[CALENDAR ALIGNMENT] 2025-12-24 (Mié, dayOfWeek=3) está en columna ${columnIndex}, debería estar en 3`)
                  }
                  // Para 2025-12-25 (Jueves, día 4)
                  if (dateKey === '2025-12-25' && columnIndex !== 4) {
                    console.warn(`[CALENDAR ALIGNMENT] 2025-12-25 (Jue, dayOfWeek=4) está en columna ${columnIndex}, debería estar en 4`)
                  }
                  // Verificar que dayOfWeek coincide con columnIndex
                  if (dayOfWeek !== columnIndex) {
                    console.warn(`[CALENDAR ALIGNMENT] ${dateKey} tiene dayOfWeek=${dayOfWeek} pero está en columna ${columnIndex}`)
                  }
                }
                
                const hasSlots = slotsByDate[dateKey]?.length > 0
                const slotCount = slotsByDate[dateKey]?.length || 0
                const isSelected = selectedDate && isSameDay(dayLocal, selectedDate)
                const isToday = isSameDay(dayLocal, utcToZonedTime(new Date(), TIMEZONE))
                
                // Determinar el color según la cantidad de turnos disponibles
                let dayColorClasses = ''
                let textColorClasses = ''
                if (!isSelected && hasSlots) {
                  if (slotCount === 1) {
                    // 1 turno: color rosa
                    dayColorClasses = 'bg-pink-100 hover:bg-pink-200 text-pink-800 border-pink-300'
                    textColorClasses = 'text-pink-700'
                  } else if (slotCount < halfSlots) {
                    // Menos de la mitad: color amarillo
                    dayColorClasses = 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300'
                    textColorClasses = 'text-yellow-700'
                  } else {
                    // Más de la mitad: color verde
                    dayColorClasses = 'bg-green-100 hover:bg-green-200 text-green-800 border-green-300'
                    textColorClasses = 'text-green-700'
                  }
                }

                return (
                  <button
                    key={dateKey}
                    onClick={() => hasSlots && setSelectedDate(dayLocal)}
                    disabled={!hasSlots}
                    className={`
                      aspect-square rounded-md border p-2 text-sm transition-colors
                      ${isSelected ? 'bg-primary text-primary-foreground border-primary' : ''}
                      ${dayColorClasses}
                      ${!hasSlots ? 'opacity-50 cursor-not-allowed' : ''}
                      ${isToday && !isSelected && hasSlots && slotCount === 1 ? 'border-pink-400 ring-2 ring-pink-200' : ''}
                      ${isToday && !isSelected && hasSlots && slotCount < halfSlots && slotCount > 1 ? 'border-yellow-400 ring-2 ring-yellow-200' : ''}
                      ${isToday && !isSelected && hasSlots && slotCount >= halfSlots ? 'border-green-400 ring-2 ring-green-200' : ''}
                      ${isToday && !isSelected && !hasSlots ? 'border-primary/50' : ''}
                    `}
                  >
                    <div className="font-medium">{format(dayLocal, 'd')}</div>
                    {hasSlots && (
                      <div className={`text-xs mt-1 ${textColorClasses} font-semibold`}>
                        {slotCount} {slotCount === 1 ? 'turno' : 'turnos'}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Horarios disponibles para la fecha seleccionada */}
          {selectedDate && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horarios Disponibles - {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
              </h3>
              {selectedDateSlots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {selectedDateSlots
                    .sort((a, b) => {
                      const aStart = a.startAt instanceof Date ? a.startAt : new Date(a.startAt)
                      const bStart = b.startAt instanceof Date ? b.startAt : new Date(b.startAt)
                      return aStart.getTime() - bStart.getTime()
                    })
                    .map((slot) => {
                      const startDate = slot.startAt instanceof Date ? slot.startAt : new Date(slot.startAt)
                      const endDate = slot.endAt instanceof Date ? slot.endAt : new Date(slot.endAt)
                      const localStart = utcToZonedTime(startDate, TIMEZONE)
                      const localEnd = utcToZonedTime(endDate, TIMEZONE)
                      const timeStr = `${format(localStart, 'HH:mm')} - ${format(localEnd, 'HH:mm')}`
                      
                      const params = new URLSearchParams({
                        professionalId: professional.id,
                        startAt: startDate.toISOString(),
                        modality: slot.modality,
                      })

                      return (
                        <Link key={startDate.toISOString()} href={`/turnos/confirmar?${params.toString()}`}>
                          <Button variant="outline" className="w-full h-auto py-3 flex flex-col">
                            <span className="font-medium">{timeStr}</span>
                            <Chip variant="secondary" className="mt-1 text-xs">
                              {slot.modality === 'online' ? 'Online' : 'Presencial'}
                            </Chip>
                            {slot.locationLabel && (
                              <span className="text-xs text-muted-foreground mt-1">{slot.locationLabel}</span>
                            )}
                          </Button>
                        </Link>
                      )
                    })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No hay turnos disponibles para esta fecha. Por favor, seleccioná otra fecha.
                </p>
              )}
            </div>
          )}

          {!selectedDate && (
            <p className="text-muted-foreground text-center py-8">
              Seleccioná una fecha del calendario para ver los horarios disponibles.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

