import "./globals.css"
import { LayoutWrapper } from "@/components/layout/layout-wrapper"
import { Providers } from "./providers"
import { ErrorHandler } from "./error-handler"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <title>Equipo de Psicología - Profesionales comprometidos con tu bienestar</title>
        <meta name="description" content="Equipo de psicólogos especializados en terapia individual, de pareja, familiar y más. Reservá tu turno online." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans">
        <ErrorHandler />
        <Providers>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  )
}
