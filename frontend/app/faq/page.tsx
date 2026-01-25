import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'Preguntas Frecuentes - FAQ',
  description: 'Respuestas a las preguntas más frecuentes sobre nuestros servicios y proceso de terapia.',
}

const faqs = [
  {
    question: '¿Cómo funciona el sistema de turnos online?',
    answer: 'Podés reservar tu turno de forma sencilla eligiendo el profesional, la modalidad (online o presencial), y seleccionando un horario disponible. Recibirás una confirmación por email y WhatsApp con todos los detalles de tu turno.',
  },
  {
    question: '¿Cuánto duran las sesiones?',
    answer: 'Las sesiones tienen una duración estándar de 50 minutos, aunque esto puede variar según el profesional y el tipo de terapia. Esta información se especifica al momento de reservar tu turno.',
  },
  {
    question: '¿Puedo cancelar o modificar mi turno?',
    answer: 'Sí, podés cancelar tu turno hasta 12 horas antes del horario programado. Para hacerlo, utilizá el link de cancelación que recibiste en la confirmación, o contactanos directamente.',
  },
  {
    question: '¿Qué modalidades de terapia ofrecen?',
    answer: 'Ofrecemos terapia online y presencial. La modalidad online se realiza a través de videollamada segura, mientras que la presencial se lleva a cabo en nuestros consultorios ubicados en CABA y Zona Norte.',
  },
  {
    question: '¿Cómo sé qué profesional es el adecuado para mí?',
    answer: 'En nuestra página de equipo podés ver los perfiles de cada profesional, sus especialidades y enfoque terapéutico. Si tenés dudas, podés contactarnos y te ayudamos a encontrar la mejor opción para vos.',
  },
  {
    question: '¿Los turnos tienen costo?',
    answer: 'Sí, cada profesional tiene su propia tarifa. Algunos profesionales pueden ofrecer la opción de pagar una seña para reservar el turno. Los detalles de pago se coordinan directamente con el profesional.',
  },
  {
    question: '¿Qué pasa si llego tarde a mi sesión?',
    answer: 'Si llegás tarde, el tiempo de la sesión se ajusta al tiempo restante del horario programado. Te recomendamos llegar puntual para aprovechar al máximo tu sesión.',
  },
  {
    question: '¿Mantienen confidencialidad?',
    answer: 'Absolutamente. La confidencialidad es uno de los pilares fundamentales de nuestra práctica profesional. Toda la información compartida en las sesiones es estrictamente confidencial y está protegida por el secreto profesional.',
  },
]

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Preguntas Frecuentes</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Encontrá respuestas a las preguntas más comunes sobre nuestros servicios.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4 mb-12">
        {faqs.map((faq, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{faq.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>¿No encontraste tu respuesta?</CardTitle>
            <CardDescription>
              Contactanos y te ayudamos con cualquier duda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contacto">
                <Button>Contactar</Button>
              </Link>
              <Link href="/turnos">
                <Button variant="outline">Reservar Turno</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



