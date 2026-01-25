import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { getAvailableSlots } from '../lib/availability'
import { startOfDay, addDays, format, setHours, setMinutes, addMinutes } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const prisma = new PrismaClient()
const TIMEZONE = 'America/Argentina/Buenos_Aires'

async function main() {
  console.log('🔍 DEBUG ESPECÍFICO: Martes 30/12/2025\n')

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

  // Fecha específica: Martes 30/12/2025
  const targetDate = new Date('2025-12-30T00:00:00')
  const localTargetDate = utcToZonedTime(targetDate, TIMEZONE)
  console.log(`Fecha objetivo: ${format(localTargetDate, 'dd/MM/yyyy')} (${localTargetDate.getDay()})`)

  const now = utcToZonedTime(new Date(), TIMEZONE)
  console.log(`Ahora: ${format(now, 'dd/MM/yyyy HH:mm:ss')}\n`)

  // Calcular slots manualmente para Martes 30/12
  const [startHour, startMin] = rule.startTime.split(':').map(Number)
  const [endHour, endMin] = rule.endTime.split(':').map(Number)

  let slotStart = setMinutes(setHours(localTargetDate, startHour), startMin)
  let slotEnd = setMinutes(setHours(localTargetDate, endHour), endMin)

  console.log(`Rango: ${format(slotStart, 'HH:mm')} - ${format(slotEnd, 'HH:mm')}\n`)

  let slotCount = 0
  let excludedCount = 0

  while (slotStart < slotEnd) {
    const slotEndTime = addMinutes(slotStart, rule.slotMinutes)

    if (slotEndTime > slotEnd) {
      break
    }

    const isNotInPast = slotStart.getTime() > now.getTime()
    const diffMinutes = (slotStart.getTime() - now.getTime()) / 1000 / 60

    if (isNotInPast) {
      slotCount++
      if (slotCount <= 3) {
        console.log(`✅ Slot ${slotCount}: ${format(slotStart, 'HH:mm')} (futuro, +${diffMinutes.toFixed(0)} min)`)
      }
    } else {
      excludedCount++
      if (excludedCount <= 3) {
        console.log(`❌ Slot excluido: ${format(slotStart, 'HH:mm')} (pasado, ${diffMinutes.toFixed(0)} min)`)
      }
    }

    slotStart = addMinutes(slotEndTime, rule.bufferMinutes)
  }

  console.log(`\n📊 Total: ${slotCount} slots generados, ${excludedCount} excluidos`)

  // Ahora probar con getAvailableSlots
  console.log(`\n🧪 PROBANDO CON getAvailableSlots:\n`)
  const from = startOfDay(targetDate)
  const to = addDays(from, 1)
  const slots = await getAvailableSlots(professional.id, from, to)

  console.log(`✅ Total slots: ${slots.length}`)
  slots.forEach((slot, idx) => {
    if (idx < 3) {
      const localSlot = utcToZonedTime(slot.startAt, TIMEZONE)
      console.log(`   Slot ${idx + 1}: ${format(localSlot, 'dd/MM/yyyy HH:mm')}`)
    }
  })

  await prisma.$disconnect()
}

main().catch(console.error)


