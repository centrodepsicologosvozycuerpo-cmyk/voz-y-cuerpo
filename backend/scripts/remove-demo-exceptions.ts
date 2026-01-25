import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Eliminando excepciones de demo...\n')

  // Buscar excepciones con nota "Feriado (demo)" o similares
  const exceptions = await prisma.exceptionDate.findMany({
    where: {
      note: {
        contains: 'demo',
      },
    },
  })

  console.log(`Encontradas ${exceptions.length} excepciones de demo:`)
  exceptions.forEach((ex) => {
    console.log(`  - ID: ${ex.id}, Fecha: ${ex.date.toISOString().split('T')[0]}, Nota: ${ex.note}`)
  })

  if (exceptions.length > 0) {
    const result = await prisma.exceptionDate.deleteMany({
      where: {
        note: {
          contains: 'demo',
        },
      },
    })
    console.log(`\n✅ Eliminadas ${result.count} excepciones de demo`)
  } else {
    console.log('\n✅ No hay excepciones de demo para eliminar')
  }

  await prisma.$disconnect()
}

main().catch(console.error)


