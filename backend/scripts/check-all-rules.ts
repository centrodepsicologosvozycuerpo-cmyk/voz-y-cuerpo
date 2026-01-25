import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verificando TODAS las reglas de disponibilidad...\n')

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

  console.log(`✅ Profesional: ${professional.fullName} (ID: ${professional.id})\n`)
  console.log(`📅 Total de reglas: ${professional.availabilityRules.length}\n`)

  const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  for (let day = 0; day <= 6; day++) {
    const rules = professional.availabilityRules.filter((r) => r.dayOfWeek === day)
    console.log(`${DAYS[day]} (dayOfWeek=${day}): ${rules.length} regla(s)`)
    if (rules.length > 0) {
      rules.forEach((rule, idx) => {
        console.log(`  [${idx + 1}] ID: ${rule.id}`)
        console.log(`      ${rule.startTime} - ${rule.endTime}`)
        console.log(`      Slot: ${rule.slotMinutes}min | Buffer: ${rule.bufferMinutes}min`)
        console.log(`      Modality: ${rule.modality || 'null'} | Location: ${rule.locationLabel || 'null'}`)
      })
    } else {
      console.log('  ❌ Sin horarios configurados')
    }
    console.log('')
  }

  // Verificar si hay reglas con dayOfWeek incorrecto
  console.log('\n🔍 Verificando reglas con dayOfWeek fuera de rango (0-6):')
  const invalidRules = professional.availabilityRules.filter((r) => r.dayOfWeek < 0 || r.dayOfWeek > 6)
  if (invalidRules.length > 0) {
    console.log(`  ❌ Encontradas ${invalidRules.length} reglas inválidas:`)
    invalidRules.forEach((rule) => {
      console.log(`    ID: ${rule.id}, dayOfWeek: ${rule.dayOfWeek} (INVÁLIDO)`)
    })
  } else {
    console.log('  ✅ Todas las reglas tienen dayOfWeek válido (0-6)')
  }

  await prisma.$disconnect()
}

main().catch(console.error)


