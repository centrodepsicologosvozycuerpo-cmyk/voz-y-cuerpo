'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

function buildCostAnswer(consultationFeePesos: number | null): string {
  if (consultationFeePesos != null && consultationFeePesos > 0) {
    const formatted = consultationFeePesos.toLocaleString('es-AR')
    return `Sí, la consulta tiene un valor de $${formatted} por sesión (pesos argentinos). Los detalles de pago se coordinan directamente con el profesional al reservar.`
  }
  return 'Sí, la consulta tiene un costo. Los detalles de pago y el valor se coordinan directamente con el profesional al reservar.'
}

const FAQ_QUESTIONS = [
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
    answerKey: 'cost' as const,
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

export function FAQContent() {
  const [consultationFeePesos, setConsultationFeePesos] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: { consultationFeePesos?: number | null }) => {
        setConsultationFeePesos(data.consultationFeePesos ?? null)
      })
      .catch(() => setConsultationFeePesos(null))
      .finally(() => setLoading(false))
  }, [])

  const faqs = FAQ_QUESTIONS.map((item) => ({
    question: item.question,
    answer: 'answerKey' in item && item.answerKey === 'cost'
      ? buildCostAnswer(consultationFeePesos)
      : item.answer,
  }))

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 mb-12 flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
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
    </>
  )
}
