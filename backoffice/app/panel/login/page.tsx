'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login, isAuthenticated } from '@/lib/auth-client'
import { API_URL } from '@/lib/api'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Estado para "Olvidé mi contraseña"
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotError, setForgotError] = useState('')

  // Si ya está autenticado, redirigir al panel
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/panel/')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)

      if (!result.success) {
        setError(result.error || 'Error al iniciar sesión')
      } else {
        router.push('/panel/')
      }
    } catch (err) {
      setError('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setForgotLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })

      if (res.ok) {
        setForgotSuccess(true)
      } else {
        const data = await res.json()
        setForgotError(data.error || 'Error al enviar el email')
      }
    } catch (err) {
      setForgotError('Error de conexión')
    } finally {
      setForgotLoading(false)
    }
  }

  // Vista de "Olvidé mi contraseña"
  if (showForgotPassword) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Recuperar Contraseña</CardTitle>
              <CardDescription>
                Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forgotSuccess ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">¡Email enviado!</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Si el email está registrado, recibirás un enlace para restablecer tu contraseña.
                    Revisá tu bandeja de entrada y spam.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForgotPassword(false)
                      setForgotSuccess(false)
                      setForgotEmail('')
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {forgotError && (
                    <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                      {forgotError}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="forgotEmail">Email</Label>
                    <Input
                      id="forgotEmail"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      placeholder="tu@email.com"
                      autoComplete="email"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={forgotLoading}>
                    <Mail className="h-4 w-4 mr-2" />
                    {forgotLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setShowForgotPassword(false)
                      setForgotError('')
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al login
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Vista normal de login
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Accedé a tu panel de administración
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-md">
              <p className="text-sm font-semibold mb-2">Credenciales demo:</p>
              <p className="text-xs text-muted-foreground">
                Email: nombre1@dominio.com (o nombre2, nombre3, nombre4)
              </p>
              <p className="text-xs text-muted-foreground">
                Password: Demo1234!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
