import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const startTime = Date.now()
  
  const health = {
    status: 'ok' as 'ok' | 'error',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: {
        status: 'ok' as 'ok' | 'error',
        responseTime: 0,
      },
    },
  }

  // Verificar conexión a la base de datos
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    health.services.database.responseTime = Date.now() - dbStart
    health.services.database.status = 'ok'
  } catch (error) {
    health.services.database.status = 'error'
    health.status = 'error'
  }

  const totalResponseTime = Date.now() - startTime

  return NextResponse.json(
    {
      ...health,
      responseTime: totalResponseTime,
    },
    { status: health.status === 'ok' ? 200 : 503 }
  )
}
