'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Plus, Trash2 } from 'lucide-react'
import { API_URL } from '@/lib/api'
import { authFetch } from '@/lib/auth-client'
import { useToast } from '@/hooks/use-toast'

interface CalendarTabProps {
  professionalId: string
}

interface Rule {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  slotMinutes: number
  bufferMinutes: number
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Componente para editar una regla individual con estado local
function RuleEditor({ 
  rule, 
  onUpdate, 
  onDelete,
  onError,
}: { 
  rule: Rule
  onUpdate: (ruleId: string, updates: Partial<Rule>) => Promise<{ success: boolean; error?: string }>
  onDelete: (ruleId: string) => Promise<void>
  onError: (message: string) => void
}) {
  // Estado local para edición
  const [localRule, setLocalRule] = useState({
    startTime: rule.startTime,
    endTime: rule.endTime,
    slotMinutes: rule.slotMinutes,
    bufferMinutes: rule.bufferMinutes,
  })
  const [saving, setSaving] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Sincronizar cuando cambia la prop rule
  useEffect(() => {
    setLocalRule({
      startTime: rule.startTime,
      endTime: rule.endTime,
      slotMinutes: rule.slotMinutes,
      bufferMinutes: rule.bufferMinutes,
    })
    setHasError(false)
  }, [rule.id, rule.startTime, rule.endTime, rule.slotMinutes, rule.bufferMinutes])

  const handleBlur = async (field: keyof typeof localRule) => {
    const currentValue = localRule[field]
    const originalValue = rule[field]
    
    // Solo guardar si el valor cambió
    if (currentValue !== originalValue) {
      setSaving(true)
      setHasError(false)
      try {
        const result = await onUpdate(rule.id, { [field]: currentValue })
        if (!result.success) {
          // Revertir al valor original si hay error
          setLocalRule(prev => ({ ...prev, [field]: originalValue }))
          setHasError(true)
          onError(result.error || 'Error al actualizar')
        }
      } finally {
        setSaving(false)
      }
    }
  }

  return (
    <div className={`flex gap-3 items-end p-3 rounded-md ${saving ? 'opacity-70' : ''} ${hasError ? 'bg-red-50 border border-red-200' : 'bg-muted'}`}>
      <div className="flex-1 grid grid-cols-2 gap-3">
        <div>
          <Label>Desde</Label>
          <Input
            type="time"
            value={localRule.startTime}
            onChange={(e) => setLocalRule(prev => ({ ...prev, startTime: e.target.value }))}
            onBlur={() => handleBlur('startTime')}
            disabled={saving}
          />
        </div>
        <div>
          <Label>Hasta</Label>
          <Input
            type="time"
            value={localRule.endTime}
            onChange={(e) => setLocalRule(prev => ({ ...prev, endTime: e.target.value }))}
            onBlur={() => handleBlur('endTime')}
            disabled={saving}
          />
        </div>
        <div>
          <Label>Duración (min)</Label>
          <Input
            type="number"
            value={localRule.slotMinutes}
            onChange={(e) => setLocalRule(prev => ({ ...prev, slotMinutes: parseInt(e.target.value) || 0 }))}
            onBlur={() => handleBlur('slotMinutes')}
            disabled={saving}
          />
        </div>
        <div>
          <Label>Buffer (min)</Label>
          <Input
            type="number"
            value={localRule.bufferMinutes}
            onChange={(e) => setLocalRule(prev => ({ ...prev, bufferMinutes: parseInt(e.target.value) || 0 }))}
            onBlur={() => handleBlur('bufferMinutes')}
            disabled={saving}
          />
        </div>
      </div>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => onDelete(rule.id)}
        disabled={saving}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Componente para crear un nuevo rango (borrador)
function NewRuleEditor({
  dayOfWeek,
  onSave,
  onCancel,
}: {
  dayOfWeek: number
  onSave: (rule: { startTime: string; endTime: string; slotMinutes: number; bufferMinutes: number }) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
}) {
  const [localRule, setLocalRule] = useState({
    startTime: '',
    endTime: '',
    slotMinutes: 50,
    bufferMinutes: 10,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!localRule.startTime || !localRule.endTime) {
      setError('Completá los horarios de inicio y fin')
      return
    }

    setSaving(true)
    setError(null)
    const result = await onSave(localRule)
    setSaving(false)

    if (!result.success) {
      setError(result.error || 'Error al guardar')
    }
  }

  return (
    <div className={`flex gap-3 items-end p-3 rounded-md border-2 border-dashed border-primary/50 bg-primary/5 ${saving ? 'opacity-70' : ''}`}>
      <div className="flex-1 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Desde *</Label>
            <Input
              type="time"
              value={localRule.startTime}
              onChange={(e) => setLocalRule(prev => ({ ...prev, startTime: e.target.value }))}
              disabled={saving}
              autoFocus
            />
          </div>
          <div>
            <Label>Hasta *</Label>
            <Input
              type="time"
              value={localRule.endTime}
              onChange={(e) => setLocalRule(prev => ({ ...prev, endTime: e.target.value }))}
              disabled={saving}
            />
          </div>
          <div>
            <Label>Duración (min)</Label>
            <Input
              type="number"
              value={localRule.slotMinutes}
              onChange={(e) => setLocalRule(prev => ({ ...prev, slotMinutes: parseInt(e.target.value) || 0 }))}
              disabled={saving}
            />
          </div>
          <div>
            <Label>Buffer (min)</Label>
            <Input
              type="number"
              value={localRule.bufferMinutes}
              onChange={(e) => setLocalRule(prev => ({ ...prev, bufferMinutes: parseInt(e.target.value) || 0 }))}
              disabled={saving}
            />
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            Guardar
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}

export function CalendarTab({ professionalId }: CalendarTabProps) {
  const { toast } = useToast()
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [newRuleForDay, setNewRuleForDay] = useState<number | null>(null)

  const loadRules = useCallback(async () => {
    try {
      const res = await authFetch(`${API_URL}/api/panel/availability`)
      if (res.ok) {
        const data = await res.json()
        setRules(data.rules || [])
      }
    } catch (error) {
      console.error('Error loading rules:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRules()
  }, [professionalId, loadRules])

  const saveNewRule = async (dayOfWeek: number, ruleData: { startTime: string; endTime: string; slotMinutes: number; bufferMinutes: number }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authFetch(`${API_URL}/api/panel/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek,
          ...ruleData,
        }),
      })

      if (res.ok) {
        loadRules()
        setNewRuleForDay(null)
        return { success: true }
      } else {
        const errorData = await res.json()
        return { success: false, error: errorData.error || 'No se pudo agregar el rango' }
      }
    } catch (error) {
      console.error('Error adding rule:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }

  const updateRule = useCallback(async (ruleId: string, updates: Partial<Rule>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authFetch(`${API_URL}/api/panel/availability/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (res.ok) {
        // Actualizar estado local sin recargar todo
        setRules(prev => prev.map(r => 
          r.id === ruleId ? { ...r, ...updates } : r
        ))
        return { success: true }
      } else {
        const errorData = await res.json()
        // Recargar para sincronizar si hubo error
        loadRules()
        return { success: false, error: errorData.error }
      }
    } catch (error) {
      console.error('Error updating rule:', error)
      loadRules()
      return { success: false, error: 'Error de conexión' }
    }
  }, [loadRules])

  const deleteRule = useCallback(async (ruleId: string) => {
    try {
      const res = await authFetch(`${API_URL}/api/panel/availability/${ruleId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        // Eliminar del estado local
        setRules(prev => prev.filter(r => r.id !== ruleId))
      } else {
        const errorData = await res.json()
        toast({
          title: 'Error',
          description: errorData.error || 'No se pudo eliminar el rango',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
      toast({
        title: 'Error',
        description: 'Error al eliminar el rango',
        variant: 'destructive',
      })
    }
  }, [toast])

  const showError = useCallback((message: string) => {
    toast({
      title: 'Error de validación',
      description: message,
      variant: 'destructive',
    })
  }, [toast])

  const rulesByDay: Record<number, Rule[]> = {}
  rules.forEach((rule) => {
    if (!rulesByDay[rule.dayOfWeek]) {
      rulesByDay[rule.dayOfWeek] = []
    }
    rulesByDay[rule.dayOfWeek].push(rule)
  })

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Disponibilidad Semanal
          </CardTitle>
          <CardDescription>
            Configurá tus horarios de atención por día de la semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <div key={day} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{DAYS[day]}</h3>
                  {newRuleForDay !== day && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNewRuleForDay(day)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Rango
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {rulesByDay[day]?.map((rule) => (
                    <RuleEditor
                      key={rule.id}
                      rule={rule}
                      onUpdate={updateRule}
                      onDelete={deleteRule}
                      onError={showError}
                    />
                  ))}
                  
                  {newRuleForDay === day && (
                    <NewRuleEditor
                      dayOfWeek={day}
                      onSave={(ruleData) => saveNewRule(day, ruleData)}
                      onCancel={() => setNewRuleForDay(null)}
                    />
                  )}
                  
                  {!rulesByDay[day]?.length && newRuleForDay !== day && (
                    <p className="text-sm text-muted-foreground">No hay horarios configurados</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


