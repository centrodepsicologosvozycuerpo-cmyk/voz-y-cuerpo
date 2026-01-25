'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Check, X as XIcon, Plus, UserMinus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'
import { API_URL } from '@/lib/api'
import { authFetch } from '@/lib/auth-client'
import { useToast } from '@/hooks/use-toast'
import { AddProfessionalDialog } from './add-professional-dialog'

interface ChangeRequestsTabProps {
  currentUserId: string
  currentProfessionalId: string
}

export function ChangeRequestsTab({ currentUserId, currentProfessionalId }: ChangeRequestsTabProps) {
  const { toast } = useToast()
  const [requests, setRequests] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [requestsRes, professionalsRes] = await Promise.all([
        authFetch(`${API_URL}/api/panel/change-requests`),
        fetch(`${API_URL}/api/professionals`)
      ])

      if (requestsRes.ok) {
        const data = await requestsRes.json()
        setRequests(data.requests || [])
      }

      if (professionalsRes.ok) {
        const data = await professionalsRes.json()
        // Filtrar solo profesionales activos que no sean el usuario actual
        setProfessionals(data.filter((p: any) => p.isActive && p.id !== currentProfessionalId))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (requestId: string, decision: 'APPROVE' | 'REJECT') => {
    try {
      const res = await authFetch(`${API_URL}/api/panel/change-requests/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, decision }),
      })

      if (res.ok) {
        loadData()
        toast({
          variant: 'success',
          title: 'Éxito',
          description: 'Voto registrado correctamente',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Error al votar',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al votar',
      })
    }
  }

  const handleRequestRemove = async (professionalId: string, professionalName: string) => {
    const isSelf = professionalId === currentProfessionalId
    const message = isSelf 
      ? '¿Estás seguro de solicitar tu baja como profesional?' 
      : `¿Estás seguro de solicitar la baja de ${professionalName}?`

    if (!confirm(`${message} Esta acción requiere la aprobación de los demás profesionales.`)) {
      return
    }

    try {
      const res = await authFetch(`${API_URL}/api/panel/change-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'REMOVE_PROFESSIONAL',
          targetProfessionalId: professionalId,
        }),
      })

      if (res.ok) {
        toast({
          variant: 'success',
          title: 'Éxito',
          description: 'Solicitud de baja creada. Esperá la aprobación de los demás profesionales.',
        })
        loadData()
      } else {
        const error = await res.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Error al crear la solicitud',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al crear la solicitud',
      })
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta solicitud? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const res = await authFetch(`${API_URL}/api/panel/change-requests?id=${requestId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({
          variant: 'success',
          title: 'Éxito',
          description: 'Solicitud eliminada correctamente',
        })
        loadData()
      } else {
        const error = await res.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Error al eliminar la solicitud',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al eliminar la solicitud',
      })
    }
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  const pending = requests.filter((r) => r.status === 'PENDING')
  const resolved = requests.filter((r) => r.status !== 'PENDING')

  // Verificar si ya hay una solicitud pendiente para cada profesional
  const getPendingRequestForProfessional = (profId: string) => {
    return pending.find(r => 
      r.type === 'REMOVE_PROFESSIONAL' && 
      r.targetProfessionalId === profId
    )
  }

  return (
    <div className="space-y-6">
      {/* Acciones - Alta */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitar Alta</CardTitle>
          <CardDescription>
            Solicitá el alta de nuevos profesionales al equipo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Solicitar Alta de Profesional
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Profesionales para solicitar baja */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitar Baja</CardTitle>
          <CardDescription>
            Solicitá la baja de un profesional del equipo (requiere votación)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Opción para darse de baja a sí mismo */}
            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <div>
                <p className="font-medium">Mi cuenta</p>
                <p className="text-sm text-muted-foreground">Solicitar mi propia baja</p>
              </div>
              {getPendingRequestForProfessional(currentProfessionalId) ? (
                <Chip variant="secondary">Solicitud pendiente</Chip>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRequestRemove(currentProfessionalId, 'tu cuenta')}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Solicitar Mi Baja
                </Button>
              )}
            </div>

            {/* Lista de otros profesionales */}
            {professionals.map((prof) => {
              const pendingRequest = getPendingRequestForProfessional(prof.id)
              const specialties = JSON.parse(prof.specialties || '[]')

              return (
                <div key={prof.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{prof.fullName}</p>
                    <p className="text-sm text-muted-foreground">{prof.title}</p>
                    {specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {specialties.slice(0, 3).map((spec: string) => (
                          <Chip key={spec} variant="secondary" className="text-xs">
                            {spec}
                          </Chip>
                        ))}
                        {specialties.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{specialties.length - 3} más</span>
                        )}
                      </div>
                    )}
                  </div>
                  {pendingRequest ? (
                    <Chip variant="secondary">Solicitud pendiente</Chip>
                  ) : (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleRequestRemove(prof.id, prof.fullName)}
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Solicitar Baja
                    </Button>
                  )}
                </div>
              )
            })}

            {professionals.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No hay otros profesionales activos
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Solicitudes Pendientes - Votación */}
      <Card>
        <CardHeader>
          <CardTitle>Votación de Solicitudes</CardTitle>
          <CardDescription>
            Votá las solicitudes de alta y baja de profesionales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length > 0 ? (
            <div className="space-y-4">
              {pending.map((req) => {
                const isCreator = req.createdBy.id === currentUserId
                const hasVoted = req.votes.some((v: any) => v.voter.id === currentUserId)
                const approvals = req.votes.filter((v: any) => v.decision === 'APPROVE').length
                const rejections = req.votes.filter((v: any) => v.decision === 'REJECT').length

                return (
                  <div key={req.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Chip variant={req.type === 'ADD_PROFESSIONAL' ? 'default' : 'secondary'}>
                            {req.type === 'ADD_PROFESSIONAL' ? 'Alta' : 'Baja'}
                          </Chip>
                          <span className="text-sm text-muted-foreground">
                            Creada por {req.createdBy.email}
                          </span>
                        </div>

                        {req.type === 'ADD_PROFESSIONAL' && req.payloadJson && (
                          <div className="mt-2 text-sm">
                            <p className="font-medium">
                              {JSON.parse(req.payloadJson).fullName} - {JSON.parse(req.payloadJson).title}
                            </p>
                          </div>
                        )}

                        {req.type === 'REMOVE_PROFESSIONAL' && req.targetProfessional && (
                          <div className="mt-2 text-sm">
                            <p className="font-medium">
                              {req.targetProfessional.fullName} - {req.targetProfessional.title}
                            </p>
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-4">
                          <span className="text-sm">
                            <span className="text-green-600 font-medium">{approvals}</span> aprobaciones
                          </span>
                          <span className="text-sm">
                            <span className="text-red-600 font-medium">{rejections}</span> rechazos
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCreator && (
                          <>
                          <Chip variant="outline">Tu solicitud</Chip>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteRequest(req.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </>
                        )}

                        {hasVoted && !isCreator && (
                          <Chip variant="secondary">Ya votaste</Chip>
                        )}

                        {!isCreator && !hasVoted && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500 text-green-600 hover:bg-green-50"
                              onClick={() => handleVote(req.id, 'APPROVE')}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleVote(req.id, 'REJECT')}
                            >
                              <XIcon className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No hay solicitudes pendientes de votación</p>
          )}
        </CardContent>
      </Card>

      {/* Solicitudes Resueltas */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Solicitudes</CardTitle>
        </CardHeader>
        <CardContent>
          {resolved.length > 0 ? (
            <div className="space-y-3">
              {resolved.map((req) => (
                <div key={req.id} className="border rounded-lg p-3 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Chip variant={req.type === 'ADD_PROFESSIONAL' ? 'default' : 'secondary'}>
                        {req.type === 'ADD_PROFESSIONAL' ? 'Alta' : 'Baja'}
                      </Chip>
                      <Chip variant={req.status === 'APPROVED' ? 'default' : 'outline'}>
                        {req.status === 'APPROVED' ? 'Aprobada' : req.status === 'REJECTED' ? 'Rechazada' : req.status}
                      </Chip>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(req.createdAt), 'd/M/yyyy', { locale: es })}
                    </span>
                  </div>
                  {req.type === 'ADD_PROFESSIONAL' && req.payloadJson && (
                    <p className="mt-2 text-sm">
                      {JSON.parse(req.payloadJson).fullName}
                    </p>
                  )}
                  {req.type === 'REMOVE_PROFESSIONAL' && req.targetProfessional && (
                    <p className="mt-2 text-sm">
                      {req.targetProfessional.fullName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No hay solicitudes en el historial</p>
          )}
        </CardContent>
      </Card>

      {/* Dialog para agregar profesional */}
      {showAddDialog && (
        <AddProfessionalDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          currentProfessionalId={currentProfessionalId}
          onSuccess={() => {
            setShowAddDialog(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}
