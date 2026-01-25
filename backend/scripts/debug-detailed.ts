import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { getAvailableSlots } from '../lib/availability'
import { startOfDay, addDays, format } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const prisma = new PrismaClient()
const TIMEZONE = 'America/Argentina/Buenos_Aires'

async function main() {
  console.log('🔍 DEBUG DETALLADO: Verificando disponibilidad\n')

  const professional = await prisma.professional.findUnique({
    where: { slug: 'nombre1-apellido1' },
    include: {
      availabilityRules: {
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
    },
  })

  if (!professional) {
    console.log('❌ Profesional no encontrado')
    return
  }

  console.log(`✅ Profesional: ${professional.fullName}\n`)
  console.log('📅 REGLAS EN DB:')
  const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  for (let day = 0; day <= 6; day++) {
    const rules = professional.availabilityRules.filter((r) => r.dayOfWeek === day)
    console.log(`  ${DAYS[day]} (${day}): ${rules.length} regla(s)`)
    rules.forEach((rule) => {
      console.log(`    - ${rule.startTime} a ${rule.endTime} | Slot: ${rule.slotMinutes}min | Buffer: ${rule.bufferMinutes}min`)
    })
  }

  // Calcular slots para los próximos 14 días
  const from = startOfDay(new Date())
  const to = addDays(from, 13)

  console.log(`\n📊 CALCULANDO SLOTS (${format(from, 'dd/MM/yyyy')} a ${format(to, 'dd/MM/yyyy')}):\n`)

  const slots = await getAvailableSlots(professional.id, from, to)

  // Agrupar por fecha
  const slotsByDate: Record<string, any[]> = {}
  slots.forEach((slot) => {
    const localDate = utcToZonedTime(slot.startAt, TIMEZONE)
    const dateKey = format(localDate, 'yyyy-MM-dd')
    const dayOfWeek = localDate.getDay()
    
    if (!slotsByDate[dateKey]) {
      slotsByDate[dateKey] = []
    }
    slotsByDate[dateKey].push({ slot, dayOfWeek, localDate })
  })

  console.log('📅 RESULTADOS POR FECHA (próximos 14 días):\n')
  let currentDate = new Date(from)
  for (let i = 0; i < 14; i++) {
    const dateKey = format(currentDate, 'yyyy-MM-dd')
    const localDate = utcToZonedTime(currentDate, TIMEZONE)
    const dayOfWeek = localDate.getDay()
    const dayName = DAYS[dayOfWeek]
    const count = slotsByDate[dateKey]?.length || 0
    const rules = professional.availabilityRules.filter((r) => r.dayOfWeek === dayOfWeek)
    const shouldHaveSlots = rules.length > 0
    const icon = shouldHaveSlots ? (count > 0 ? '✅' : '❌') : (count === 0 ? '✅' : '❌')
    
    console.log(`${icon} ${dayName} ${format(localDate, 'dd/MM')} (dayOfWeek=${dayOfWeek}): ${count} slots ${shouldHaveSlots ? '(DEBERÍA tener)' : '(NO debería tener)'}`)
    
    if (count > 0 && slotsByDate[dateKey]) {
      const firstSlot = slotsByDate[dateKey][0]
      const firstSlotTime = format(firstSlot.localDate, 'HH:mm')
      console.log(`     Primer slot: ${firstSlotTime}`)
    }
    
    currentDate = addDays(currentDate, 1)
  }

  await prisma.$disconnect()
}

main().catch(console.error)

