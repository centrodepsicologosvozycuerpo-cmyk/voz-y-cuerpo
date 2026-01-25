import { TurnosSlugClient } from './client'

// Para static export: retorna array vacío, las rutas se manejan en el cliente
export function generateStaticParams() {
  return []
}

// Permitir rutas dinámicas no pre-generadas
export const dynamicParams = true

export default function ProfessionalTurnosPage() {
  return <TurnosSlugClient />
}
