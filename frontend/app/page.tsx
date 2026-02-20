import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Heart, Users, Clock, Shield } from 'lucide-react'
import { redirect } from 'next/navigation'
import { HeroCarousel } from '@/components/hero-carousel'

export const metadata = {
  title: 'Inicio - Voz y Cuerpo',
  description: 'Voz y Cuerpo. Tu bienestar emocional es nuestra prioridad. Conocé a nuestro equipo y reservá tu turno online.',
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Banner Section con Carrusel */}
      <HeroCarousel />

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Heart className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Atención Personalizada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cada persona es única. Adaptamos nuestro enfoque a tus necesidades específicas.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Equipo Multidisciplinario</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Contamos con profesionales especializados en diferentes áreas terapéuticas.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Clock className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Flexibilidad de Horarios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Turnos disponibles en diferentes horarios, adaptados a tu rutina.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Confidencialidad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Respetamos tu privacidad y garantizamos la confidencialidad de tus sesiones.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Nuestros Servicios</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ofrecemos diferentes modalidades de terapia para acompañarte en tu proceso de crecimiento personal.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Terapia Individual</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Sesiones personalizadas enfocadas en tu bienestar emocional y desarrollo personal.
                </p>
                <Link href="/servicios">
                  <Button variant="link" size="sm">
                    Más información <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Terapia de Pareja</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Trabajamos juntos para fortalecer la comunicación y mejorar la relación.
                </p>
                <Link href="/servicios">
                  <Button variant="link" size="sm">
                    Más información <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Terapia Familiar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Enfoque sistémico para mejorar las dinámicas y relaciones familiares.
                </p>
                <Link href="/servicios">
                  <Button variant="link" size="sm">
                    Más información <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">¿Listo para comenzar?</CardTitle>
              <CardDescription>
                Reservá tu turno online de forma rápida y sencilla
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/turnos">
                <Button size="lg">
                  Reservar Turno Ahora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}



