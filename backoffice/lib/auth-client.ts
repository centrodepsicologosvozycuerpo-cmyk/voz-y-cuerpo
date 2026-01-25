// Autenticación del lado del cliente para sitio estático
// Maneja login, logout y verificación de sesión

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USER_KEY = 'auth_user'

export interface AuthUser {
  id: string
  email: string
  professionalId: string
  role: string
  professional: {
    id: string
    fullName: string
    slug: string
  }
}

export interface LoginResult {
  success: boolean
  error?: string
  user?: AuthUser
}

// Guardar token y usuario en sessionStorage (se borra al cerrar navegador)
export function saveAuth(token: string, user: AuthUser): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token)
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  }
}

// Obtener token guardado
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(AUTH_TOKEN_KEY)
  }
  return null
}

// Obtener usuario guardado
export function getAuthUser(): AuthUser | null {
  if (typeof window !== 'undefined') {
    const userStr = sessionStorage.getItem(AUTH_USER_KEY)
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
  }
  return null
}

// Limpiar autenticación (logout)
export function clearAuth(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_USER_KEY)
  }
}

// Verificar si hay sesión activa
export function isAuthenticated(): boolean {
  return getAuthToken() !== null && getAuthUser() !== null
}

// Login con email y password
export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || 'Email o contraseña incorrectos',
      }
    }

    const data = await res.json()
    
    // El backend devuelve el usuario con token
    const user: AuthUser = {
      id: data.id,
      email: data.email,
      professionalId: data.professionalId,
      role: data.role,
      professional: data.professional,
    }
    
    // Guardar en sessionStorage
    // Usamos el ID como "token" simple ya que el backend no retorna JWT
    // En producción, el backend debería retornar un JWT real
    const token = data.token || data.id
    saveAuth(token, user)
    
    return { success: true, user }
  } catch (error) {
    console.error('[Auth] Login error:', error)
    return {
      success: false,
      error: 'Error de conexión. Verificá que el servidor esté funcionando.',
    }
  }
}

// Logout
export function logout(): void {
  clearAuth()
  if (typeof window !== 'undefined') {
    window.location.href = '/panel/login/'
  }
}

// Hacer fetch autenticado al backend
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken()
  
  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}

