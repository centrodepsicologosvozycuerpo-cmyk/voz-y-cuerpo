'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import Link from 'next/link'
import { Calendar, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

interface Professional {
  id: string
  slug: string
  fullName: string
  title: string
  specialties: string
  modalities: string
  approach?: string
  photo?: string
  photoUrls?: { original: string; thumbnail: string; avatar: string; profile: string }
  isActive: boolean
}

export default function ContactoPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/professionals`)
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar profesionales')
        return res.json()
      })
      .then(data => {
        // Filtrar solo profesionales activos
        const active = data.filter((p: Professional) => p.isActive)
        setProfessionals(active)
      })
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
        <h1 className="text-4xl font-bold mb-4">Contacto</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Conocé a nuestro equipo y reservá tu turno con el profesional que mejor se adapte a tus necesidades.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {professionals.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              No hay profesionales disponibles en este momento.
            </p>
          </div>
        ) : (
          professionals.map((prof) => {
            const specialties = JSON.parse(prof.specialties || '[]')
            const modalities = JSON.parse(prof.modalities || '[]')

            return (
              <Card key={prof.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
                <CardHeader className="flex-shrink-0">
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
                    <div className="flex-1 min-h-[80px]">
                      <CardTitle className="text-2xl">{prof.fullName}</CardTitle>
                      <CardDescription className="text-base">{prof.title}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    <div className="min-h-[60px]">
                      <h4 className="font-semibold mb-2">Especialidades</h4>
                      <div className="flex flex-wrap gap-2">
                        {specialties.map((spec: string) => (
                          <Chip key={spec} variant="secondary">
                            {spec}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <div className="min-h-[60px]">
                      <h4 className="font-semibold mb-2">Modalidades</h4>
                      <div className="flex flex-wrap gap-2">
                        {modalities.map((mod: string) => (
                          <Chip key={mod}>
                            {mod === 'online' ? 'Online' : 'Presencial'}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    {prof.approach && (
                      <div className="min-h-[60px]">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {prof.approach}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-auto pt-4">
                    <Link href={`/turnos/profesional/?slug=${prof.slug}`}>
                      <Button className="w-full">
                        <Calendar className="mr-2 h-4 w-4" />
                        Reservar Turno
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
