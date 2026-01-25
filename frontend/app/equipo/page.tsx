'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2 } from 'lucide-react'

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
}

export default function EquipoPage() {
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
        <h1 className="text-4xl font-bold mb-4">Nuestro Equipo</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Conocé a los profesionales que forman parte de nuestro equipo, cada uno especializado 
          en diferentes áreas para brindarte la mejor atención.
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
                    {prof.photo ? (
                      <div className="flex-shrink-0">
                        <img
                          src={`${API_URL}/api/professionals/photo/${prof.photo}`}
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
                    <div className="min-h-[60px]">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {prof.approach || 'Profesional especializado en el acompañamiento terapéutico.'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto pt-4">
                    <Link href={`/equipo/perfil/?slug=${prof.slug}`}>
                      <Button variant="outline" className="w-full h-10 bg-green-100 hover:bg-green-200 text-green-800 border-green-300">
                        Ver Perfil Completo
                        <ArrowRight className="ml-2 h-4 w-4" />
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
