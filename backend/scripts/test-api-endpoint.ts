import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { getAvailableSlots } from '../lib/availability'
import { startOfDay, addDays, format } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const prisma = new PrismaClient()
const TIMEZONE = 'America/Argentina/Buenos_Aires'

async function main() {
  console.log('🧪 TEST: Simulando llamada desde app/turnos/[slug]/page.tsx\n')

  const professional = await prisma.professional.findFirst({
    where: { slug: 'nombre1-apellido1' },
  })

  if (!professional) {
    console.log('❌ Profesional no encontrado')
    return
  }

  // Simular exactamente lo que hace app/turnos/[slug]/page.tsx
  const from = startOfDay(new Date())
  const to = addDays(from, 21)
  
  console.log(`📅 Rango: ${format(from, 'dd/MM/yyyy')} a ${format(to, 'dd/MM/yyyy')}\n`)

  const availableSlots = await getAvailableSlots(professional.id, from, to)
  
  console.log(`✅ Total slots generados: ${availableSlots.length}\n`)

  // Serializar como lo hace el servidor
  const serializedSlots = availableSlots.map(slot => ({
    startAt: slot.startAt.toISOString(),
    endAt: slot.endAt.toISOString(),
    modality: slot.modality,
    locationLabel: slot.locationLabel,
  }))

  // Agrupar por día de la semana
  const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const slotsByDay: Record<number, any[]> = {}
  const slotsByDate: Record<string, any[]> = {}

  serializedSlots.forEach((slot) => {
    const startDate = new Date(slot.startAt)
    const localDate = utcToZonedTime(startDate, TIMEZONE)
    const dayOfWeek = localDate.getDay()
    const dateKey = format(localDate, 'yyyy-MM-dd')

    if (!slotsByDay[dayOfWeek]) {
      slotsByDay[dayOfWeek] = []
    }
    slotsByDay[dayOfWeek].push(slot)

    if (!slotsByDate[dateKey]) {
      slotsByDate[dateKey] = []
    }
    slotsByDate[dateKey].push(slot)
  })

  console.log('📊 SLOTS POR DÍA DE LA SEMANA (como los ve el componente):\n')
  for (let day = 0; day <= 6; day++) {
    const count = slotsByDay[day]?.length || 0
    const rules = await prisma.availabilityRule.findMany({
      where: {
        professionalId: professional.id,
        dayOfWeek: day,
      },
    })
    const shouldHave = rules.length > 0
    const icon = shouldHave ? (count > 0 ? '✅' : '❌') : (count === 0 ? '✅' : '❌')
    console.log(`  ${icon} ${DAYS[day]} (${day}): ${count} slots ${shouldHave ? '(debería tener)' : '(NO debería tener)'}`)
  }

  console.log(`\n📅 PRIMEROS 14 DÍAS (como los muestra el calendario):\n`)
  let currentDate = new Date(from)
  for (let i = 0; i < 14; i++) {
    const dateKey = format(currentDate, 'yyyy-MM-dd')
    const localDate = utcToZonedTime(currentDate, TIMEZONE)
    const dayOfWeek = localDate.getDay()
    const count = slotsByDate[dateKey]?.length || 0
    const rules = await prisma.availabilityRule.findMany({
      where: {
        professionalId: professional.id,
        dayOfWeek: dayOfWeek,
      },
    })
    const shouldHave = rules.length > 0
    const icon = shouldHave ? (count > 0 ? '✅' : '❌') : (count === 0 ? '✅' : '❌')
    console.log(`  ${icon} ${DAYS[dayOfWeek]} ${format(localDate, 'dd/MM')}: ${count} turnos`)
    currentDate = addDays(currentDate, 1)
  }

  await prisma.$disconnect()
}

main().catch(console.error)


