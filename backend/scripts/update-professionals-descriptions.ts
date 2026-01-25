import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📝 Actualizando descripciones de profesionales...')

  // Actualizar profesional 2
  await prisma.professional.updateMany({
    where: { slug: 'nombre2-apellido2' },
    data: {
      description: 'Me especializo en terapia de pareja y trabajo con personas que buscan mejorar sus relaciones interpersonales. Mi enfoque se centra en fortalecer la comunicación, resolver conflictos y reconstruir la confianza. También trabajo con procesos de duelo, autoestima y estrés laboral, acompañando a cada persona en su proceso de crecimiento personal y emocional.',
    },
  })

  // Actualizar profesional 3
  await prisma.professional.updateMany({
    where: { slug: 'nombre3-apellido3' },
    data: {
      description: 'Soy especialista en trauma y utilizo técnicas de EMDR para ayudar a las personas a procesar experiencias traumáticas. Trabajo principalmente con adultos que han vivido situaciones difíciles y buscan sanar heridas emocionales. Mi objetivo es crear un espacio seguro donde cada persona pueda explorar y procesar sus experiencias de manera gradual y respetuosa.',
    },
  })

  // Actualizar profesional 4
  await prisma.professional.updateMany({
    where: { slug: 'nombre4-apellido4' },
    data: {
      description: 'Me dedico a trabajar con niños, adolescentes y sus familias. Utilizo un enfoque lúdico y adaptado a cada etapa del desarrollo, combinando técnicas de terapia cognitivo-conductual con terapia familiar sistémica. Mi objetivo es acompañar a los más jóvenes en su crecimiento emocional y ayudar a las familias a fortalecer sus vínculos y comunicación.',
    },
  })

  console.log('✅ Descripciones actualizadas!')
  console.log('📸 Para agregar fotos, podés usar el panel de edición de profesionales')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


