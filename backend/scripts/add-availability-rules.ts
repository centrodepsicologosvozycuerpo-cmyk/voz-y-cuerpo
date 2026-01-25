import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const slug = process.argv[2] || 'juan-ignacio-sarratea'
  
  console.log(`🔍 Agregando reglas de disponibilidad para: ${slug}\n`)

  const professional = await prisma.professional.findUnique({
    where: { slug },
    include: {
      availabilityRules: true,
    },
  })

  if (!professional) {
    console.log('❌ Profesional no encontrado')
    return
  }

  if (professional.availabilityRules.length > 0) {
    console.log(`⚠️  El profesional ya tiene ${professional.availabilityRules.length} reglas de disponibilidad.`)
    console.log('   Si querés agregar más, hacelo desde el backoffice.\n')
    return
  }

  console.log(`✅ Profesional: ${professional.fullName}`)
  console.log(`   ID: ${professional.id}\n`)

  // Crear reglas de ejemplo: Lunes a Viernes, 9:00 - 18:00
  const rules = []
  for (let day = 1; day <= 5; day++) {
    rules.push({
      professionalId: professional.id,
      dayOfWeek: day, // 1 = Lunes, 5 = Viernes
      startTime: '09:00',
      endTime: '18:00',
      slotMinutes: 50,
      bufferMinutes: 10,
      locationLabel: 'CABA',
    })
  }

  await prisma.availabilityRule.createMany({
    data: rules,
  })

  console.log(`✅ Se crearon ${rules.length} reglas de disponibilidad:`)
  console.log('   - Lunes a Viernes')
  console.log('   - Horario: 09:00 - 18:00')
  console.log('   - Duración de turno: 50 minutos')
  console.log('   - Buffer entre turnos: 10 minutos')
  console.log('   - Ubicación: CABA\n')
  console.log('💡 Podés modificar estas reglas desde el backoffice en la pestaña "Calendario".\n')

  await prisma.$disconnect()
}

main().catch(console.error)

