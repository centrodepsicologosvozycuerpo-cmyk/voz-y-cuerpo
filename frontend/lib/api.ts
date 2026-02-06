// Helper para hacer fetch a la API del backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

export async function fetchProfessionals() {
  try {
    const res = await fetch(`${API_URL}/api/professionals`, {
      cache: 'no-store',
    })
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error')
      console.error(`Failed to fetch professionals: ${res.status} ${res.statusText}`, errorText)
      throw new Error(`Failed to fetch professionals: ${res.status} ${res.statusText}. Make sure the backend is running on ${API_URL}`)
    }
    return res.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend at ${API_URL}. Make sure the backend is running.`)
    }
    throw error
  }
}

export async function fetchProfessionalBySlug(slug: string) {
  const res = await fetch(`${API_URL}/api/professionals`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error('Failed to fetch professional')
  }
  const professionals = await res.json()
  return professionals.find((p: any) => p.slug === slug) || null
}

export async function fetchProfessionalById(id: string) {
  const res = await fetch(`${API_URL}/api/professionals/${id}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    return null
  }
  const data = await res.json()
  return data.professional || null
}

export async function fetchAvailability(professionalSlug: string, from: string, to: string, modality?: string) {
  const params = new URLSearchParams({
    professionalSlug,
    from,
    to,
  })
  if (modality) {
    params.append('modality', modality)
  }
  
  const res = await fetch(`${API_URL}/api/availability?${params.toString()}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error('Failed to fetch availability')
  }
  const data = await res.json()
  return data.slots || []
}

export async function fetchAppointmentByToken(token: string) {
  const res = await fetch(`${API_URL}/api/appointments/by-token?cancelToken=${token}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    return null
  }
  return res.json()
}

export async function fetchAppointmentById(id: string) {
  const res = await fetch(`${API_URL}/api/appointments/${id}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    return null
  }
  return res.json()
}

export interface Banner {
  id: string
  title: string | null
  mediaType: 'image' | 'video'
  url: string
  urls: {
    original: string
    hero?: string
  }
  order: number
}

export async function fetchBanners(): Promise<Banner[]> {
  try {
    const res = await fetch(`${API_URL}/api/banners`, {
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('Failed to fetch banners:', res.status)
      return []
    }
    const data = await res.json()
    return data.banners || []
  } catch (error) {
    console.error('Error fetching banners:', error)
    return []
  }
}

