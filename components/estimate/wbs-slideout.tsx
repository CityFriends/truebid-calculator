"use client"

import React, { useState, useEffect } from 'react'
import {
  Target, AlertCircle, Link2, Users, Plus, Trash2, Pencil, Save, X, ShieldAlert
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import type { EnhancedWBSElement, SOORequirement, LaborEstimate, PeriodConfig, WBSRisk } from './types'
import { getTypeColor, getConfidenceColor, formatHours } from './utils'

interface WBSSlideoutProps {
  wbs: EnhancedWBSElement | null
  linkedRequirements: SOORequirement[]
  isOpen: boolean
  onClose: () => void
  onSave: (wbs: EnhancedWBSElement) => void
  onDelete?: (wbsId: string) => void
  companyRoles: Array<{ id: string; title: string }>
  periods: PeriodConfig[]
  isEditing?: boolean
  isNew?: boolean
}

export function WBSSlideout({
  wbs,
  linkedRequirements,
  isOpen,
  onClose,
  onSave,
  onDelete,
  companyRoles,
  periods,
  isEditing: initialIsEditing = false,
  isNew = false,
}: WBSSlideoutProps) {
  const [isEditing, setIsEditing] = useState(initialIsEditing || isNew)
  const [formData, setFormData] = useState<EnhancedWBSElement | null>(null)
  const [newAssumption, setNewAssumption] = useState('')
  const [newRisk, setNewRisk] = useState<Partial<WBSRisk>>({
    description: '',
    probability: 'medium',
    impact: 'medium',
    mitigation: ''
  })

  // Initialize form data when wbs changes
  useEffect(() => {
    if (wbs) {
      setFormData({ ...wbs })
    } else if (isNew) {
      setFormData({
        id: `wbs-${Date.now()}`,
        wbsNumber: '',
        title: '',
        sowReference: '',
        why: '',
        what: '',
        notIncluded: '',
        assumptions: [],
        estimateMethod: 'engineering',
        laborEstimates: [],
        linkedRequirementIds: [],
        totalHours: 0,
        confidence: 'medium',
        risks: [],
        dependencies: [],
      })
    }
    setIsEditing(initialIsEditing || isNew)
  }, [wbs, isNew, initialIsEditing])

  if (!isOpen || !formData) return null

  const handleFieldChange = (field: keyof EnhancedWBSElement, value: unknown) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleAddAssumption = () => {
    if (newAssumption.trim()) {
      setFormData(prev => prev ? {
        ...prev,
        assumptions: [...prev.assumptions, newAssumption.trim()]
      } : null)
      setNewAssumption('')
    }
  }

  const handleRemoveAssumption = (index: number) => {
    setFormData(prev => prev ? {
      ...prev,
      assumptions: prev.assumptions.filter((_, i) => i !== index)
    } : null)
  }

  const handleAddRisk = () => {
    if (newRisk.description?.trim()) {
      const risk: WBSRisk = {
        id: `risk-${Date.now()}`,
        description: newRisk.description.trim(),
        probability: newRisk.probability || 'medium',
        impact: newRisk.impact || 'medium',
        mitigation: newRisk.mitigation?.trim() || ''
      }
      setFormData(prev => prev ? {
        ...prev,
        risks: [...(prev.risks || []), risk]
      } : null)
      setNewRisk({ description: '', probability: 'medium', impact: 'medium', mitigation: '' })
    }
  }

  const handleRemoveRisk = (riskId: string) => {
    setFormData(prev => prev ? {
      ...prev,
      risks: (prev.risks || []).filter(r => r.id !== riskId)
    } : null)
  }

  const handleUpdateRisk = (riskId: string, field: keyof WBSRisk, value: string) => {
    setFormData(prev => prev ? {
      ...prev,
      risks: (prev.risks || []).map(r =>
        r.id === riskId ? { ...r, [field]: value } : r
      )
    } : null)
  }

  const handleLaborChange = (roleId: string, periodKey: string, value: number) => {
    setFormData(prev => {
      if (!prev) return null

      const existingIndex = prev.laborEstimates.findIndex(le => le.roleId === roleId)
      const role = companyRoles.find(r => r.id === roleId)

      if (existingIndex >= 0) {
        // Update existing
        const updated = [...prev.laborEstimates]
        updated[existingIndex] = {
          ...updated[existingIndex],
          hoursByPeriod: {
            ...updated[existingIndex].hoursByPeriod,
            [periodKey]: value,
          }
        }
        const totalHours = updated.reduce((sum, le) =>
          sum + Object.values(le.hoursByPeriod).reduce((a, b) => a + b, 0), 0)
        return { ...prev, laborEstimates: updated, totalHours }
      } else if (value > 0 && role) {
        // Add new
        const newEstimate: LaborEstimate = {
          id: `${prev.id}-labor-${roleId}`,
          roleId,
          roleName: role.title,
          hoursByPeriod: {
            base: periodKey === 'base' ? value : 0,
            option1: periodKey === 'option1' ? value : 0,
            option2: periodKey === 'option2' ? value : 0,
            option3: periodKey === 'option3' ? value : 0,
            option4: periodKey === 'option4' ? value : 0,
          },
          rationale: '',
          confidence: 'medium',
        }
        const updated = [...prev.laborEstimates, newEstimate]
        const totalHours = updated.reduce((sum, le) =>
          sum + Object.values(le.hoursByPeriod).reduce((a, b) => a + b, 0), 0)
        return { ...prev, laborEstimates: updated, totalHours }
      }
      return prev
    })
  }

  const handleRemoveLabor = (roleId: string) => {
    setFormData(prev => {
      if (!prev) return null
      const updated = prev.laborEstimates.filter(le => le.roleId !== roleId)
      const totalHours = updated.reduce((sum, le) =>
        sum + Object.values(le.hoursByPeriod).reduce((a, b) => a + b, 0), 0)
      return { ...prev, laborEstimates: updated, totalHours }
    })
  }

  const handleSave = () => {
    if (formData) {
      onSave(formData)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    if (isNew) {
      onClose()
    } else {
      setFormData(wbs ? { ...wbs } : null)
      setIsEditing(false)
    }
  }

  // Roles that have estimates
  const rolesWithEstimates = formData.laborEstimates.map(le => le.roleId)
  // Roles that can be added
  const availableRoles = companyRoles.filter(r => !rolesWithEstimates.includes(r.id))

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-semibold text-emerald-600">
                {formData.wbsNumber || 'New WBS'}
              </span>
              <Badge
                variant="outline"
                className={`text-xs ${getConfidenceColor(formData.confidence)}`}
              >
                {formData.confidence}
              </Badge>
            </div>
            {!isNew && !isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          <SheetTitle className="text-lg">
            {isEditing ? (
              <Input
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="WBS Title"
                className="text-lg font-semibold"
              />
            ) : (
              formData.title || 'Untitled WBS'
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="flex-1 mt-4">
          <TabsList className="grid w-full grid-cols-4 h-9">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="labor" className="text-xs">Labor</TabsTrigger>
            <TabsTrigger value="assumptions" className="text-xs">Assumptions</TabsTrigger>
            <TabsTrigger value="risks" className="text-xs">Risks</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* WBS Number and SOW Reference */}
            {isEditing && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500 uppercase">WBS Number</Label>
                  <Input
                    value={formData.wbsNumber}
                    onChange={(e) => handleFieldChange('wbsNumber', e.target.value)}
                    placeholder="1.1"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 uppercase">SOW Reference</Label>
                  <Input
                    value={formData.sowReference}
                    onChange={(e) => handleFieldChange('sowReference', e.target.value)}
                    placeholder="Section 3.1"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Why */}
            <div>
              <Label className="text-xs text-gray-500 uppercase tracking-wider">Why (Purpose)</Label>
              {isEditing ? (
                <Textarea
                  value={formData.why}
                  onChange={(e) => handleFieldChange('why', e.target.value)}
                  placeholder="Explain the purpose of this task..."
                  className="mt-1 min-h-[80px]"
                />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{formData.why || 'Not specified'}</p>
              )}
            </div>

            {/* What */}
            <div>
              <Label className="text-xs text-gray-500 uppercase tracking-wider">What (Deliverables)</Label>
              {isEditing ? (
                <Textarea
                  value={formData.what}
                  onChange={(e) => handleFieldChange('what', e.target.value)}
                  placeholder="Describe the deliverables..."
                  className="mt-1 min-h-[80px]"
                />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{formData.what || 'Not specified'}</p>
              )}
            </div>

            {/* Not Included */}
            <div>
              <Label className="text-xs text-gray-500 uppercase tracking-wider">Not Included</Label>
              {isEditing ? (
                <Textarea
                  value={formData.notIncluded}
                  onChange={(e) => handleFieldChange('notIncluded', e.target.value)}
                  placeholder="What is explicitly out of scope..."
                  className="mt-1 min-h-[60px]"
                />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{formData.notIncluded || 'Not specified'}</p>
              )}
            </div>

            {/* Estimate Method & Confidence */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500 uppercase tracking-wider">Estimate Method</Label>
                {isEditing ? (
                  <Select
                    value={formData.estimateMethod}
                    onValueChange={(v) => handleFieldChange('estimateMethod', v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engineering (Bottom-up)</SelectItem>
                      <SelectItem value="analogous">Analogous (Historical)</SelectItem>
                      <SelectItem value="parametric">Parametric (Model-based)</SelectItem>
                      <SelectItem value="expert">Expert Judgment</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-gray-700 mt-1 capitalize">{formData.estimateMethod}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-gray-500 uppercase tracking-wider">Confidence Level</Label>
                {isEditing ? (
                  <Select
                    value={formData.confidence}
                    onValueChange={(v) => handleFieldChange('confidence', v as 'high' | 'medium' | 'low')}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge
                    variant="outline"
                    className={`mt-1 ${getConfidenceColor(formData.confidence)}`}
                  >
                    {formData.confidence}
                  </Badge>
                )}
              </div>
            </div>

            {/* Linked Requirements */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-emerald-600" />
                Linked Requirements ({linkedRequirements.length})
              </h4>
              {linkedRequirements.length > 0 ? (
                <div className="space-y-2">
                  {linkedRequirements.map(req => (
                    <div key={req.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-500">{req.referenceNumber}</span>
                        <Badge variant="outline" className={`text-[10px] ${getTypeColor(req.type)}`}>
                          {req.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{req.title}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No requirements linked</p>
              )}
            </div>
          </TabsContent>

          {/* Labor Tab */}
          <TabsContent value="labor" className="mt-4 space-y-4">
            {/* Summary at top */}
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-800">Total Hours</span>
                <span className="text-lg font-bold text-emerald-700">{formatHours(formData.totalHours)}</span>
              </div>
            </div>

            {/* Labor Estimates */}
            <div className="space-y-3">
              {formData.laborEstimates.map((labor) => (
                <div key={labor.roleId} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{labor.roleName}</span>
                    <div className="flex items-center gap-2">
                      {isEditing && (
                        <Select
                          value={labor.confidence}
                          onValueChange={(v) => {
                            setFormData(prev => {
                              if (!prev) return null
                              const updated = prev.laborEstimates.map(le =>
                                le.roleId === labor.roleId ? { ...le, confidence: v as 'high' | 'medium' | 'low' } : le
                              )
                              return { ...prev, laborEstimates: updated }
                            })
                          }}
                        >
                          <SelectTrigger className="h-7 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {!isEditing && (
                        <Badge variant="outline" className={`text-[10px] ${getConfidenceColor(labor.confidence)}`}>
                          {labor.confidence}
                        </Badge>
                      )}
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                          onClick={() => handleRemoveLabor(labor.roleId)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    {periods.slice(0, 5).map(period => {
                      const hours = labor.hoursByPeriod[period.id as keyof typeof labor.hoursByPeriod] || 0
                      return (
                        <div key={period.id} className="text-center">
                          <div className="text-gray-500 mb-1">{period.shortLabel}</div>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={hours || ''}
                              onChange={(e) => handleLaborChange(labor.roleId, period.id, parseFloat(e.target.value) || 0)}
                              className="h-8 text-center text-xs"
                            />
                          ) : (
                            <div className="font-semibold text-gray-900 p-2 bg-gray-50 rounded">{hours}h</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {/* Rationale */}
                  <div className="mt-2">
                    <Label className="text-[10px] text-gray-500 uppercase">Rationale</Label>
                    {isEditing ? (
                      <Input
                        value={labor.rationale}
                        onChange={(e) => {
                          setFormData(prev => {
                            if (!prev) return null
                            const updated = prev.laborEstimates.map(le =>
                              le.roleId === labor.roleId ? { ...le, rationale: e.target.value } : le
                            )
                            return { ...prev, laborEstimates: updated }
                          })
                        }}
                        placeholder="Rationale for this estimate..."
                        className="text-xs mt-1"
                      />
                    ) : (
                      <p className="text-xs text-gray-600 mt-1">{labor.rationale || 'No rationale provided'}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Role dropdown */}
              {isEditing && availableRoles.length > 0 && (
                <Select onValueChange={(roleId) => handleLaborChange(roleId, 'base', 0)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add labor estimate for role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role.id} value={role.id}>{role.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {formData.laborEstimates.length === 0 && (
                <p className="text-sm text-gray-500 italic text-center py-8">
                  No labor estimates added. {isEditing && availableRoles.length > 0 && 'Select a role above to add one.'}
                </p>
              )}
            </div>
          </TabsContent>

          {/* Assumptions Tab */}
          <TabsContent value="assumptions" className="mt-4 space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Assumptions ({formData.assumptions.length})
            </h4>
            {formData.assumptions.length > 0 ? (
              <ul className="space-y-2">
                {formData.assumptions.map((assumption, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span className="flex-1 text-sm text-gray-700">{assumption}</span>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                        onClick={() => handleRemoveAssumption(idx)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic text-center py-8">No assumptions documented</p>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <Input
                  value={newAssumption}
                  onChange={(e) => setNewAssumption(e.target.value)}
                  placeholder="Add assumption..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAssumption()}
                />
                <Button variant="outline" size="sm" onClick={handleAddAssumption}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Risks Tab */}
          <TabsContent value="risks" className="mt-4 space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              Risks ({(formData.risks || []).length})
            </h4>
            {(formData.risks || []).length > 0 ? (
              <div className="space-y-3">
                {(formData.risks || []).map((risk) => (
                  <div key={risk.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      {isEditing ? (
                        <Textarea
                          value={risk.description}
                          onChange={(e) => handleUpdateRisk(risk.id, 'description', e.target.value)}
                          placeholder="Risk description..."
                          className="flex-1 min-h-[60px] text-sm"
                        />
                      ) : (
                        <p className="flex-1 text-sm text-gray-700">{risk.description}</p>
                      )}
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 flex-shrink-0"
                          onClick={() => handleRemoveRisk(risk.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <Label className="text-[10px] text-gray-500 uppercase">Probability</Label>
                        {isEditing ? (
                          <Select
                            value={risk.probability}
                            onValueChange={(v) => handleUpdateRisk(risk.id, 'probability', v)}
                          >
                            <SelectTrigger className="h-8 text-xs mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className={`mt-1 text-[10px] ${
                            risk.probability === 'high' ? 'text-red-600 border-red-200 bg-red-50' :
                            risk.probability === 'medium' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                            'text-green-600 border-green-200 bg-green-50'
                          }`}>
                            {risk.probability}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-500 uppercase">Impact</Label>
                        {isEditing ? (
                          <Select
                            value={risk.impact}
                            onValueChange={(v) => handleUpdateRisk(risk.id, 'impact', v)}
                          >
                            <SelectTrigger className="h-8 text-xs mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className={`mt-1 text-[10px] ${
                            risk.impact === 'high' ? 'text-red-600 border-red-200 bg-red-50' :
                            risk.impact === 'medium' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                            'text-green-600 border-green-200 bg-green-50'
                          }`}>
                            {risk.impact}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-500 uppercase">Mitigation</Label>
                      {isEditing ? (
                        <Textarea
                          value={risk.mitigation}
                          onChange={(e) => handleUpdateRisk(risk.id, 'mitigation', e.target.value)}
                          placeholder="How to mitigate this risk..."
                          className="mt-1 min-h-[40px] text-xs"
                        />
                      ) : (
                        <p className="text-xs text-gray-600 mt-1">{risk.mitigation || 'No mitigation plan'}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic text-center py-8">No risks documented</p>
            )}

            {/* Add new risk form */}
            {isEditing && (
              <div className="p-3 border border-dashed border-gray-300 rounded-lg space-y-3">
                <Label className="text-xs font-medium text-gray-700">Add New Risk</Label>
                <Textarea
                  value={newRisk.description || ''}
                  onChange={(e) => setNewRisk(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Risk description..."
                  className="min-h-[60px] text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={newRisk.probability || 'medium'}
                    onValueChange={(v) => setNewRisk(prev => ({ ...prev, probability: v as 'low' | 'medium' | 'high' }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Probability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Probability</SelectItem>
                      <SelectItem value="medium">Medium Probability</SelectItem>
                      <SelectItem value="high">High Probability</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={newRisk.impact || 'medium'}
                    onValueChange={(v) => setNewRisk(prev => ({ ...prev, impact: v as 'low' | 'medium' | 'high' }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Impact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Impact</SelectItem>
                      <SelectItem value="medium">Medium Impact</SelectItem>
                      <SelectItem value="high">High Impact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  value={newRisk.mitigation || ''}
                  onChange={(e) => setNewRisk(prev => ({ ...prev, mitigation: e.target.value }))}
                  placeholder="Mitigation strategy..."
                  className="min-h-[40px] text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddRisk}
                  disabled={!newRisk.description?.trim()}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Risk
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <SheetFooter className="border-t pt-4">
          {isEditing ? (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={handleCancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                {isNew ? 'Create' : 'Save'}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 w-full">
              {onDelete && (
                <Button
                  variant="outline"
                  onClick={() => onDelete(formData.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
