import { Suspense } from 'react'
import { ReservarHorarioContent } from './content'

function Loading() {
  return <div className="container mx-auto px-4 py-8">Cargando...</div>
}

export default function ReservarHorarioPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ReservarHorarioContent />
    </Suspense>
  )
}

