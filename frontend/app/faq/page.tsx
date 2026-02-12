import { FAQContent } from './faq-content'

export const metadata = {
  title: 'Preguntas Frecuentes - FAQ',
  description: 'Respuestas a las preguntas más frecuentes sobre nuestros servicios y proceso de terapia.',
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



