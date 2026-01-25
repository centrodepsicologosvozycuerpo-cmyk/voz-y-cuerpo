'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import { utcToZonedTime } from 'date-fns-tz'
import { MessageCircle, Mail, X, Check, Clock, AlertCircle } from 'lucide-react'
import { Chip } from '@/components/ui/chip'
import { API_URL } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const TIMEZONE = 'America/Argentina/Buenos_Aires'

interface AppointmentsTabProps {
  professionalId: string
}

export function AppointmentsTab({ professionalId }: AppointmentsTabProps) {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Modal de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    appointmentId: string
    clientName: string
    date: string
  }>({ open: false, appointmentId: '', clientName: '', date: '' })

  // Modal de cancelación
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean
    appointmentId: string
    clientName: string
  }>({ open: false, appointmentId: '', clientName: '' })
  const [cancelReason, setCancelReason] = useState('')

  // Modal de éxito (después de cancelar)
  const [successDialog, setSuccessDialog] = useState<{
    open: boolean
    message: string
    whatsappUrl?: string
  }>({ open: false, message: '' })

  useEffect(() => {
    loadAppointments()
  }, [professionalId])

  const loadAppointments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/panel/appointments?professionalId=${professionalId}`, {
        headers: {
          'X-Professional-Id': professionalId,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const openConfirmDialog = (appointmentId: string, clientName: string, date: string) => {
    setConfirmDialog({ open: true, appointmentId, clientName, date })
  }

  const handleConfirm = async () => {
    setActionLoading(confirmDialog.appointmentId)
    try {
      const res = await fetch(`${API_URL}/api/panel/appointments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Professional-Id': professionalId,
        },
        body: JSON.stringify({ appointmentId: confirmDialog.appointmentId }),
      })

      if (res.ok) {
        loadAppointments()
        setConfirmDialog({ open: false, appointmentId: '', clientName: '', date: '' })
      } else {
        const data = await res.json()
        alert(data.error || 'Error al confirmar')
      }
    } catch (error) {
      alert('Error al confirmar el turno')
    } finally {
      setActionLoading(null)
    }
  }

  const openCancelDialog = (appointmentId: string, clientName: string) => {
    setCancelDialog({ open: true, appointmentId, clientName })
    setCancelReason('')
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Por favor, ingresá un motivo de cancelación')
      return
    }

    setActionLoading(cancelDialog.appointmentId)
    try {
      const res = await fetch(`${API_URL}/api/panel/appointments/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Professional-Id': professionalId,
        },
        body: JSON.stringify({
          appointmentId: cancelDialog.appointmentId,
          reason: cancelReason,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        loadAppointments()
        setCancelDialog({ open: false, appointmentId: '', clientName: '' })
        
        // Mostrar diálogo de éxito con opción de WhatsApp
        setSuccessDialog({
          open: true,
          message: 'Turno cancelado exitosamente. Se envió un email al paciente.',
          whatsappUrl: data.whatsappUrl,
        })
      } else {
        const data = await res.json()
        alert(data.error || 'Error al cancelar')
      }
    } catch (error) {
      alert('Error al cancelar el turno')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION':
        return {
          label: 'Pendiente de confirmación',
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: Clock,
        }
      case 'CONFIRMED':
        return {
          label: 'Confirmado',
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: Check,
        }
      case 'CANCELLED':
        return {
          label: 'Cancelado',
          color: 'bg-gray-100 text-gray-600 border-gray-300',
          icon: X,
        }
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-600',
          icon: AlertCircle,
        }
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando turnos...</div>
  }

  const upcoming = appointments.filter((apt) => new Date(apt.startAt) > new Date())
  const past = appointments.filter((apt) => new Date(apt.startAt) <= new Date())

  // Separar pendientes de confirmados
  const pendingConfirmation = upcoming.filter((apt) => apt.status === 'PENDING_CONFIRMATION')
  const confirmedUpcoming = upcoming.filter((apt) => apt.status === 'CONFIRMED')

  return (
    <div className="space-y-6">
      {/* Turnos pendientes de confirmación */}
      {pendingConfirmation.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Clock className="h-5 w-5" />
              Pendientes de Confirmación ({pendingConfirmation.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingConfirmation.map((apt) => {
                const localStart = utcToZonedTime(new Date(apt.startAt), TIMEZONE)
                const localEnd = utcToZonedTime(new Date(apt.endAt), TIMEZONE)
                const statusInfo = getStatusInfo(apt.status)

                return (
                  <div key={apt.id} className="border border-amber-200 bg-white rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-lg">{apt.clientName}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                            <statusInfo.icon className="h-3 w-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{apt.clientEmail}</p>
                        <p className="text-sm text-muted-foreground">{apt.clientPhone}</p>
                        <p className="mt-2 font-medium">
                          {format(localStart, "EEEE, d 'de' MMMM 'a las' HH:mm", { locale: es })} - {format(localEnd, 'HH:mm')}
                        </p>
                        <div className="mt-2">
                          <Chip variant="secondary" className="text-xs">
                            {apt.modality === 'online' ? '💻 Online' : '🏢 Presencial'}
                            {apt.locationLabel && ` — ${apt.locationLabel}`}
                          </Chip>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openConfirmDialog(
                            apt.id, 
                            apt.clientName,
                            format(localStart, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })
                          )}
                          disabled={actionLoading === apt.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {actionLoading === apt.id ? 'Confirmando...' : 'Confirmar'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCancelDialog(apt.id, apt.clientName)}
                          disabled={actionLoading === apt.id}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Turnos confirmados próximos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Turnos Confirmados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {confirmedUpcoming.length > 0 ? (
            <div className="space-y-3">
              {confirmedUpcoming.map((apt) => {
                const localStart = utcToZonedTime(new Date(apt.startAt), TIMEZONE)
                const localEnd = utcToZonedTime(new Date(apt.endAt), TIMEZONE)
                const statusInfo = getStatusInfo(apt.status)

                return (
                  <div key={apt.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{apt.clientName}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                            <statusInfo.icon className="h-3 w-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{apt.clientEmail}</p>
                        <p className="text-sm text-muted-foreground">{apt.clientPhone}</p>
                        <p className="mt-2">
                          {format(localStart, "EEEE, d 'de' MMMM 'a las' HH:mm", { locale: es })} - {format(localEnd, 'HH:mm')}
                        </p>
                        <div className="mt-2">
                          <Chip variant="secondary" className="text-xs">
                            {apt.modality === 'online' ? '💻 Online' : '🏢 Presencial'}
                            {apt.locationLabel && ` — ${apt.locationLabel}`}
                          </Chip>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCancelDialog(apt.id, apt.clientName)}
                        disabled={actionLoading === apt.id}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No hay turnos confirmados próximos</p>
          )}
        </CardContent>
      </Card>

      {/* Turnos pasados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground">Historial</CardTitle>
        </CardHeader>
        <CardContent>
          {past.length > 0 ? (
            <div className="space-y-2">
              {past.slice(0, 10).map((apt) => {
                const localStart = utcToZonedTime(new Date(apt.startAt), TIMEZONE)
                const statusInfo = getStatusInfo(apt.status)

                return (
                  <div key={apt.id} className="border rounded-lg p-3 opacity-70">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{apt.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(localStart, "d/M/yyyy HH:mm", { locale: es })}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    {apt.cancellationReason && (
                      <p className="text-sm text-red-600 mt-1">
                        Motivo de cancelación: {apt.cancellationReason}
                      </p>
                    )}
                  </div>
                )
              })}
              {past.length > 10 && (
                <p className="text-center text-sm text-muted-foreground">
                  Y {past.length - 10} turnos más...
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No hay historial</p>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmación */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Confirmar Turno
            </DialogTitle>
            <DialogDescription className="pt-2">
              Vas a confirmar el turno de <strong>{confirmDialog.clientName}</strong> para el <strong>{confirmDialog.date}</strong>.
              <br /><br />
              Se enviará un email de confirmación al paciente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={actionLoading === confirmDialog.appointmentId}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-1" />
              {actionLoading === confirmDialog.appointmentId ? 'Confirmando...' : 'Confirmar Turno'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de cancelación */}
      <Dialog open={cancelDialog.open} onOpenChange={(open) => !open && setCancelDialog({ ...cancelDialog, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Turno</DialogTitle>
            <DialogDescription>
              Estás por cancelar el turno de <strong>{cancelDialog.clientName}</strong>.
              <br />
              Se enviará un email al paciente con el motivo de cancelación.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Motivo de cancelación *
            </label>
            <Input
              placeholder="Ej: Indisposición del profesional, reprogramación, etc."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialog({ ...cancelDialog, open: false })}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={!cancelReason.trim() || actionLoading === cancelDialog.appointmentId}
            >
              {actionLoading === cancelDialog.appointmentId ? 'Cancelando...' : 'Confirmar Cancelación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de éxito */}
      <Dialog open={successDialog.open} onOpenChange={(open) => !open && setSuccessDialog({ ...successDialog, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Operación Exitosa
            </DialogTitle>
            <DialogDescription className="pt-2">
              {successDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
            {successDialog.whatsappUrl && (
              <Button
                variant="outline"
                onClick={() => {
                  window.open(successDialog.whatsappUrl, '_blank')
                  setSuccessDialog({ ...successDialog, open: false })
                }}
                className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Notificar por WhatsApp
              </Button>
            )}
            <Button onClick={() => setSuccessDialog({ ...successDialog, open: false })}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
