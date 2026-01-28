import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { format } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const prisma = new PrismaClient()
const TIMEZONE = 'America/Argentina/Buenos_Aires'

async function main() {
  console.log('🔍 Verificando excepciones y bloqueos...\n')

  const professional = await prisma.professional.findFirst({
    where: { slug: 'nombre1-apellido1' },
    include: {
      exceptionDates: {
        orderBy: { date: 'asc' },
      },
      availabilityOverrides: {
        include: {
          ranges: true,
        },
        orderBy: { date: 'asc' },
        take: 10,
      },
    },
  })

  if (!professional) {
    console.log('❌ Profesional no encontrado')
    return
  }

  console.log(`✅ Profesional: ${professional.fullName}\n`)

  console.log(`📅 ExceptionDates: ${professional.exceptionDates.length}`)
  professional.exceptionDates.forEach((ex) => {
    const localDate = utcToZonedTime(ex.date, TIMEZONE)
    console.log(`  - ${format(localDate, 'dd/MM/yyyy')}: ${ex.isUnavailable ? 'NO DISPONIBLE' : 'BLOQUEO PARCIAL'}`)
    if (!ex.isUnavailable && ex.startTime && ex.endTime) {
      console.log(`    Bloqueo: ${ex.startTime} - ${ex.endTime}`)
    }
    if (ex.note) {
      console.log(`    Nota: ${ex.note}`)
    }
  })


  console.log(`\n🔄 AvailabilityOverrides: ${professional.availabilityOverrides.length}`)
  professional.availabilityOverrides.forEach((override) => {
    const localDate = utcToZonedTime(override.date, TIMEZONE)
    console.log(`  - ${format(localDate, 'dd/MM/yyyy')}: ${override.ranges.length} rango(s)`)
    override.ranges.forEach((range) => {
      console.log(`    ${range.startTime} - ${range.endTime}`)
    })
  })

  await prisma.$disconnect()
}

main().catch(console.error)


