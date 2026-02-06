'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar, Languages, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

interface Professional {
  id: string
  slug: string
  fullName: string
  title: string
  specialties: string
  modalities: string
  languages: string
  approach?: string
  description?: string
  photo?: string
  photoUrls?: { original: string; thumbnail: string; avatar: string; profile: string }
  isActive: boolean
}

export function ProfessionalProfileContent() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('slug')
  
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setError('Profesional no especificado')
      setLoading(false)
      return
    }
    
    fetch(`${API_URL}/api/professionals`)
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar profesional')
        return res.json()
      })
      .then(data => {
        const prof = data.find((p: Professional) => p.slug === slug)
        if (!prof || !prof.isActive) {
          setError('Profesional no encontrado')
        } else {
          setProfessional(prof)
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !professional) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error || 'Profesional no encontrado'}</p>
            <Link href="/equipo/">
              <Button className="w-full mt-4">Volver al equipo</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const specialties = JSON.parse(professional.specialties || '[]')
  const modalities = JSON.parse(professional.modalities || '[]')
  const languages = JSON.parse(professional.languages || '[]')

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/equipo/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Volver al equipo
          </Link>
        </div>

        <Card className="mb-8">
          <CardHeader>
            {(professional.photoUrls?.profile ?? professional.photoUrls?.original ?? professional.photo) && (
              <div className="mb-6 flex flex-col items-center">
                <img
                  src={professional.photoUrls?.profile ?? professional.photoUrls?.original ?? `${API_URL}/api/professionals/photo/${professional.photo}`}
                  alt={professional.fullName}
                  className="w-full max-w-md h-64 object-cover rounded-md"
                />
              </div>
            )}
            <div className="text-center">
            <CardTitle className="text-3xl">{professional.fullName}</CardTitle>
            <p className="text-xl text-muted-foreground">{professional.title}</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {professional.description && (
                <div>
                  <h3 className="font-semibold mb-3">Sobre mi trabajo</h3>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {professional.description}
                  </p>
                </div>
              )}
              <div>
                <h3 className="font-semibold mb-3">Especialidades</h3>
                <div className="flex flex-wrap gap-2">
                  {specialties.map((spec: string) => (
                    <Chip key={spec} variant="secondary">
                      {spec}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Modalidades de Atención
                </h3>
                <div className="flex flex-wrap gap-2">
                  {modalities.map((mod: string) => (
                    <Chip key={mod}>
                      {mod === 'online' ? 'Online' : 'Presencial'}
                    </Chip>
                  ))}
                </div>
              </div>

              {languages.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    Idiomas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang: string) => (
                      <Chip key={lang} variant="outline">
                        {lang}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-3">Enfoque Terapéutico</h3>
                <p className="text-muted-foreground">
                  {professional.approach || 'Profesional especializado en el acompañamiento terapéutico.'}
                </p>
              </div>

              <div className="pt-6 border-t">
                <Link href={`/turnos/profesional/?slug=${professional.slug}`}>
                  <Button size="lg" className="w-full sm:w-auto">
                    Reservar Turno con {professional.fullName.split(' ')[0]}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

