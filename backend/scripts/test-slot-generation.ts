import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { getAvailableSlots } from '../lib/availability'
import { startOfDay, addDays, format } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const prisma = new PrismaClient()
const TIMEZONE = 'America/Argentina/Buenos_Aires'

async function main() {
  console.log('🧪 TEST: Generación de slots para los próximos 7 días\n')

  const professional = await prisma.professional.findFirst({
    where: { slug: 'nombre1-apellido1' },
    include: {
      availabilityRules: true,
    },
  })

  if (!professional) {
    console.log('❌ Profesional no encontrado')
    return
  }

  const from = startOfDay(new Date())
  const to = addDays(from, 6)

  console.log(`📅 Rango: ${format(from, 'dd/MM/yyyy')} a ${format(to, 'dd/MM/yyyy')}\n`)

  // Calcular slots
  const slots = await getAvailableSlots(professional.id, from, to)

  console.log(`✅ Total slots generados: ${slots.length}\n`)

  // Agrupar por día de la semana
  const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const slotsByDay: Record<number, any[]> = {}

  slots.forEach((slot) => {
    const localDate = utcToZonedTime(slot.startAt, TIMEZONE)
    const dayOfWeek = localDate.getDay()
    if (!slotsByDay[dayOfWeek]) {
      slotsByDay[dayOfWeek] = []
    }
    slotsByDay[dayOfWeek].push(slot)
  })

  // Mostrar resultados
  console.log('📊 SLOTS POR DÍA DE LA SEMANA:\n')
  for (let day = 0; day <= 6; day++) {
    const count = slotsByDay[day]?.length || 0
    const rules = professional.availabilityRules.filter((r) => r.dayOfWeek === day)
    const shouldHave = rules.length > 0
    const status = shouldHave ? (count > 0 ? '✅' : '❌ FALTA') : (count === 0 ? '✅' : '❌ NO DEBERÍA')
    
    console.log(`${status} ${DAYS[day]} (${day}): ${count} slots`)
    if (rules.length > 0) {
      rules.forEach((rule) => {
        console.log(`    Regla: ${rule.startTime} - ${rule.endTime}`)
      })
    }
  }

  // Mostrar slots por fecha específica
  console.log('\n📅 SLOTS POR FECHA:\n')
  let currentDate = new Date(from)
  for (let i = 0; i < 7; i++) {
    const localDate = utcToZonedTime(currentDate, TIMEZONE)
    const dayOfWeek = localDate.getDay()
    const dateKey = format(localDate, 'yyyy-MM-dd')
    const daySlots = slots.filter((slot) => {
      const slotLocal = utcToZonedTime(slot.startAt, TIMEZONE)
      return format(slotLocal, 'yyyy-MM-dd') === dateKey
    })
    
    const rules = professional.availabilityRules.filter((r) => r.dayOfWeek === dayOfWeek)
    const shouldHave = rules.length > 0
    const status = shouldHave ? (daySlots.length > 0 ? '✅' : '❌ FALTA') : (daySlots.length === 0 ? '✅' : '❌ NO DEBERÍA')
    
    console.log(`${status} ${DAYS[dayOfWeek]} ${format(localDate, 'dd/MM')}: ${daySlots.length} slots`)
    
    currentDate = addDays(currentDate, 1)
  }

  await prisma.$disconnect()
}

main().catch(console.error)


