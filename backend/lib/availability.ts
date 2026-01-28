import { format, addDays, startOfDay, isSameDay, addMinutes, setHours, setMinutes, differenceInMinutes } from 'date-fns'
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz'
import { prisma } from './prisma'

const TIMEZONE = 'America/Argentina/Buenos_Aires'

export interface AvailableSlot {
  startAt: Date
  endAt: Date
  modality: string
  locationLabel?: string
}

function extendRangeIfNeeded(
  start: Date,
  end: Date,
  slotMinutes: number
): Date {
  const duration = differenceInMinutes(end, start)
  const slots = Math.floor(duration / slotMinutes)
  const requiredDuration = slots * slotMinutes
  
  if (duration > requiredDuration && duration < requiredDuration + slotMinutes) {
    return addMinutes(start, requiredDuration + slotMinutes)
  }
  
  return end
}

export async function getAvailableSlots(
  professionalId: string,
  from: Date,
  to: Date,
  modality?: string
): Promise<AvailableSlot[]> {
  try {
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      include: {
        availabilityRules: true,
        exceptionDates: true,
        availabilityOverrides: {
          include: {
            ranges: true,
          },
        },
        appointments: {
          where: {
            status: { in: ['PENDING_CONFIRMATION', 'CONFIRMED'] },
            startAt: { gte: from, lte: to },
          },
        },
        slotHolds: {
          where: {
            status: 'HOLD',
            startAt: { gte: from, lte: to },
          },
        },
      },
    })

    if (!professional || !professional.isActive) {
      return []
    }

    // Asegurar que las relaciones estén definidas
    const availabilityRules = professional.availabilityRules || []
    const exceptionDates = professional.exceptionDates || []
    const availabilityOverrides = professional.availabilityOverrides || []
    const appointments = professional.appointments || []
    const slotHolds = professional.slotHolds || []

    const slots: AvailableSlot[] = []
    const now = utcToZonedTime(new Date(), TIMEZONE)
  
    // Convertir 'from' y 'to' a zona horaria local
    const fromLocal = utcToZonedTime(from, TIMEZONE)
    const toLocal = utcToZonedTime(to, TIMEZONE)
    const currentDate = startOfDay(fromLocal)
    const endDate = startOfDay(toLocal)

    // Iterar por cada día en el rango
    // IMPORTANTE: Usar fechas locales directamente, sin convertir de nuevo
    let date = new Date(currentDate)
    while (date <= endDate) {
      // date ya está en zona local (calculado desde fromLocal)
      const localDate = new Date(date)
      const dayOfWeek = localDate.getDay()

      // Verificar excepciones
      const exception = exceptionDates.find((ex) => {
        const exLocal = utcToZonedTime(ex.date, TIMEZONE)
        return isSameDay(exLocal, localDate)
      })

      if (exception && exception.isUnavailable) {
        date = addDays(date, 1)
        continue
      }

      // Verificar override
      const override = availabilityOverrides.find((ov) => {
        const ovLocal = utcToZonedTime(ov.date, TIMEZONE)
        return isSameDay(ovLocal, localDate)
      })

      if (override) {
        // Si el override marca el día como no disponible, saltar
        if (override.isUnavailable) {
          date = addDays(date, 1)
          continue
        }

        // Usar override con rangos
        for (const range of override.ranges) {
          if (modality && range.modality && range.modality !== modality) {
            continue
          }

          const [startHour, startMin] = range.startTime.split(':').map(Number)
          const [endHour, endMin] = range.endTime.split(':').map(Number)

          let slotStart = setMinutes(setHours(localDate, startHour), startMin)
          let slotEnd = setMinutes(setHours(localDate, endHour), endMin)
          
          slotEnd = extendRangeIfNeeded(slotStart, slotEnd, override.slotMinutes)

          while (slotStart < slotEnd) {
            const slotEndTime = addMinutes(slotStart, override.slotMinutes)

            if (slotEndTime > slotEnd) {
              break
            }

            const isOccupied = appointments.some((apt) => {
              const aptStart = utcToZonedTime(apt.startAt, TIMEZONE)
              const aptEnd = utcToZonedTime(apt.endAt, TIMEZONE)
              return (
                (slotStart >= aptStart && slotStart < aptEnd) ||
                (slotEndTime > aptStart && slotEndTime <= aptEnd) ||
                (slotStart <= aptStart && slotEndTime >= aptEnd)
              )
            })

            // Excluir slots reservados (SlotHolds con status HOLD)
            const isReserved = slotHolds.some((hold) => {
              const holdStart = utcToZonedTime(hold.startAt, TIMEZONE)
              const holdEnd = utcToZonedTime(hold.endAt, TIMEZONE)
              return (
                (slotStart >= holdStart && slotStart < holdEnd) ||
                (slotEndTime > holdStart && slotEndTime <= holdEnd) ||
                (slotStart <= holdStart && slotEndTime >= holdEnd)
              )
            })

            const isNotInPast = slotStart.getTime() > now.getTime()
            
            if (!isOccupied && !isReserved && isNotInPast) {
              slots.push({
                startAt: zonedTimeToUtc(slotStart, TIMEZONE),
                endAt: zonedTimeToUtc(slotEndTime, TIMEZONE),
                modality: range.modality || 'online',
                locationLabel: range.locationLabel || undefined,
              })
            }

            slotStart = addMinutes(slotEndTime, override.bufferMinutes)
          }
        }
      } else {
        // Usar reglas semanales
        const rules = availabilityRules.filter(
          (rule) => rule.dayOfWeek === dayOfWeek
        )

        if (rules.length === 0) {
          date = addDays(date, 1)
          continue
        }

        for (const rule of rules) {
          if (modality && rule.modality && rule.modality !== modality) {
            continue
          }

          const [startHour, startMin] = rule.startTime.split(':').map(Number)
          const [endHour, endMin] = rule.endTime.split(':').map(Number)

          let slotStart = setMinutes(setHours(localDate, startHour), startMin)
          let slotEnd = setMinutes(setHours(localDate, endHour), endMin)
          
          if (exception && !exception.isUnavailable && exception.startTime && exception.endTime) {
            const [exStartHour, exStartMin] = exception.startTime.split(':').map(Number)
            const [exEndHour, exEndMin] = exception.endTime.split(':').map(Number)
            const exStart = setMinutes(setHours(localDate, exStartHour), exStartMin)
            const exEnd = setMinutes(setHours(localDate, exEndHour), exEndMin)

            if (slotStart >= exStart && slotStart < exEnd) {
              slotStart = exEnd
            }
          }

          slotEnd = extendRangeIfNeeded(slotStart, slotEnd, rule.slotMinutes)

          while (slotStart < slotEnd) {
            const slotEndTime = addMinutes(slotStart, rule.slotMinutes)

            if (slotEndTime > slotEnd) {
              break
            }

            const isOccupied = appointments.some((apt) => {
              const aptStart = utcToZonedTime(apt.startAt, TIMEZONE)
              const aptEnd = utcToZonedTime(apt.endAt, TIMEZONE)
              return (
                (slotStart >= aptStart && slotStart < aptEnd) ||
                (slotEndTime > aptStart && slotEndTime <= aptEnd) ||
                (slotStart <= aptStart && slotEndTime >= aptEnd)
              )
            })

            // Excluir slots reservados (SlotHolds con status HOLD)
            const isReserved = slotHolds.some((hold) => {
              const holdStart = utcToZonedTime(hold.startAt, TIMEZONE)
              const holdEnd = utcToZonedTime(hold.endAt, TIMEZONE)
              return (
                (slotStart >= holdStart && slotStart < holdEnd) ||
                (slotEndTime > holdStart && slotEndTime <= holdEnd) ||
                (slotStart <= holdStart && slotEndTime >= holdEnd)
              )
            })

            const isNotInPast = slotStart.getTime() > now.getTime()
            
            if (!isOccupied && !isReserved && isNotInPast) {
              slots.push({
                startAt: zonedTimeToUtc(slotStart, TIMEZONE),
                endAt: zonedTimeToUtc(slotEndTime, TIMEZONE),
                modality: rule.modality || 'online',
                locationLabel: rule.locationLabel || undefined,
              })
            }

            slotStart = addMinutes(slotEndTime, rule.bufferMinutes)
          }
        }
      }

      date = addDays(date, 1)
    }

    return slots.sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
  } catch (error) {
    console.error('Error in getAvailableSlots:', error)
    throw error
  }
}

