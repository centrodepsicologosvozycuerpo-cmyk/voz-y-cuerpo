import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verificando TODAS las reglas de TODOS los profesionales...\n')

  const professionals = await prisma.professional.findMany({
    include: {
      availabilityRules: {
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
    },
  })

  for (const prof of professionals) {
    console.log(`\n👤 ${prof.fullName} (${prof.slug}):`)
    console.log(`   Total reglas: ${prof.availabilityRules.length}`)
    
    const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    for (let day = 0; day <= 6; day++) {
      const rules = prof.availabilityRules.filter((r) => r.dayOfWeek === day)
      if (rules.length > 0) {
        console.log(`   ${DAYS[day]} (${day}): ${rules.length} regla(s)`)
        rules.forEach((rule) => {
          console.log(`      - ${rule.startTime} a ${rule.endTime} (ID: ${rule.id})`)
        })
      }
    }
  }

  await prisma.$disconnect()
}

main().catch(console.error)


