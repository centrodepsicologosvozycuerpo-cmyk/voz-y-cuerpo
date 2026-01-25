'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import type { Professional } from '@/lib/types'

interface ProfessionalsTabProps {
  professionals: Professional[]
}

export function ProfessionalsTab({ professionals }: ProfessionalsTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Profesionales Activos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {professionals.map((prof) => {
              const specialties = JSON.parse(prof.specialties || '[]')
              const modalities = JSON.parse(prof.modalities || '[]')

              return (
                <Card key={prof.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{prof.fullName}</h3>
                        <p className="text-muted-foreground">{prof.title}</p>
                        <div className="mt-3 space-y-2">
                          <div>
                            <span className="text-sm font-medium">Especialidades: </span>
                            <div className="inline-flex flex-wrap gap-1">
                              {specialties.map((spec: string) => (
                                <Chip key={spec} variant="secondary" className="text-xs">
                                  {spec}
                                </Chip>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Modalidades: </span>
                            <div className="inline-flex flex-wrap gap-1">
                              {modalities.map((mod: string) => (
                                <Chip key={mod} className="text-xs">
                                  {mod === 'online' ? 'Online' : 'Presencial'}
                                </Chip>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Estado: </span>
                            <Chip variant={prof.isActive ? 'default' : 'outline'} className="text-xs">
                              {prof.isActive ? 'Activo' : 'Inactivo'}
                            </Chip>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button variant="outline" size="sm">
                          {prof.isActive ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



