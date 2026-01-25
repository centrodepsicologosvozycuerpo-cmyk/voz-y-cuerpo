import { NextResponse } from 'next/server'

// Ruta dummy para NextAuth session en el frontend público
// El frontend no necesita autenticación, solo necesitamos esta ruta para evitar errores 404
export async function GET() {
  return NextResponse.json({ user: null }, { status: 200 })
}

