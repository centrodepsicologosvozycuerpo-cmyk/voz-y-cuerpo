import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-session'

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    professional: user.professional,
  })
}


