'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

// Videos del banner
const carouselVideos = [
  '/banner1.mp4',
  '/banner5.mp4',
  '/banner2.mp4',
  '/banner3.mp4',
  '/banner4.mp4',
]

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => {
    // Pausar todos los videos primero
    videoRefs.current.forEach((video) => {
      if (video) {
        video.pause()
        video.currentTime = 0
      }
    })

    // Pequeño delay para asegurar que el DOM esté actualizado después del cambio de opacidad
    const timer = setTimeout(() => {
      // Reproducir el video actual
      const currentVideo = videoRefs.current[currentIndex]
      if (currentVideo) {
        // Reiniciar el video al inicio
        currentVideo.currentTime = 0
        // Forzar carga si es necesario
        if (currentVideo.readyState < 2) {
          currentVideo.load()
        }
        // Intentar reproducir
        const playPromise = currentVideo.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Video reproducido exitosamente
            })
            .catch((error) => {
              console.warn(`Error al reproducir video ${currentIndex}:`, error)
            })
        }
      }
    }, 200) // Delay para que la transición de opacidad termine

    return () => clearTimeout(timer)
  }, [currentIndex])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselVideos.length)
    }, 8000) // Cambia cada 8 segundos

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative h-[500px] md:h-[600px] overflow-hidden">
      {/* Videos del carrusel */}
      {carouselVideos.map((video, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <video
            ref={(el) => {
              videoRefs.current[index] = el
            }}
            className="absolute inset-0 w-full h-full object-cover"
            loop
            muted
            playsInline
            preload="metadata"
          >
            <source src={video} type="video/mp4" />
          </video>
          {/* Overlay oscuro para mejorar legibilidad del texto */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
      ))}

      {/* Contenido del banner (fijo, no se mueve) */}
      <div className="relative h-full flex items-center z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-lg">
              Tu bienestar emocional es nuestra prioridad
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 drop-shadow-md">
              Contamos con un equipo de profesionales especializados en diferentes áreas de la psicología, 
              listos para acompañarte en tu proceso de crecimiento personal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/turnos">
                <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90">
                  Reservar Turno
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/equipo">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 text-white border-white/30 hover:bg-white/20">
                  Conocer al Equipo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores del carrusel */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        {carouselVideos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Ir a video ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

