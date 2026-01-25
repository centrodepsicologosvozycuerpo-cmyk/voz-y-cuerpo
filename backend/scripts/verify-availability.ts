import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { getAvailableSlots } from '../lib/availability'
import { startOfDay, addDays, format } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const prisma = new PrismaClient()
const TIMEZONE = 'America/Argentina/Buenos_Aires'

/**
 * Función de verificación que valida que los slots generados coincidan
 * con las reglas de disponibilidad configuradas.
 */
async function verifyAvailability(professionalSlug: string, daysToCheck: number = 7) {
  console.log(`🔍 Verificando disponibilidad para ${professionalSlug} (próximos ${daysToCheck} días)\n`)

  const professional = await prisma.professional.findUnique({
    where: { slug: professionalSlug },
    include: {
      availabilityRules: {
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
    },
  })

  if (!professional) {
    console.log('❌ Profesional no encontrado')
    return false
  }

  const from = startOfDay(new Date())
  const to = addDays(from, daysToCheck - 1)
  const slots = await getAvailableSlots(professional.id, from, to)

  // Calcular slots esperados por día
  const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const expectedSlotsByDay: Record<number, number> = {}

  // Calcular slots esperados para cada día de la semana
  for (let day = 0; day <= 6; day++) {
    const rules = professional.availabilityRules.filter((r) => r.dayOfWeek === day)
    let expectedCount = 0

    for (const rule of rules) {
      const [startHour, startMin] = rule.startTime.split(':').map(Number)
      const [endHour, endMin] = rule.endTime.split(':').map(Number)
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin
      const duration = endMinutes - startMinutes
      
      // Calcular cuántos slots caben: (duration - slotMinutes) / (slotMinutes + bufferMinutes) + 1
      // Pero más simple: iterar hasta que no quepa más
      let current = startMinutes
      while (current + rule.slotMinutes <= endMinutes) {
        expectedCount++
        current += rule.slotMinutes + rule.bufferMinutes
      }
    }

    expectedSlotsByDay[day] = expectedCount
  }

  // Agrupar slots reales por día de la semana
  const actualSlotsByDay: Record<number, number> = {}
  slots.forEach((slot) => {
    const localDate = utcToZonedTime(slot.startAt, TIMEZONE)
    const dayOfWeek = localDate.getDay()
    actualSlotsByDay[dayOfWeek] = (actualSlotsByDay[dayOfWeek] || 0) + 1
  })

  // Comparar
  let allCorrect = true
  console.log('📊 COMPARACIÓN (Esperado vs Actual):\n')
  for (let day = 0; day <= 6; day++) {
    const expected = expectedSlotsByDay[day] || 0
    const actual = actualSlotsByDay[day] || 0
    const match = expected === actual
    const icon = match ? '✅' : '❌'
    
    console.log(`${icon} ${DAYS[day]}: Esperado ${expected}, Actual ${actual}`)
    
    if (!match) {
      allCorrect = false
    }
  }

  await prisma.$disconnect()
  return allCorrect
}

// Ejecutar verificación
verifyAvailability('nombre1-apellido1', 7)
  .then((result) => {
    if (result) {
      console.log('\n✅ Verificación exitosa: Los slots coinciden con las reglas')
      process.exit(0)
    } else {
      console.log('\n❌ Verificación fallida: Hay discrepancias')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })


