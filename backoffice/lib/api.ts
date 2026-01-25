// Helper para hacer fetch a la API del backend
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

export async function fetchProfessionals() {
  const res = await fetch(`${API_URL}/api/professionals`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error('Failed to fetch professionals')
  }
  return res.json()
}

export async function fetchAppointments() {
  const res = await fetch(`${API_URL}/api/panel/appointments`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error('Failed to fetch appointments')
  }
  const data = await res.json()
  return data.appointments || []
}

