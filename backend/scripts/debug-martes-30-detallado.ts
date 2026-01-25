import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { getAvailableSlots } from '../lib/availability'
import { startOfDay, addDays, format, setHours, setMinutes, addMinutes } from 'date-fns'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

const prisma = new PrismaClient()
const TIMEZONE = 'America/Argentina/Buenos_Aires'

async function main() {
  console.log('🔍 DEBUG DETALLADO: Martes 30/12/2025\n')

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

  // Simular exactamente lo que hace app/turnos/[slug]/page.tsx
  const from = startOfDay(new Date())
  const to = addDays(from, 21)
  
  console.log(`📅 Rango: ${format(from, 'dd/MM/yyyy')} a ${format(to, 'dd/MM/yyyy')}\n`)

  // Convertir a zona local (como lo hace getAvailableSlots)
  const fromLocal = utcToZonedTime(from, TIMEZONE)
  const toLocal = utcToZonedTime(to, TIMEZONE)
  const currentDate = startOfDay(fromLocal)
  const endDate = startOfDay(toLocal)

  console.log(`📅 Después de convertir a local:`)
  console.log(`  currentDate: ${format(currentDate, 'dd/MM/yyyy HH:mm:ss')}`)
  console.log(`  endDate: ${format(endDate, 'dd/MM/yyyy HH:mm:ss')}\n`)

  const now = utcToZonedTime(new Date(), TIMEZONE)
  console.log(`🕐 Ahora: ${format(now, 'dd/MM/yyyy HH:mm:ss')}\n`)

  // Iterar manualmente para encontrar Martes 30/12
  let date = new Date(currentDate)
  let iteration = 0
  const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  console.log('📅 Iterando días (buscando Martes 30/12):\n')
  while (date <= endDate && iteration < 10) {
    iteration++
    const localDate = utcToZonedTime(date, TIMEZONE)
    const dayOfWeek = localDate.getDay()
    const dateStr = format(localDate, 'dd/MM/yyyy')

    if (dateStr === '30/12/2025') {
      console.log(`🎯 ENCONTRADO: ${dateStr} (${DAYS[dayOfWeek]}, dayOfWeek=${dayOfWeek})`)
      
      if (dayOfWeek === 2) {
        console.log(`   ✅ Es Martes!`)
        
        // Calcular slots manualmente
        const [startHour, startMin] = rule.startTime.split(':').map(Number)
        const [endHour, endMin] = rule.endTime.split(':').map(Number)

        let slotStart = setMinutes(setHours(localDate, startHour), startMin)
        let slotEnd = setMinutes(setHours(localDate, endHour), endMin)

        console.log(`   Rango: ${format(slotStart, 'HH:mm')} - ${format(slotEnd, 'HH:mm')}`)

        let slotCount = 0
        while (slotStart < slotEnd) {
          const slotEndTime = addMinutes(slotStart, rule.slotMinutes)

          if (slotEndTime > slotEnd) {
            break
          }

          const isNotInPast = slotStart.getTime() > now.getTime()
          
          if (isNotInPast) {
            slotCount++
            if (slotCount <= 3) {
              console.log(`   ✅ Slot ${slotCount}: ${format(slotStart, 'HH:mm')} (futuro)`)
            }
          } else {
            if (slotCount === 0) {
              console.log(`   ❌ Slot excluido: ${format(slotStart, 'HH:mm')} (pasado)`)
            }
          }

          slotStart = addMinutes(slotEndTime, rule.bufferMinutes)
        }

        console.log(`   📊 Total slots: ${slotCount}`)
      } else {
        console.log(`   ❌ NO es Martes, es ${DAYS[dayOfWeek]}`)
      }
      break
    }

    date = addDays(date, 1)
  }

  // Ahora probar con getAvailableSlots
  console.log(`\n🧪 PROBANDO CON getAvailableSlots:\n`)
  const slots = await getAvailableSlots(professional.id, from, to)

  // Filtrar slots del 30/12
  const slots30 = slots.filter((slot) => {
    const localSlot = utcToZonedTime(slot.startAt, TIMEZONE)
    return format(localSlot, 'dd/MM/yyyy') === '30/12/2025'
  })

  console.log(`✅ Total slots del 30/12: ${slots30.length}`)
  if (slots30.length > 0) {
    slots30.forEach((slot, idx) => {
      const localSlot = utcToZonedTime(slot.startAt, TIMEZONE)
      console.log(`   Slot ${idx + 1}: ${format(localSlot, 'dd/MM/yyyy HH:mm')}`)
    })
  } else {
    console.log(`   ❌ NO HAY SLOTS para el 30/12`)
  }

  await prisma.$disconnect()
}

main().catch(console.error)

