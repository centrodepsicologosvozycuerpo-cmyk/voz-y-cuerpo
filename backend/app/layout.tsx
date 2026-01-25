import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Backend API',
  description: 'API REST para el sistema de turnos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}

