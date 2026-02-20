import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reservar Turno - Voz y Cuerpo',
  description: 'Reservá tu turno online con los profesionales de Voz y Cuerpo. Elegí profesional, fecha y horario.',
}

export default function TurnosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
