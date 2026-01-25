import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { headers } from 'next/headers'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: {
      professional: true,
    },
  })

  return user
}

export async function requireAuth() {
  // Primero intentar con sesión NextAuth
  const user = await getCurrentUser()
  
  if (user && user.professional) {
    return user
  }

  // Si no hay sesión, intentar con token Bearer en Authorization header (para backoffice)
  const headersList = await headers()
  const authHeader = headersList.get('Authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7) // Remover "Bearer "
    
    // El token es el ID del usuario (según auth-client.ts)
    const user = await prisma.user.findUnique({
      where: { id: token },
      include: {
        professional: true,
      },
    })

    if (user && user.professional) {
      return user
    }
  }

  // También intentar con header X-Professional-Id (para compatibilidad)
  const professionalId = headersList.get('X-Professional-Id')
  if (professionalId) {
    const user = await prisma.user.findFirst({
      where: { professionalId },
      include: {
        professional: true,
      },
    })

    if (user && user.professional) {
      return user
    }
  }

  throw new Error('No autorizado')
}


