import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { getAvailableSlots } from '../lib/availability'
import { startOfDay, addDays, format, setHours, setMinutes, addMinutes } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const prisma = new PrismaClient()
const TIMEZONE = 'America/Argentina/Buenos_Aires'

async function main() {
  console.log('🔍 DEBUG: Día sin slots\n')

  const professional = await prisma.professional.findFirst({
    where: { slug: 'nombre1-apellido1' },
    include: {
      availabilityRules: {
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
      exceptionDates: true,
      appointments: {
        where: {
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        take: 10,
      },
    },
  })

  if (!professional) {
    console.log('❌ Profesional no encontrado')
    return
  }

  // Buscar un día que debería tener slots pero no los tiene
  // Por ejemplo, un Martes, Miércoles o Jueves
  const from = startOfDay(new Date())
  const to = addDays(from, 14)
  
  const slots = await getAvailableSlots(professional.id, from, to)
  
  // Agrupar por fecha
  const slotsByDate: Record<string, any[]> = {}
  slots.forEach((slot) => {
    const localDate = utcToZonedTime(slot.startAt, TIMEZONE)
    const dateKey = format(localDate, 'yyyy-MM-dd')
    if (!slotsByDate[dateKey]) {
      slotsByDate[dateKey] = []
    }
    slotsByDate[dateKey].push(slot)
  })

  console.log('📅 Días con y sin slots (próximos 14 días):\n')
  const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  
  let currentDate = new Date(from)
  for (let i = 0; i < 14; i++) {
    const localDate = utcToZonedTime(currentDate, TIMEZONE)
    const dateKey = format(localDate, 'yyyy-MM-dd')
    const dayOfWeek = localDate.getDay()
    const daySlots = slotsByDate[dateKey] || []
    
    const rules = professional.availabilityRules.filter((r) => r.dayOfWeek === dayOfWeek)
    const shouldHave = rules.length > 0
    
    const exception = professional.exceptionDates.find((ex) => {
      const exLocal = utcToZonedTime(ex.date, TIMEZONE)
      return format(exLocal, 'yyyy-MM-dd') === dateKey
    })
    
    const hasSlots = daySlots.length > 0
    const status = shouldHave ? (hasSlots ? '✅' : '❌ SIN SLOTS') : (hasSlots ? '⚠️ NO DEBERÍA' : '✅')
    
    console.log(`${status} ${DAYS[dayOfWeek]} ${format(localDate, 'dd/MM')}: ${daySlots.length} slots`)
    
    if (shouldHave && !hasSlots) {
      console.log(`   🔍 ANALIZANDO POR QUÉ NO HAY SLOTS:`)
      console.log(`      - Reglas para ${DAYS[dayOfWeek]}: ${rules.length}`)
      rules.forEach((rule) => {
        console.log(`        * ${rule.startTime} - ${rule.endTime} (slot: ${rule.slotMinutes}min, buffer: ${rule.bufferMinutes}min)`)
      })
      
      if (exception) {
        console.log(`      - Excepción: ${exception.isUnavailable ? 'DÍA COMPLETO NO DISPONIBLE' : 'BLOQUEO PARCIAL'}`)
        if (!exception.isUnavailable && exception.startTime && exception.endTime) {
          console.log(`        Bloqueo: ${exception.startTime} - ${exception.endTime}`)
        }
      }
      
      // Simular cálculo manual para este día
      const now = utcToZonedTime(new Date(), TIMEZONE)
      console.log(`      - Ahora: ${format(now, 'dd/MM/yyyy HH:mm:ss')}`)
      
      for (const rule of rules) {
        const [startHour, startMin] = rule.startTime.split(':').map(Number)
        const [endHour, endMin] = rule.endTime.split(':').map(Number)
        
        let slotStart = setMinutes(setHours(localDate, startHour), startMin)
        let slotEnd = setMinutes(setHours(localDate, endHour), endMin)
        
        console.log(`      - Rango: ${format(slotStart, 'HH:mm')} - ${format(slotEnd, 'HH:mm')}`)
        
        let slotCount = 0
        let excludedPast = 0
        let excludedOccupied = 0
        
        while (slotStart < slotEnd) {
          const slotEndTime = addMinutes(slotStart, rule.slotMinutes)
          if (slotEndTime > slotEnd) break
          
          const isPast = slotStart.getTime() <= now.getTime()
          const isOccupied = professional.appointments.some((apt) => {
            const aptStart = utcToZonedTime(apt.startAt, TIMEZONE)
            const aptEnd = utcToZonedTime(apt.endAt, TIMEZONE)
            return (slotStart >= aptStart && slotStart < aptEnd) ||
                   (slotEndTime > aptStart && slotEndTime <= aptEnd) ||
                   (slotStart <= aptStart && slotEndTime >= aptEnd)
          })
          
          if (isPast) excludedPast++
          else if (isOccupied) excludedOccupied++
          else slotCount++
          
          slotStart = addMinutes(slotEndTime, rule.bufferMinutes)
        }
        
        console.log(`        Slots generados: ${slotCount}`)
        console.log(`        Excluidos (pasado): ${excludedPast}`)
        console.log(`        Excluidos (ocupados): ${excludedOccupied}`)
      }
    }
    
    currentDate = addDays(currentDate, 1)
  }

  await prisma.$disconnect()
}

main().catch(console.error)


