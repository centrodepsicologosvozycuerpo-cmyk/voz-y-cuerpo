'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import { Plus, Search, Edit, Trash2, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'
import { API_URL } from '@/lib/api'
import { authFetch } from '@/lib/auth-client'
import { useToast } from '@/hooks/use-toast'

interface Patient {
  id: string
  firstName: string
  lastName: string
  fullName: string
  age: number
  city: string
  province: string
  hasInsurance: boolean
  createdAt: string
  lastVisitAt?: string
  isFrequent: boolean
  appointmentsCount: number
}

interface PatientsTabProps {
  professionalId: string
}

export function PatientsTab({ professionalId }: PatientsTabProps) {
  const { toast } = useToast()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterHasInsurance, setFilterHasInsurance] = useState<string>('all')
  const [filterFrequent, setFilterFrequent] = useState<string>('all')

  useEffect(() => {
    loadPatients()
  }, [search, filterHasInsurance, filterFrequent])

  const loadPatients = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filterHasInsurance !== 'all') params.append('hasInsurance', filterHasInsurance)
      if (filterFrequent !== 'all') params.append('isFrequent', filterFrequent)

      const res = await authFetch(`${API_URL}/api/patients?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setPatients(data.patients || [])
      }
    } catch (error) {
      console.error('Error loading patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (patientId: string, patientName: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${patientName}?`)) {
      return
    }

    try {
      const res = await authFetch(`${API_URL}/api/patients/${patientId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({ title: 'Paciente eliminado correctamente' })
        loadPatients()
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Error al eliminar paciente', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error deleting patient:', error)
      toast({ title: 'Error al eliminar paciente', variant: 'destructive' })
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando pacientes...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pacientes</h2>
        <Link href="/panel/pacientes/nuevo">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Paciente
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nombre, apellido, localidad..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="insurance">Obra Social</Label>
                <select
                  id="insurance"
                  value={filterHasInsurance}
                  onChange={(e) => setFilterHasInsurance(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="all">Todas</option>
                  <option value="true">Con obra social</option>
                  <option value="false">Sin obra social</option>
                </select>
              </div>
              <div>
                <Label htmlFor="frequent">Frecuentes</Label>
                <select
                  id="frequent"
                  value={filterFrequent}
                  onChange={(e) => setFilterFrequent(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="all">Todos</option>
                  <option value="true">Con reservas</option>
                  <option value="false">Sin reservas</option>
                </select>
              </div>
            </div>

            {/* Tabla */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Nombre</th>
                    <th className="px-4 py-2 text-left">Edad</th>
                    <th className="px-4 py-2 text-left">Localidad/Provincia</th>
                    <th className="px-4 py-2 text-left">Obra Social</th>
                    <th className="px-4 py-2 text-left">Fecha Alta</th>
                    <th className="px-4 py-2 text-left">Última Atención</th>
                    <th className="px-4 py-2 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No hay pacientes registrados
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient) => (
                      <tr key={patient.id} className="border-t">
                        <td className="px-4 py-2">
                          <div className="font-medium">{patient.fullName}</div>
                          {patient.isFrequent && (
                            <span className="text-xs text-blue-600">Frecuente</span>
                          )}
                        </td>
                        <td className="px-4 py-2">{patient.age} años</td>
                        <td className="px-4 py-2">
                          {patient.city}, {patient.province}
                        </td>
                        <td className="px-4 py-2">
                          {patient.hasInsurance ? 'Sí' : 'No'}
                        </td>
                        <td className="px-4 py-2">
                          {format(new Date(patient.createdAt), 'dd/MM/yyyy', { locale: es })}
                        </td>
                        <td className="px-4 py-2">
                          {patient.lastVisitAt
                            ? format(new Date(patient.lastVisitAt), 'dd/MM/yyyy', { locale: es })
                            : '-'}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Link href={`/panel/pacientes/detalle/?id=${patient.id}`}>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(patient.id, patient.fullName)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


