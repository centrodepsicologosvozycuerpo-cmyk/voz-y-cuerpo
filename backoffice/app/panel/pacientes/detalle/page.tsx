import { Suspense } from 'react'
import { PatientDetailContent } from './content'

function Loading() {
  return <div className="container mx-auto px-4 py-8">Cargando...</div>
}

export default function PatientDetailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PatientDetailContent />
    </Suspense>
  )
}

