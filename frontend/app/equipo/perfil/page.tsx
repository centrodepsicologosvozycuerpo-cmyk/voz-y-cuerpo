import { Suspense } from 'react'
import { ProfessionalProfileContent } from './content'
import { Loader2 } from 'lucide-react'

function Loading() {
  return (
    <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function ProfessionalProfilePage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProfessionalProfileContent />
    </Suspense>
  )
}
