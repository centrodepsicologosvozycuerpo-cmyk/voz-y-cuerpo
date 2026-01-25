import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const slug = process.argv[2] || 'juan-ignacio-sarratea'
  
  console.log(`🔍 Verificando reglas de disponibilidad para: ${slug}\n`)

  const professional = await prisma.professional.findUnique({
    where: { slug },
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

  console.log(`✅ Profesional: ${professional.fullName}`)
  console.log(`   ID: ${professional.id}`)
  console.log(`   Activo: ${professional.isActive ? 'Sí' : 'No'}\n`)
  console.log(`📅 Reglas de disponibilidad (${professional.availabilityRules.length}):\n`)

  if (professional.availabilityRules.length === 0) {
    console.log('❌ No hay reglas de disponibilidad configuradas.')
    console.log('   Este es el motivo por el cual no se muestran turnos disponibles.\n')
    console.log('💡 Solución:')
    console.log('   1. Iniciá sesión en el backoffice')
    console.log('   2. Andá a la pestaña "Calendario"')
    console.log('   3. Agregá reglas de disponibilidad para los días de la semana')
  } else {
    const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

    for (let day = 0; day <= 6; day++) {
      const rules = professional.availabilityRules.filter((r) => r.dayOfWeek === day)
      console.log(`${DAYS[day]} (${day}):`)
      if (rules.length === 0) {
        console.log('  ❌ Sin horarios configurados')
      } else {
        rules.forEach((rule) => {
          console.log(
            `  ✅ ${rule.startTime} - ${rule.endTime} | Slot: ${rule.slotMinutes}min | Buffer: ${rule.bufferMinutes}min | Modalidad: ${rule.modality || 'todas'} | Ubicación: ${rule.locationLabel || 'N/A'}`
          )
        })
      }
      console.log('')
    }
  }

  await prisma.$disconnect()
}

main().catch(console.error)

