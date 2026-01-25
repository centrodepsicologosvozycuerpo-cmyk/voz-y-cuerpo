'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProfessionalsTab } from './professionals-tab'
import { AvailabilityTab } from './availability-tab'
import { ExceptionsTab } from './exceptions-tab'
import { AppointmentsTab } from './appointments-tab'
import { ConfigTab } from './config-tab'
import { AlertTriangle } from 'lucide-react'
import type { Professional, Appointment } from '@/lib/types'

interface AdminPanelProps {
  professionals: (Professional & {
    availabilityRules: any[]
    exceptionDates: any[]
    appointments: Appointment[]
  })[]
  initialAppointments: (Appointment & {
    professional: Professional
  })[]
}

export function AdminPanel({ professionals, initialAppointments }: AdminPanelProps) {
  const [appointments, setAppointments] = useState(initialAppointments)

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Modo Demo - Sin Autenticación
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  Este panel está en modo demo. En producción, se debe implementar autenticación 
                  (NextAuth, Clerk, etc.) para proteger el acceso.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="professionals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="professionals">Profesionales</TabsTrigger>
          <TabsTrigger value="availability">Disponibilidad</TabsTrigger>
          <TabsTrigger value="exceptions">Excepciones</TabsTrigger>
          <TabsTrigger value="appointments">Turnos</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="professionals">
          <ProfessionalsTab professionals={professionals} />
        </TabsContent>

        <TabsContent value="availability">
          <AvailabilityTab professionals={professionals} />
        </TabsContent>

        <TabsContent value="exceptions">
          <ExceptionsTab professionals={professionals} />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsTab appointments={appointments} onUpdate={setAppointments} />
        </TabsContent>

        <TabsContent value="config">
          <ConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}



