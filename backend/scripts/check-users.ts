import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verificando usuarios en la base de datos...\n')

  const users = await prisma.user.findMany({
    include: {
      professional: true,
    },
  })

  if (users.length === 0) {
    console.log('❌ No hay usuarios en la base de datos!')
    console.log('💡 Ejecutá: npm run db:seed\n')
  } else {
    console.log(`✅ Encontrados ${users.length} usuarios:\n`)
    users.forEach((user) => {
      console.log(`  - ${user.email}`)
      console.log(`    Professional: ${user.professional?.fullName || 'NO ASOCIADO'}`)
      console.log(`    Active: ${user.professional?.isActive ? 'Sí' : 'No'}\n`)
    })
  }

  await prisma.$disconnect()
}

main().catch(console.error)


