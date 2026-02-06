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
  const headersList = await headers()

  // Primero intentar con Bearer token (backoffice). Así no llamamos a getServerSession
  // y evitamos "Invalid URL" cuando NEXTAUTH_URL no está definida en el backend.
  const authHeader = headersList.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const user = await prisma.user.findUnique({
      where: { id: token },
      include: { professional: true },
    })
    if (user?.professional) return user
  }

  // También intentar con header X-Professional-Id (compatibilidad)
  const professionalId = headersList.get('X-Professional-Id')
  if (professionalId) {
    const user = await prisma.user.findFirst({
      where: { professionalId },
      include: { professional: true },
    })
    if (user?.professional) return user
  }

  // Por último, sesión NextAuth (requiere NEXTAUTH_URL en producción)
  const user = await getCurrentUser()
  if (user?.professional) return user

  throw new Error('No autorizado')
}


