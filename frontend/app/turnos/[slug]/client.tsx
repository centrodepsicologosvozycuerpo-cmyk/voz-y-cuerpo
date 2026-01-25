'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { addDays, startOfDay } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CalendarSlotPicker } from '@/components/calendar-slot-picker'
import { Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

interface Professional {
  id: string
  slug: string
  fullName: string
  title: string
  specialties: string
  modalities: string
  approach?: string
  isActive: boolean
}

interface Slot {
  startAt: string
  endAt: string
  modality: string
  locationLabel?: string
}

export function TurnosSlugClient() {
  const params = useParams()
  const slug = params.slug as string
  
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    
    const loadData = async () => {
      try {
        // Cargar profesional
        const profRes = await fetch(`${API_URL}/api/professionals`)
        if (!profRes.ok) throw new Error('Error al cargar profesional')
        const professionals = await profRes.json()
        const prof = professionals.find((p: Professional) => p.slug === slug)
        
        if (!prof || !prof.isActive) {
          setError('Profesional no encontrado')
          setLoading(false)
          return
        }
        
        setProfessional(prof)

        // Cargar disponibilidad
        const from = startOfDay(new Date())
        const to = addDays(from, 21)
        const availRes = await fetch(
          `${API_URL}/api/availability?professionalSlug=${slug}&from=${from.toISOString()}&to=${to.toISOString()}`
        )
        
        if (availRes.ok) {
          const data = await availRes.json()
          setSlots(data.slots || [])
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
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
            <Link href="/turnos/">
              <Button className="w-full mt-4">Volver a profesionales</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const specialties = JSON.parse(professional.specialties || '[]')
  const modalities = JSON.parse(professional.modalities || '[]')

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/turnos/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver a profesionales
        </Link>
      </div>

      <div className="max-w-5xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{professional.fullName}</CardTitle>
            <CardDescription>{professional.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {specialties.map((spec: string) => (
                <Chip key={spec} variant="secondary">
                  {spec}
                </Chip>
              ))}
            </div>
            <p className="text-muted-foreground">{professional.approach}</p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Los horarios se actualizan automáticamente. Si no ves cambios recientes, recargá la página.
            </p>
          </div>
          <CalendarSlotPicker
            professional={professional}
            initialSlots={slots}
            modalities={modalities}
          />
        </div>
      </div>
    </div>
  )
}

