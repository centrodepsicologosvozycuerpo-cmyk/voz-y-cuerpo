'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PanelDashboard } from '@/components/panel/panel-dashboard'
import { isAuthenticated, getAuthUser, AuthUser } from '@/lib/auth-client'
import { Loader2 } from 'lucide-react'

export default function PanelPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar autenticación del lado del cliente
    if (!isAuthenticated()) {
      router.push('/panel/login/')
      return
    }

    const authUser = getAuthUser()
    if (!authUser || !authUser.professional) {
      router.push('/panel/login/')
      return
    }

    setUser(authUser)
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <PanelDashboard user={user} />
}
