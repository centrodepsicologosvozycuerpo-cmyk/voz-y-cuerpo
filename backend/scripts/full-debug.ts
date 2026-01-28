import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { getAvailableSlots } from '../lib/availability'
import { startOfDay, addDays, format, setHours, setMinutes, addMinutes } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const prisma = new PrismaClient()
const TIMEZONE = 'America/Argentina/Buenos_Aires'

async function main() {
  console.log('🔍 DEBUG COMPLETO: Simulando getAvailableSlots paso a paso\n')

  const professional = await prisma.professional.findFirst({
    where: { slug: 'nombre1-apellido1' },
    include: {
      availabilityRules: true,
      exceptionDates: true,
      appointments: true,
    },
  })

  if (!professional) {
    console.log('❌ Profesional no encontrado')
    return
  }

  const from = startOfDay(new Date())
  const to = addDays(from, 6)
  const now = utcToZonedTime(new Date(), TIMEZONE)

  console.log(`📅 Rango: ${format(from, 'dd/MM/yyyy')} a ${format(to, 'dd/MM/yyyy')}`)
  console.log(`🕐 Ahora: ${format(now, 'dd/MM/yyyy HH:mm:ss')}\n`)

  const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  let date = new Date(from)
  let iteration = 0

  while (date <= to && iteration < 10) {
    iteration++
    const localDate = utcToZonedTime(date, TIMEZONE)
    const dayOfWeek = localDate.getDay()
    const dateStr = format(localDate, 'dd/MM/yyyy')

    console.log(`\n📅 Iteración ${iteration}: ${dateStr} (${DAYS[dayOfWeek]}, dayOfWeek=${dayOfWeek})`)

    const rules = professional.availabilityRules.filter((r) => r.dayOfWeek === dayOfWeek)
    console.log(`   Reglas encontradas: ${rules.length}`)

    if (rules.length === 0) {
      console.log(`   ⏭️  Saltando (sin reglas)`)
      date = addDays(date, 1)
      continue
    }

    for (const rule of rules) {
      console.log(`   📋 Procesando regla: ${rule.startTime} - ${rule.endTime}`)

      const [startHour, startMin] = rule.startTime.split(':').map(Number)
      const [endHour, endMin] = rule.endTime.split(':').map(Number)

      let slotStart = setMinutes(setHours(localDate, startHour), startMin)
      let slotEnd = setMinutes(setHours(localDate, endHour), endMin)

      console.log(`      Rango local: ${format(slotStart, 'HH:mm')} - ${format(slotEnd, 'HH:mm')}`)

      let slotCount = 0
      let excludedCount = 0

      while (slotStart < slotEnd) {
        const slotEndTime = addMinutes(slotStart, rule.slotMinutes)

        if (slotEndTime > slotEnd) {
          break
        }

        const isNotInPast = slotStart.getTime() > now.getTime()

        if (isNotInPast) {
          slotCount++
          if (slotCount <= 2) {
            console.log(`      ✅ Slot ${slotCount}: ${format(slotStart, 'HH:mm')} (futuro)`)
          }
        } else {
          excludedCount++
          if (excludedCount <= 2) {
            console.log(`      ❌ Slot excluido: ${format(slotStart, 'HH:mm')} (pasado)`)
            console.log(`         slotStart: ${format(slotStart, 'dd/MM/yyyy HH:mm:ss')}`)
            console.log(`         now: ${format(now, 'dd/MM/yyyy HH:mm:ss')}`)
            console.log(`         diff: ${(slotStart.getTime() - now.getTime()) / 1000 / 60} minutos`)
          }
        }

        slotStart = addMinutes(slotEndTime, rule.bufferMinutes)
      }

      console.log(`      📊 Total: ${slotCount} slots generados, ${excludedCount} excluidos`)
    }

    date = addDays(date, 1)
  }

  // Ahora probar con la función real
  console.log(`\n\n🧪 PROBANDO CON getAvailableSlots REAL:\n`)
  const slots = await getAvailableSlots(professional.id, from, to)
  console.log(`✅ Total slots: ${slots.length}`)

  const slotsByDay: Record<number, number> = {}
  slots.forEach((slot) => {
    const localDate = utcToZonedTime(slot.startAt, TIMEZONE)
    const dayOfWeek = localDate.getDay()
    slotsByDay[dayOfWeek] = (slotsByDay[dayOfWeek] || 0) + 1
  })

  console.log(`\n📊 RESULTADO FINAL:`)
  for (let day = 0; day <= 6; day++) {
    const count = slotsByDay[day] || 0
    const rules = professional.availabilityRules.filter((r) => r.dayOfWeek === day)
    const shouldHave = rules.length > 0
    const icon = shouldHave ? (count > 0 ? '✅' : '❌') : (count === 0 ? '✅' : '❌')
    console.log(`  ${icon} ${DAYS[day]}: ${count} slots`)
  }

  await prisma.$disconnect()
}

main().catch(console.error)


