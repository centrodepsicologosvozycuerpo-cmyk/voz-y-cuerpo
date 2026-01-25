'use client'

// Provider vacío - ya no usamos NextAuth SessionProvider
// La autenticación es manejada por auth-client.ts

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
