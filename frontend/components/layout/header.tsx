import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            Equipo de Psicología
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Inicio
            </Link>
            <Link href="/equipo" className="text-sm font-medium hover:text-primary transition-colors">
              Equipo
            </Link>
            <Link href="/servicios" className="text-sm font-medium hover:text-primary transition-colors">
              Servicios
            </Link>
            <Link href="/faq" className="text-sm font-medium hover:text-primary transition-colors">
              Preguntas Frecuentes
            </Link>
            <Link href="/contacto" className="text-sm font-medium hover:text-primary transition-colors">
              Contacto
            </Link>
            <Link href="/turnos">
              <Button size="sm">Reservar Turno</Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}


