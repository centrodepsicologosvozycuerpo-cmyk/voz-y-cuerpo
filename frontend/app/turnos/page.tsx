import { TurnosContent } from './turnos-content'
import { getSeoCanonical } from '@/lib/seo'

export const metadata = {
  title: 'Reservar Turno - Voz y Cuerpo',
  description: 'Reservá tu turno online con los profesionales de Voz y Cuerpo. Elegí profesional, fecha y horario.',
  ...getSeoCanonical('/turnos'),
}

export default function TurnosPage() {
  return <TurnosContent />
}
