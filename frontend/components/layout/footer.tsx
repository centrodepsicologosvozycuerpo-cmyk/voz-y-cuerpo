import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-muted/50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center md:text-left">
            <h3 className="font-semibold mb-4">Equipo de Psicología</h3>
            <p className="text-sm text-muted-foreground">
              Profesionales comprometidos con tu bienestar emocional y mental.
            </p>
          </div>
          <div className="text-center md:text-left">
            <h4 className="font-semibold mb-4">Navegación</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/equipo" className="text-muted-foreground hover:text-foreground">
                  Equipo
                </Link>
              </li>
              <li>
                <Link href="/servicios" className="text-muted-foreground hover:text-foreground">
                  Servicios
                </Link>
              </li>
              <li>
                <Link href="/notas" className="text-muted-foreground hover:text-foreground">
                  Notas
                </Link>
              </li>
              <li>
                <Link href="/turnos" className="text-muted-foreground hover:text-foreground">
                  Reservar Turno
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-center md:text-left">
            <h4 className="font-semibold mb-4">Información</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-muted-foreground hover:text-foreground">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/politicas" className="text-muted-foreground hover:text-foreground">
                  Políticas de Privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Equipo de Psicología. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}



