import { ContactoContent } from './contacto-content'
import { getSeoCanonical } from '@/lib/seo'

export const metadata = {
  title: 'Contacto - Voz y Cuerpo',
  description: 'Contactá a los profesionales de Voz y Cuerpo por email o WhatsApp.',
  ...getSeoCanonical('/contacto'),
}

export default function ContactoPage() {
  return <ContactoContent />
}
