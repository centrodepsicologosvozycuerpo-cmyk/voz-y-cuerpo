import { EquipoContent } from './equipo-content'
import { getSeoCanonical } from '@/lib/seo'

export const metadata = {
  title: 'Nuestro Equipo - Voz y Cuerpo',
  description: 'Conocé a los profesionales de Voz y Cuerpo. Especialidades, modalidades y perfiles.',
  ...getSeoCanonical('/equipo'),
}

export default function EquipoPage() {
  return <EquipoContent />
}
