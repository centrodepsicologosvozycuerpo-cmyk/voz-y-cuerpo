'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { fetchBanners, type Banner } from '@/lib/api'

export function HeroCarousel() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  // Cargar banners al montar el componente (una sola vez)
  useEffect(() => {
    let mounted = true
    
    fetchBanners().then((data) => {
      if (mounted) {
        setBanners(data)
        setIsLoading(false)
      }
    })

    return () => { mounted = false }
  }, [])

  // Manejar reproducción de videos cuando cambia el índice
  useEffect(() => {
    if (banners.length === 0) return

    // Pausar todos los videos primero
    videoRefs.current.forEach((video) => {
      if (video) {
        video.pause()
        video.currentTime = 0
      }
    })

    const currentBanner = banners[currentIndex]
    if (currentBanner?.mediaType !== 'video') return

    // Pequeño delay para asegurar que el DOM esté actualizado después del cambio de opacidad
    const timer = setTimeout(() => {
      const currentVideo = videoRefs.current[currentIndex]
      if (currentVideo) {
        currentVideo.currentTime = 0
        if (currentVideo.readyState < 2) {
          currentVideo.load()
        }
        const playPromise = currentVideo.play()
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.warn(`Error al reproducir video ${currentIndex}:`, error)
          })
        }
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [currentIndex, banners])

  // Auto-avanzar el carrusel
  useEffect(() => {
    if (banners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [banners.length])

  // Si no hay banners, mostrar fondo con gradiente
  const showFallback = !isLoading && banners.length === 0

  return (
    <section className="relative h-[500px] md:h-[600px] overflow-hidden">
      {/* Fondo de fallback (gradiente) cuando no hay banners */}
      {(isLoading || showFallback) && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-primary/80" />
      )}

      {/* Banners del carrusel */}
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {banner.mediaType === 'video' ? (
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
              <source src={banner.url} type="video/mp4" />
            </video>
          ) : (
            <img
              src={banner.urls.hero || banner.url}
              alt={banner.title || 'Banner'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
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

      {/* Indicadores del carrusel (solo si hay más de 1 banner) */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Ir a banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

