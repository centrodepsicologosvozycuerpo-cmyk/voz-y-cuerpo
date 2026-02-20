import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, Heart, Baby, MessageCircle } from 'lucide-react'

export const metadata = {
  title: 'Nuestros Servicios - Voz y Cuerpo',
  description: 'Conocé los servicios y modalidades de terapia de Voz y Cuerpo: individual, pareja, familiar.',
}

export default function ServiciosPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Nuestros Servicios</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Ofrecemos diferentes modalidades de terapia adaptadas a tus necesidades específicas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Card>
          <CardHeader>
            <Heart className="h-10 w-10 text-primary mb-4" />
            <CardTitle>Terapia Individual</CardTitle>
            <CardDescription>
              Sesiones personalizadas enfocadas en tu bienestar emocional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              La terapia individual es un espacio seguro y confidencial donde podés trabajar 
              en tus desafíos personales, emocionales y mentales. Nuestros profesionales 
              adaptan el enfoque terapéutico a tus necesidades específicas, acompañándote 
              en tu proceso de autoconocimiento y crecimiento personal.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 mb-4">
              <li>Ansiedad y estrés</li>
              <li>Depresión</li>
              <li>Problemas de autoestima</li>
              <li>Duelo y pérdidas</li>
              <li>Desarrollo personal</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Users className="h-10 w-10 text-primary mb-4" />
            <CardTitle>Terapia de Pareja</CardTitle>
            <CardDescription>
              Fortalecé la comunicación y mejorá tu relación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              La terapia de pareja es un espacio donde ambos miembros pueden trabajar juntos 
              para mejorar su relación, fortalecer la comunicación y resolver conflictos. 
              Nuestro enfoque sistémico permite entender las dinámicas de la relación y 
              desarrollar herramientas para construir una relación más saludable.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 mb-4">
              <li>Comunicación</li>
              <li>Resolución de conflictos</li>
              <li>Intimidad y conexión</li>
              <li>Infidelidad</li>
              <li>Separación y divorcio</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Baby className="h-10 w-10 text-primary mb-4" />
            <CardTitle>Terapia Familiar</CardTitle>
            <CardDescription>
              Mejorá las dinámicas y relaciones familiares
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              La terapia familiar aborda los problemas desde una perspectiva sistémica, 
              entendiendo que los individuos forman parte de un sistema familiar más amplio. 
              Trabajamos con toda la familia para mejorar las dinámicas, la comunicación 
              y las relaciones entre sus miembros.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 mb-4">
              <li>Conflictos familiares</li>
              <li>Comunicación familiar</li>
              <li>Adolescentes y jóvenes</li>
              <li>Transiciones familiares</li>
              <li>Roles y límites</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <MessageCircle className="h-10 w-10 text-primary mb-4" />
            <CardTitle>Terapia Online</CardTitle>
            <CardDescription>
              Sesiones desde la comodidad de tu hogar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              La terapia online te permite acceder a atención psicológica desde cualquier 
              lugar, manteniendo la misma calidad y confidencialidad que las sesiones 
              presenciales. Ideal para personas con horarios ajustados o que prefieren 
              la comodidad de su hogar.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 mb-4">
              <li>Flexibilidad horaria</li>
              <li>Accesibilidad desde cualquier lugar</li>
              <li>Misma calidad que presencial</li>
              <li>Confidencialidad garantizada</li>
              <li>Plataforma segura</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>¿Tenés dudas sobre qué servicio es para vos?</CardTitle>
            <CardDescription>
              Contactanos y te ayudamos a encontrar la mejor opción
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contacto">
                <Button variant="outline">Contactar</Button>
              </Link>
              <Link href="/turnos">
                <Button>Reservar Turno</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



