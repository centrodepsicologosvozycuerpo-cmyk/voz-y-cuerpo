import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verificando reglas de disponibilidad...\n')

  const professional = await prisma.professional.findFirst({
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
  console.log(`📅 Reglas de disponibilidad (${professional.availabilityRules.length}):\n`)

  const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  for (let day = 0; day <= 6; day++) {
    const rules = professional.availabilityRules.filter((r) => r.dayOfWeek === day)
    console.log(`${DAYS[day]} (${day}):`)
    if (rules.length === 0) {
      console.log('  ❌ Sin horarios configurados\n')
    } else {
      rules.forEach((rule) => {
        console.log(
          `  ✅ ${rule.startTime} - ${rule.endTime} | Slot: ${rule.slotMinutes}min | Buffer: ${rule.bufferMinutes}min`
        )
      })
      console.log('')
    }
  }

  await prisma.$disconnect()
}

main().catch(console.error)


