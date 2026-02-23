import { FAQContent } from './faq-content'
import { getSeoCanonical } from '@/lib/seo'

export const metadata = {
  title: 'Preguntas Frecuentes - Voz y Cuerpo',
  description: 'Respuestas a las preguntas más frecuentes sobre los servicios y el proceso de terapia de Voz y Cuerpo.',
  ...getSeoCanonical('/faq'),
}

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Preguntas Frecuentes</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Encontrá respuestas a las preguntas más comunes sobre nuestros servicios.
        </p>
      </div>

      <FAQContent />
    </div>
  )
}



