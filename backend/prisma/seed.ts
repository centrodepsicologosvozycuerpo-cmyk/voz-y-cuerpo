import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Verificar si ya hay profesionales en la base de datos
  const existingProfessionals = await prisma.professional.count()
  
  if (existingProfessionals > 0) {
    console.log(`ℹ️  Ya existen ${existingProfessionals} profesionales en la base de datos.`)
    console.log('   Saltando seed para preservar datos existentes.')
    console.log('   Si necesitás resetear los datos, ejecutá: npm run db:reset')
    return
  }

  console.log('   Base de datos vacía, creando datos de demo...')

  // Limpiar datos existentes solo si estamos seguros de que está vacío
  // (esto es redundante pero por seguridad)
  await prisma.notificationLog.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.blockedSlot.deleteMany()
  await prisma.availabilityOverrideRange.deleteMany()
  await prisma.availabilityOverride.deleteMany()
  await prisma.exceptionDate.deleteMany()
  await prisma.availabilityRule.deleteMany()
  await prisma.changeRequestVote.deleteMany()
  await prisma.changeRequest.deleteMany()
  await prisma.user.deleteMany()
  await prisma.professional.deleteMany()

  const demoPasswordHash = await bcrypt.hash('Demo1234!', 10)

  // Crear profesionales
  const prof1 = await prisma.professional.create({
    data: {
      slug: 'nombre1-apellido1',
      fullName: 'Nombre1 Apellido1',
      title: 'Psicóloga',
      modalities: JSON.stringify(['online', 'presencial']),
      languages: JSON.stringify(['español']),
      specialties: JSON.stringify(['ansiedad', 'depresión', 'estrés', 'terapia individual']),
      approach: 'Enfoque cognitivo-conductual con técnicas de mindfulness y terapia breve.',
      isActive: true,
      contactEmail: 'nombre1@dominio.com',
      whatsappPhone: '+541100000001',
    },
  })

  const prof2 = await prisma.professional.create({
    data: {
      slug: 'nombre2-apellido2',
      fullName: 'Nombre2 Apellido2',
      title: 'Psicóloga',
      modalities: JSON.stringify(['online', 'presencial']),
      languages: JSON.stringify(['español', 'inglés']),
      specialties: JSON.stringify(['pareja', 'autoestima', 'duelo', 'estrés laboral']),
      approach: 'Acompañamiento integral orientado a objetivos, con herramientas de regulación emocional.',
      isActive: true,
      contactEmail: 'nombre2@dominio.com',
      whatsappPhone: '+541100000002',
    },
  })

  const prof3 = await prisma.professional.create({
    data: {
      slug: 'nombre3-apellido3',
      fullName: 'Nombre3 Apellido3',
      title: 'Psicóloga',
      modalities: JSON.stringify(['online']),
      languages: JSON.stringify(['español']),
      specialties: JSON.stringify(['trauma', 'EMDR', 'terapia individual', 'adultos']),
      approach: 'Especializada en trauma y EMDR, con enfoque en el procesamiento de experiencias traumáticas.',
      isActive: true,
      contactEmail: 'nombre3@dominio.com',
      whatsappPhone: '+541100000003',
    },
  })

  const prof4 = await prisma.professional.create({
    data: {
      slug: 'nombre4-apellido4',
      fullName: 'Nombre4 Apellido4',
      title: 'Psicóloga',
      modalities: JSON.stringify(['presencial']),
      languages: JSON.stringify(['español']),
      specialties: JSON.stringify(['niños', 'adolescentes', 'terapia familiar', 'TCC']),
      approach: 'Terapia cognitivo-conductual adaptada a niños y adolescentes, con enfoque lúdico y familiar.',
      isActive: true,
      contactEmail: 'nombre4@dominio.com',
      whatsappPhone: '+541100000004',
    },
  })

  // Crear users (panel / login)
  await prisma.user.createMany({
    data: [
      { email: 'nombre1@dominio.com', passwordHash: demoPasswordHash, professionalId: prof1.id },
      { email: 'nombre2@dominio.com', passwordHash: demoPasswordHash, professionalId: prof2.id },
      { email: 'nombre3@dominio.com', passwordHash: demoPasswordHash, professionalId: prof3.id },
      { email: 'nombre4@dominio.com', passwordHash: demoPasswordHash, professionalId: prof4.id },
    ],
  })

  // Reglas de disponibilidad (base semanal)
  for (let day = 1; day <= 5; day++) {
    await prisma.availabilityRule.create({
      data: {
        professionalId: prof1.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
        slotMinutes: 50,
        bufferMinutes: 10,
        locationLabel: 'CABA',
      },
    })

    await prisma.availabilityRule.create({
      data: {
        professionalId: prof2.id,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '19:00',
        slotMinutes: 45,
        bufferMinutes: 10,
        locationLabel: 'Zona Norte',
      },
    })

    await prisma.availabilityRule.create({
      data: {
        professionalId: prof3.id,
        dayOfWeek: day,
        startTime: '14:00',
        endTime: '20:00',
        slotMinutes: 50,
        bufferMinutes: 10,
        modality: 'online',
      },
    })

    await prisma.availabilityRule.create({
      data: {
        professionalId: prof4.id,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '16:00',
        slotMinutes: 50,
        bufferMinutes: 10,
        modality: 'presencial',
        locationLabel: 'CABA',
      },
    })
  }

  // Excepciones: ejemplo (feriados/bloqueos)
  // COMENTADO: Descomentar si necesitás crear excepciones de prueba
  // const today = new Date()
  // const inDays = (n: number) => {
  //   const d = new Date(today)
  //   d.setDate(d.getDate() + n)
  //   d.setHours(0, 0, 0, 0)
  //   return d
  // }
  // await prisma.exceptionDate.createMany({
  //   data: [
  //     { professionalId: prof1.id, date: inDays(7), isUnavailable: true, note: 'Feriado (demo)' },
  //     { professionalId: prof2.id, date: inDays(10), isUnavailable: false, startTime: '10:00', endTime: '13:00', note: 'Bloqueo parcial (demo)' },
  //   ],
  // })

  console.log('✅ Seed completed!')
  console.log('🔐 Usuarios demo: nombre1@dominio.com ... nombre4@dominio.com')
  console.log('🔑 Password demo: Demo1234!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
