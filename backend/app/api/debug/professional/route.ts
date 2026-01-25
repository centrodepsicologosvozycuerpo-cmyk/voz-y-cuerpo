import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAvailableSlots } from '@/lib/availability'
import { startOfDay, addDays, format } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const TIMEZONE = 'America/Argentina/Buenos_Aires'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'slug es requerido' }, { status: 400 })
    }

    // Obtener profesional
    const professional = await prisma.professional.findUnique({
      where: { slug },
      include: {
        availabilityRules: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        exceptionDates: {
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!professional) {
      return NextResponse.json({ error: 'Profesional no encontrado' }, { status: 404 })
    }

    // Calcular slots para los próximos 14 días
    const from = startOfDay(new Date())
    const to = addDays(from, 13)
    const slots = await getAvailableSlots(professional.id, from, to)

    // Agrupar slots por fecha
    const slotsByDate: Record<string, any[]> = {}
    slots.forEach((slot) => {
      const localDate = utcToZonedTime(slot.startAt, TIMEZONE)
      const dateKey = format(localDate, 'yyyy-MM-dd')
      if (!slotsByDate[dateKey]) {
        slotsByDate[dateKey] = []
      }
      slotsByDate[dateKey].push(slot)
    })

    // Generar resumen de próximos 14 días
    const upcomingSlotsSummary = []
    const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    
    let currentDate = new Date(from)
    for (let i = 0; i < 14; i++) {
      const localDate = utcToZonedTime(currentDate, TIMEZONE)
      const dateKey = format(localDate, 'yyyy-MM-dd')
      const dayOfWeekJS = localDate.getDay()
      const daySlots = slotsByDate[dateKey] || []
      
      const firstSlots = daySlots
        .slice(0, 5)
        .map((slot) => {
          const slotLocal = utcToZonedTime(slot.startAt, TIMEZONE)
          return format(slotLocal, 'HH:mm')
        })

      upcomingSlotsSummary.push({
        date: dateKey,
        dayOfWeekJS,
        dayName: DAYS[dayOfWeekJS],
        count: daySlots.length,
        firstSlots,
      })

      currentDate = addDays(currentDate, 1)
    }

    return NextResponse.json({
      professional: {
        id: professional.id,
        slug: professional.slug,
        fullName: professional.fullName,
      },
      rules: professional.availabilityRules.map((rule) => ({
        id: rule.id,
        professionalId: rule.professionalId,
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        slotMinutes: rule.slotMinutes,
        bufferMinutes: rule.bufferMinutes,
        modality: rule.modality,
        locationLabel: rule.locationLabel,
      })),
      exceptions: professional.exceptionDates.map((ex) => ({
        id: ex.id,
        professionalId: ex.professionalId,
        date: ex.date.toISOString(),
        isUnavailable: ex.isUnavailable,
        startTime: ex.startTime,
        endTime: ex.endTime,
        note: ex.note,
      })),
      now: new Date().toISOString(),
      upcomingSlotsSummary,
    })
  } catch (error: any) {
    console.error('Error en debug endpoint:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener datos de debug' },
      { status: 500 }
    )
  }
}


