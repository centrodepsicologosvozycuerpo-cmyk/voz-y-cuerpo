import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { getAvailableSlots } from '../lib/availability'
import { startOfDay, addDays, format } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const prisma = new PrismaClient()
const TIMEZONE = 'America/Argentina/Buenos_Aires'

async function main() {
  console.log('🔍 DEBUG: Verificando disponibilidad para Nombre1 Apellido1\n')

  // 1. Obtener profesional
  const professional = await prisma.professional.findUnique({
    where: { slug: 'nombre1-apellido1' },
    include: {
      availabilityRules: {
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
      exceptionDates: true,
    },
  })

  if (!professional) {
    console.log('❌ Profesional no encontrado')
    return
  }

  console.log(`✅ Profesional: ${professional.fullName}\n`)

  // 2. Mostrar reglas de DB
  console.log('📅 REGLAS EN DB:')
  const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  for (let day = 0; day <= 6; day++) {
    const rules = professional.availabilityRules.filter((r) => r.dayOfWeek === day)
    console.log(`  ${DAYS[day]} (dayOfWeek=${day}): ${rules.length} regla(s)`)
    rules.forEach((rule) => {
      console.log(
        `    - ${rule.startTime} a ${rule.endTime} | Slot: ${rule.slotMinutes}min | Buffer: ${rule.bufferMinutes}min`
      )
    })
  }

  // 3. Calcular slots para una semana
  const from = startOfDay(new Date())
  const to = addDays(from, 6) // Próximos 7 días

  console.log(`\n📊 CALCULANDO SLOTS (${format(from, 'dd/MM/yyyy')} a ${format(to, 'dd/MM/yyyy')}):\n`)

  const slots = await getAvailableSlots(professional.id, from, to)

  // 4. Agrupar por día
  const slotsByDay: Record<number, number> = {}
  const slotsByDate: Record<string, any[]> = {}

  slots.forEach((slot) => {
    const localDate = utcToZonedTime(slot.startAt, TIMEZONE)
    const dayOfWeek = localDate.getDay()
    const dateKey = format(localDate, 'yyyy-MM-dd')

    slotsByDay[dayOfWeek] = (slotsByDay[dayOfWeek] || 0) + 1
    if (!slotsByDate[dateKey]) {
      slotsByDate[dateKey] = []
    }
    slotsByDate[dateKey].push(slot)
  })

  // 5. Mostrar resultados
  console.log('📈 RESULTADOS POR DÍA DE LA SEMANA:')
  for (let day = 0; day <= 6; day++) {
    const count = slotsByDay[day] || 0
    const rules = professional.availabilityRules.filter((r) => r.dayOfWeek === day)
    const expected = rules.length > 0 ? '✅ Debería tener slots' : '❌ NO debería tener slots'
    console.log(`  ${DAYS[day]} (${day}): ${count} slots - ${expected}`)
  }

  console.log(`\n📅 RESULTADOS POR FECHA (próximos 7 días):`)
  let currentDate = new Date(from)
  for (let i = 0; i < 7; i++) {
    const dateKey = format(currentDate, 'yyyy-MM-dd')
    const localDate = utcToZonedTime(currentDate, TIMEZONE)
    const dayOfWeek = localDate.getDay()
    const count = slotsByDate[dateKey]?.length || 0
    const rules = professional.availabilityRules.filter((r) => r.dayOfWeek === dayOfWeek)
    const expected = rules.length > 0 ? '✅' : '❌'
    const dayName = DAYS[dayOfWeek]
    console.log(`  ${dayName} ${format(localDate, 'dd/MM')} (${dayOfWeek}): ${count} slots ${expected}`)
    currentDate = addDays(currentDate, 1)
  }

  // 6. Detalle de slots del lunes (debería tener 4)
  console.log(`\n🔬 DETALLE LUNES (primer lunes encontrado):`)
  const mondaySlots = slots.filter((slot) => {
    const localDate = utcToZonedTime(slot.startAt, TIMEZONE)
    return localDate.getDay() === 1
  })
  if (mondaySlots.length > 0) {
    mondaySlots.slice(0, 10).forEach((slot) => {
      const localDate = utcToZonedTime(slot.startAt, TIMEZONE)
      console.log(`  ${format(localDate, 'HH:mm')} - ${format(utcToZonedTime(slot.endAt, TIMEZONE), 'HH:mm')}`)
    })
    console.log(`  Total: ${mondaySlots.length} slots`)
  } else {
    console.log('  ❌ No hay slots para lunes')
  }

  await prisma.$disconnect()
}

main().catch(console.error)

