'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminPanel } from '@/components/admin/admin-panel'
import { isAuthenticated, getAuthUser } from '@/lib/auth-client'
import { Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

export default function AdminPage() {
  const router = useRouter()
  const [professionals, setProfessionals] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar autenticación
    if (!isAuthenticated()) {
      router.push('/panel/login/')
      return
    }

    const user = getAuthUser()
    if (!user || user.role !== 'ADMIN') {
      // Solo admins pueden acceder
      router.push('/panel/')
      return
    }

    // Cargar datos
    const loadData = async () => {
      try {
        const [profRes, apptRes] = await Promise.all([
          fetch(`${API_URL}/api/professionals`),
          fetch(`${API_URL}/api/appointments`),
        ])

        if (profRes.ok) {
          const data = await profRes.json()
          setProfessionals(data)
        }

        if (apptRes.ok) {
          const data = await apptRes.json()
          setAppointments(data.appointments || [])
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <AdminPanel professionals={professionals} initialAppointments={appointments} />
}
