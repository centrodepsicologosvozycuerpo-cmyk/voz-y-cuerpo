import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <title>Panel de Administración - Psicólogos</title>
        <meta name="description" content="Panel de gestión para profesionales" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )
}
