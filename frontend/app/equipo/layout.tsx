import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nuestro Equipo - Voz y Cuerpo',
  description: 'Conocé a los profesionales de Voz y Cuerpo. Especialidades, modalidades y perfiles.',
}

export default function EquipoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
