import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Backend API',
    version: '1.0.0',
    endpoints: {
      professionals: '/api/professionals',
      appointments: '/api/appointments',
      availability: '/api/availability',
      auth: '/api/auth',
    },
  })
}

