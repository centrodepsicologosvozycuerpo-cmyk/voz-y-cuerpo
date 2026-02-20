import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contacto - Voz y Cuerpo',
  description: 'Contactá a los profesionales de Voz y Cuerpo por email o WhatsApp.',
}

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
