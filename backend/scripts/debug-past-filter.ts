import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { startOfDay, addDays, format, setHours, setMinutes, addMinutes } from 'date-fns'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'
import { isAfter } from 'date-fns'

const prisma = new PrismaClient()
const TIMEZONE = 'America/Argentina/Buenos_Aires'

async function main() {
  console.log('🔍 DEBUG: Filtro de "pasado"\n')

  const professional = await prisma.professional.findFirst({
    where: { slug: 'nombre1-apellido1' },
    include: {
      availabilityRules: {
        where: { dayOfWeek: 2 }, // Martes
      },
    },
  })

  if (!professional || professional.availabilityRules.length === 0) {
    console.log('❌ No hay reglas para Martes')
    return
  }

  const rule = professional.availabilityRules[0]
  console.log(`Regla Martes: ${rule.startTime} - ${rule.endTime}\n`)

  // Simular cálculo para el próximo martes
  const from = startOfDay(new Date())
  const to = addDays(from, 7)
  
  let date = new Date(from)
  const now = utcToZonedTime(new Date(), TIMEZONE)
  
  console.log(`Ahora (local): ${format(now, 'dd/MM/yyyy HH:mm:ss')}\n`)

  while (date <= to) {
    const localDate = utcToZonedTime(date, TIMEZONE)
    const dayOfWeek = localDate.getDay()
    
    if (dayOfWeek === 2) { // Martes
      console.log(`\n📅 Fecha: ${format(localDate, 'dd/MM/yyyy')} (${dayOfWeek})`)
      
      const [startHour, startMin] = rule.startTime.split(':').map(Number)
      const [endHour, endMin] = rule.endTime.split(':').map(Number)
      
      let slotStart = setMinutes(setHours(localDate, startHour), startMin)
      let slotEnd = setMinutes(setHours(localDate, endHour), endMin)
      
      console.log(`Rango: ${format(slotStart, 'HH:mm')} - ${format(slotEnd, 'HH:mm')}`)
      
      let slotCount = 0
      let excludedCount = 0
      
      while (slotStart < slotEnd) {
        const slotEndTime = addMinutes(slotStart, rule.slotMinutes)
        
        if (slotEndTime > slotEnd) {
          break
        }
        
        const isNotInPast = isAfter(slotStart, now)
        
        if (isNotInPast) {
          slotCount++
          if (slotCount <= 3) {
            console.log(`  ✅ Slot ${slotCount}: ${format(slotStart, 'HH:mm')} - ${format(slotEndTime, 'HH:mm')} (futuro)`)
          }
        } else {
          excludedCount++
          if (excludedCount <= 3) {
            console.log(`  ❌ Slot excluido: ${format(slotStart, 'HH:mm')} - ${format(slotEndTime, 'HH:mm')} (pasado)`)
            console.log(`     slotStart: ${format(slotStart, 'dd/MM/yyyy HH:mm:ss')}`)
            console.log(`     now: ${format(now, 'dd/MM/yyyy HH:mm:ss')}`)
            console.log(`     isAfter: ${isAfter(slotStart, now)}`)
          }
        }
        
        slotStart = addMinutes(slotEndTime, rule.bufferMinutes)
      }
      
      console.log(`\nTotal slots generados: ${slotCount}`)
      console.log(`Total slots excluidos: ${excludedCount}`)
      break
    }
    
    date = addDays(date, 1)
  }

  await prisma.$disconnect()
}

main().catch(console.error)


