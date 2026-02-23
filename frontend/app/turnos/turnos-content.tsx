'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar, Clock, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

interface Professional {
  id: string
  slug: string
  fullName: string
  title: string
  specialties: string
  modalities: string
  photo?: string
  photoUrls?: { original: string; thumbnail: string; avatar: string; profile: string }
}

export function TurnosContent() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/professionals`)
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar profesionales')
        return res.json()
      })
      .then(data => setProfessionals(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Reservar Turno</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Elegí el profesional con el que querés agendar tu sesión. El proceso es simple y rápido.
        </p>
      </div>

      <div className="max-w-4xl mx-auto mb-12">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>¿Cómo funciona?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
              <li>Seleccioná el profesional con el que querés agendar</li>
              <li>Elegí la modalidad (online o presencial)</li>
              <li>Seleccioná una fecha y horario disponible</li>
              <li>Completá tus datos de contacto</li>
              <li>Recibirás una confirmación por email y WhatsApp</li>
            </ol>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {professionals.map((prof) => {
            const specialties = JSON.parse(prof.specialties || '[]')
            const modalities = JSON.parse(prof.modalities || '[]')

            return (
              <Card key={prof.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {(prof.photoUrls?.avatar ?? prof.photo) ? (
                      <div className="flex-shrink-0">
                        <img
                          src={prof.photoUrls?.avatar ?? prof.photoUrls?.original ?? `${API_URL}/api/professionals/photo/${prof.photo}`}
                          alt={prof.fullName}
                          className="w-20 h-20 object-cover rounded-full"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-20 h-20 rounded-full bg-muted"></div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-xl">{prof.fullName}</CardTitle>
                      <CardDescription>{prof.title}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Especialidades</h4>
                      <div className="flex flex-wrap gap-2">
                        {specialties.slice(0, 3).map((spec: string) => (
                          <Chip key={spec} variant="secondary" className="text-xs">
                            {spec}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Modalidades
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {modalities.map((mod: string) => (
                          <Chip key={mod} className="text-xs">
                            {mod === 'online' ? 'Online' : 'Presencial'}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <Link href={`/turnos/profesional/?slug=${prof.slug}`}>
                      <Button className="w-full">
                        Ver Disponibilidad
                        <Clock className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
