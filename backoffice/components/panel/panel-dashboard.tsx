'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarTab } from './calendar-tab'
import { OverridesTab } from './overrides-tab'
import { AppointmentsTab } from './appointments-tab'
import { ProfessionalsTab } from './professionals-tab'
import { ChangeRequestsTab } from './change-requests-tab'
import { PatientsTab } from './patients-tab'
import { ConfigTab } from './config-tab'
import { NewsTab } from './news-tab'
import { LogoutButton } from './logout-button'
import type { AuthUser } from '@/lib/auth-client'

interface PanelDashboardProps {
  user: AuthUser
}

export function PanelDashboard({ user }: PanelDashboardProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {user.professional.fullName}
        </h1>
        <LogoutButton />
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="calendar">Mi Calendario</TabsTrigger>
          <TabsTrigger value="overrides">Días Especiales</TabsTrigger>
          <TabsTrigger value="appointments">Mis Turnos</TabsTrigger>
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
          <TabsTrigger value="professionals">Mi Perfil</TabsTrigger>
          <TabsTrigger value="news">Noticias</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="change-requests">Solicitudes</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <CalendarTab professionalId={user.professionalId} />
        </TabsContent>

        <TabsContent value="overrides">
          <OverridesTab professionalId={user.professionalId} />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsTab professionalId={user.professionalId} />
        </TabsContent>

        <TabsContent value="patients">
          <PatientsTab professionalId={user.professionalId} />
        </TabsContent>

        <TabsContent value="professionals">
          <ProfessionalsTab professionalId={user.professionalId} />
        </TabsContent>

        <TabsContent value="news">
          <NewsTab />
        </TabsContent>

        <TabsContent value="config">
          <ConfigTab />
        </TabsContent>

        <TabsContent value="change-requests">
          <ChangeRequestsTab currentUserId={user.id} currentProfessionalId={user.professionalId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
