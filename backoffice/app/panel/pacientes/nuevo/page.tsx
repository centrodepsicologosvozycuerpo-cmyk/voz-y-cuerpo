'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { differenceInYears } from 'date-fns'
import { API_URL } from '@/lib/api'
import { authFetch } from '@/lib/auth-client'
import { useToast } from '@/hooks/use-toast'

export default function NewPatientPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    address: '',
    city: '',
    province: '',
    emergencyName: '',
    emergencyRole: '',
    emergencyPhone: '',
    hasInsurance: false,
    insuranceName: '',
    insuranceCardNumber: '',
  })

  const [age, setAge] = useState<number | null>(null)

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value
    setFormData({ ...formData, birthDate: date })
    if (date) {
      const birth = new Date(date)
      const calculatedAge = differenceInYears(new Date(), birth)
      setAge(calculatedAge)
    } else {
      setAge(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        birthDate: new Date(formData.birthDate).toISOString(),
      }

      const res = await authFetch(`${API_URL}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        toast({ title: 'Paciente creado correctamente' })
        router.push(`/panel/pacientes/detalle/?id=${data.patient.id}`)
      } else {
        const error = await res.json()
        toast({ title: error.error || 'Error al crear paciente', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error creating patient:', error)
      toast({ title: 'Error al crear paciente', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/panel">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Panel
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identidad */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Identidad</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Para enviar notificaciones de turnos"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+54 11 1234-5678"
                  />
                </div>
                <div>
                  <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={handleBirthDateChange}
                  />
                </div>
                <div>
                  <Label>Edad</Label>
                  <Input
                    value={age !== null ? `${age} años` : ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dirección</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <Label htmlFor="address">Dirección *</Label>
                  <Input
                    id="address"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Localidad *</Label>
                  <Input
                    id="city"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="province">Provincia *</Label>
                  <Input
                    id="province"
                    required
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Contacto de Emergencia */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contacto de Emergencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="emergencyName">Nombre del Contacto *</Label>
                  <Input
                    id="emergencyName"
                    required
                    value={formData.emergencyName}
                    onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyRole">Rol *</Label>
                  <Input
                    id="emergencyRole"
                    required
                    placeholder="madre, padre, pareja, amigo..."
                    value={formData.emergencyRole}
                    onChange={(e) => setFormData({ ...formData, emergencyRole: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Teléfono *</Label>
                  <Input
                    id="emergencyPhone"
                    required
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Obra Social */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Obra Social</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasInsurance"
                    checked={formData.hasInsurance}
                    onChange={(e) => setFormData({ ...formData, hasInsurance: e.target.checked })}
                  />
                  <Label htmlFor="hasInsurance">¿Tiene obra social?</Label>
                </div>
                {formData.hasInsurance && (
                  <>
                    <div>
                      <Label htmlFor="insuranceName">Nombre de la Obra Social</Label>
                      <Input
                        id="insuranceName"
                        value={formData.insuranceName}
                        onChange={(e) => setFormData({ ...formData, insuranceName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="insuranceCardNumber">Número de Carnet</Label>
                      <Input
                        id="insuranceCardNumber"
                        value={formData.insuranceCardNumber}
                        onChange={(e) => setFormData({ ...formData, insuranceCardNumber: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/panel">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Paciente'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


