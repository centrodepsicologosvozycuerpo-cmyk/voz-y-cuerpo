import "./globals.css"
import { LayoutWrapper } from "@/components/layout/layout-wrapper"
import { Providers } from "./providers"
import { ErrorHandler } from "./error-handler"
import type { Metadata } from "next"
import { CANONICAL_BASE } from "@/lib/seo"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || CANONICAL_BASE

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Voz y Cuerpo - Profesionales comprometidos con tu bienestar",
  description: "Voz y Cuerpo. Psicólogos especializados en terapia individual, de pareja, familiar y más. Reservá tu turno online.",
  keywords: ["psicología", "terapia", "turnos online", "Voz y Cuerpo", "terapia individual", "terapia de pareja", "terapia familiar"],
  authors: [{ name: "Voz y Cuerpo" }],
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Voz y Cuerpo",
    title: "Voz y Cuerpo - Profesionales comprometidos con tu bienestar",
    description: "Psicólogos especializados en terapia individual, de pareja, familiar. Reservá tu turno online.",
    ...(baseUrl && { url: baseUrl }),
  },
  twitter: {
    card: "summary_large_image",
    title: "Voz y Cuerpo - Profesionales comprometidos con tu bienestar",
    description: "Psicólogos especializados en terapia individual, de pareja, familiar. Reservá tu turno online.",
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
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
