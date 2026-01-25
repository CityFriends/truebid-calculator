"use client"

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { ClipboardList, Grid3X3, Calendar } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAppContext, type ExtractedRequirement } from '@/contexts/app-context'
import { requirementsApi } from '@/lib/api'
import { useParams } from 'next/navigation'

// Import estimate components
import {
  StatsBar,
  RequirementsView,
  LaborMatrixView,
  TimelineView,
  WBSSlideout,
  type SOORequirement,
  type EnhancedWBSElement,
  type LaborEstimate,
  type PeriodConfig,
  DEFAULT_PERIODS,
  mapToSOOType,
  mapTypeToCategory,
} from '@/components/estimate'

export function EstimateTab() {
  const {
    companyRoles,
    solicitation,
    estimateWbsElements,
    setEstimateWbsElements,
    uiBillableHours,
    extractedRequirements,
    setExtractedRequirements,
  } = useAppContext()

  const params = useParams()
  const proposalId = params?.id as string | undefined

  // View state
  const [activeView, setActiveView] = useState<string>('requirements')
  const [activePeriod, setActivePeriod] = useState<string>('base')

  // Requirements state
  const [requirements, setRequirements] = useState<SOORequirement[]>([])
  const [selectedRequirements, setSelectedRequirements] = useState<Set<string>>(new Set())

  // WBS state
  const [wbsElements, setWbsElements] = useState<EnhancedWBSElement[]>([])
  const [selectedWbs, setSelectedWbs] = useState<EnhancedWBSElement | null>(null)
  const [showWbsSlideout, setShowWbsSlideout] = useState(false)
  const [isEditingWbs, setIsEditingWbs] = useState(false)
  const [isNewWbs, setIsNewWbs] = useState(false)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingRequirementIds, setGeneratingRequirementIds] = useState<Set<string>>(new Set())

  // Initialize state ref
  const isInitializedRef = useRef(false)

  // Periods configuration
  const periods: PeriodConfig[] = useMemo(() => {
    const pop = solicitation?.periodOfPerformance
    if (!pop) return DEFAULT_PERIODS.slice(0, 3)

    const activePeriods: PeriodConfig[] = [DEFAULT_PERIODS[0]]
    const optionCount = typeof pop.optionYears === 'number' ? pop.optionYears : 2
    for (let i = 1; i <= Math.min(optionCount, 4); i++) {
      activePeriods.push(DEFAULT_PERIODS[i])
    }
    return activePeriods
  }, [solicitation?.periodOfPerformance])

  // Load requirements from context
  useEffect(() => {
    // Sync WBS from context
    if (estimateWbsElements && estimateWbsElements.length > 0) {
      const enhancedWbs: EnhancedWBSElement[] = estimateWbsElements.map(wbs => {
        const enhanced = wbs as unknown as Partial<EnhancedWBSElement>
        return {
          id: wbs.id,
          wbsNumber: wbs.wbsNumber,
          title: wbs.title,
          sowReference: enhanced.sowReference || '',
          why: enhanced.why || '',
          what: enhanced.what || wbs.description || '',
          notIncluded: enhanced.notIncluded || '',
          assumptions: enhanced.assumptions || [],
          estimateMethod: enhanced.estimateMethod || 'engineering',
          laborEstimates: wbs.laborEstimates.map((le, idx) => ({
            id: le.id || `${wbs.id}-labor-${idx}`,
            roleId: le.roleId,
            roleName: le.roleName,
            hoursByPeriod: {
              base: le.hoursByPeriod.base || 0,
              option1: le.hoursByPeriod.option1 || 0,
              option2: le.hoursByPeriod.option2 || 0,
              option3: le.hoursByPeriod.option3 || 0,
              option4: le.hoursByPeriod.option4 || 0,
            },
            rationale: le.rationale,
            confidence: le.confidence,
          })),
          linkedRequirementIds: enhanced.linkedRequirementIds || [],
          totalHours: wbs.totalHours || 0,
          confidence: enhanced.confidence || 'medium',
          risks: enhanced.risks || [],
          dependencies: enhanced.dependencies || [],
        }
      })
      setWbsElements(enhancedWbs)
    }

    // Sync requirements from context
    if (extractedRequirements && extractedRequirements.length > 0) {
      const mappedRequirements: SOORequirement[] = extractedRequirements.map((req, index) => {
        const text = req.text || req.description || ''
        let title = req.title
        if (!title && text) {
          const firstSentenceMatch = text.match(/^[^.!?]+[.!?]/)
          title = firstSentenceMatch
            ? firstSentenceMatch[0].trim()
            : text.slice(0, 100) + (text.length > 100 ? '...' : '')
        }
        const referenceNumber = req.reference_number || `REQ-${String(index + 1).padStart(3, '0')}`

        return {
          id: req.id || `req-${index + 1}`,
          referenceNumber,
          title: title || `Requirement ${index + 1}`,
          description: text,
          type: mapToSOOType(req.type),
          category: mapTypeToCategory(req.type),
          source: req.sourceSection || req.source || 'RFP',
          priority: 'medium' as const,
          linkedWbsIds: req.linkedWbsIds || []
        }
      })
      setRequirements(mappedRequirements)
      // Select all by default
      setSelectedRequirements(new Set(mappedRequirements.map(r => r.id)))
      isInitializedRef.current = true
      return
    }

    if (isInitializedRef.current) return
    if (!solicitation?.analyzedFromDocument) {
      setRequirements([])
    }
    isInitializedRef.current = true
  }, [extractedRequirements, solicitation?.analyzedFromDocument, estimateWbsElements])

  // Computed values
  const stats = useMemo(() => {
    const total = requirements.length
    const selected = selectedRequirements.size
    const wbsCount = wbsElements.length
    const totalHours = wbsElements.reduce((sum, w) => sum + w.totalHours, 0)
    // Estimated cost: simplified calculation (hours * avg rate)
    const avgRate = 150 // placeholder
    const estimatedCost = totalHours * avgRate

    return { total, selected, wbsCount, totalHours, estimatedCost }
  }, [requirements, selectedRequirements, wbsElements])

  const allSelected = useMemo(() => {
    if (requirements.length === 0) return false
    return requirements.every(r => selectedRequirements.has(r.id))
  }, [requirements, selectedRequirements])

  // Handlers
  const handleToggleRequirementSelection = useCallback((reqId: string) => {
    setSelectedRequirements(prev => {
      const next = new Set(prev)
      if (next.has(reqId)) {
        next.delete(reqId)
      } else {
        next.add(reqId)
      }
      return next
    })
  }, [])

  const handleSelectAllRequirements = useCallback(() => {
    if (allSelected) {
      setSelectedRequirements(new Set())
    } else {
      setSelectedRequirements(new Set(requirements.map(r => r.id)))
    }
  }, [allSelected, requirements])

  const handleLinkWbsToRequirement = useCallback((reqId: string, wbsId: string) => {
    const currentReq = requirements.find(r => r.id === reqId)
    const newLinkedWbsIds = currentReq && !currentReq.linkedWbsIds.includes(wbsId)
      ? [...currentReq.linkedWbsIds, wbsId]
      : currentReq?.linkedWbsIds || [wbsId]

    setRequirements(prev => prev.map(req => {
      if (req.id === reqId && !req.linkedWbsIds.includes(wbsId)) {
        return { ...req, linkedWbsIds: [...req.linkedWbsIds, wbsId] }
      }
      return req
    }))

    setWbsElements(prev => prev.map(wbs => {
      if (wbs.id === wbsId && !wbs.linkedRequirementIds.includes(reqId)) {
        return { ...wbs, linkedRequirementIds: [...wbs.linkedRequirementIds, reqId] }
      }
      return wbs
    }))

    // Sync to context
    setEstimateWbsElements(prev => (prev || []).map(wbs => {
      if (wbs.id === wbsId && !wbs.linkedRequirementIds?.includes(reqId)) {
        return { ...wbs, linkedRequirementIds: [...(wbs.linkedRequirementIds || []), reqId] }
      }
      return wbs
    }))
    setExtractedRequirements((prev: ExtractedRequirement[]) => (prev || []).map(req => {
      if (req.id === reqId && !req.linkedWbsIds?.includes(wbsId)) {
        return { ...req, linkedWbsIds: [...(req.linkedWbsIds || []), wbsId] }
      }
      return req
    }))

    // Sync to API
    if (proposalId) {
      const uuidOnly = newLinkedWbsIds.filter((id: string) => !id.startsWith('wbs-'))
      if (uuidOnly.length > 0) {
        requirementsApi.update(proposalId, { reqId, linked_wbs_ids: uuidOnly })
          .catch(err => console.warn('[Estimate] Failed to sync requirement link to API:', err))
      }
    }
  }, [setEstimateWbsElements, setExtractedRequirements, requirements, proposalId])

  const handleViewWbs = useCallback((wbs: EnhancedWBSElement) => {
    setSelectedWbs(wbs)
    setShowWbsSlideout(true)
    setIsEditingWbs(false)
    setIsNewWbs(false)
  }, [])

  const handleAddWbs = useCallback(() => {
    setSelectedWbs(null)
    setShowWbsSlideout(true)
    setIsEditingWbs(true)
    setIsNewWbs(true)
  }, [])

  const handleSaveWbs = useCallback((wbs: EnhancedWBSElement) => {
    if (isNewWbs) {
      const newWbsId = wbs.id.startsWith('wbs-') ? wbs.id : `wbs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newWbs = { ...wbs, id: newWbsId }

      setWbsElements(prev => [...prev, newWbs])
      setEstimateWbsElements(prev => [...(prev || []), {
        id: newWbsId,
        wbsNumber: wbs.wbsNumber,
        title: wbs.title,
        description: wbs.what,
        laborEstimates: wbs.laborEstimates,
        status: 'draft',
        totalHours: wbs.totalHours,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }])
    } else {
      setWbsElements(prev => prev.map(w => w.id === wbs.id ? wbs : w))
      setEstimateWbsElements(prev => (prev || []).map(w =>
        w.id === wbs.id ? {
          ...w,
          wbsNumber: wbs.wbsNumber,
          title: wbs.title,
          description: wbs.what,
          laborEstimates: wbs.laborEstimates,
          totalHours: wbs.totalHours,
          updatedAt: new Date().toISOString(),
        } : w
      ))
    }

    setShowWbsSlideout(false)
    setSelectedWbs(null)
    setIsEditingWbs(false)
    setIsNewWbs(false)
  }, [isNewWbs, setEstimateWbsElements])

  const handleDeleteWbs = useCallback((wbsId: string) => {
    setWbsElements(prev => prev.filter(w => w.id !== wbsId))
    setEstimateWbsElements(prev => (prev || []).filter(w => w.id !== wbsId))
    setRequirements(prev => prev.map(req => ({
      ...req,
      linkedWbsIds: req.linkedWbsIds.filter(id => id !== wbsId)
    })))
    setShowWbsSlideout(false)
    setSelectedWbs(null)
  }, [setEstimateWbsElements])

  const handleUpdateHours = useCallback((wbsId: string, roleId: string, periodKey: string, hours: number) => {
    setWbsElements(prev => prev.map(wbs => {
      if (wbs.id !== wbsId) return wbs

      const existingIndex = wbs.laborEstimates.findIndex(le => le.roleId === roleId)
      let updatedEstimates: LaborEstimate[]

      if (existingIndex >= 0) {
        updatedEstimates = wbs.laborEstimates.map((le, idx) =>
          idx === existingIndex
            ? { ...le, hoursByPeriod: { ...le.hoursByPeriod, [periodKey]: hours } }
            : le
        )
      } else if (hours > 0) {
        const role = companyRoles.find(r => r.id === roleId)
        if (!role) return wbs
        const newEstimate: LaborEstimate = {
          id: `${wbsId}-labor-${roleId}`,
          roleId,
          roleName: role.title,
          hoursByPeriod: {
            base: periodKey === 'base' ? hours : 0,
            option1: periodKey === 'option1' ? hours : 0,
            option2: periodKey === 'option2' ? hours : 0,
            option3: periodKey === 'option3' ? hours : 0,
            option4: periodKey === 'option4' ? hours : 0,
          },
          rationale: '',
          confidence: 'medium',
        }
        updatedEstimates = [...wbs.laborEstimates, newEstimate]
      } else {
        return wbs
      }

      const totalHours = updatedEstimates.reduce((sum, le) =>
        sum + Object.values(le.hoursByPeriod).reduce((a, b) => a + b, 0), 0)

      return { ...wbs, laborEstimates: updatedEstimates, totalHours }
    }))

    setEstimateWbsElements(prev => (prev || []).map(wbs => {
      if (wbs.id !== wbsId) return wbs
      const existingIndex = wbs.laborEstimates.findIndex(le => le.roleId === roleId)
      if (existingIndex >= 0) {
        const updated = [...wbs.laborEstimates]
        updated[existingIndex] = {
          ...updated[existingIndex],
          hoursByPeriod: { ...updated[existingIndex].hoursByPeriod, [periodKey]: hours }
        }
        const totalHours = updated.reduce((sum, le) =>
          sum + Object.values(le.hoursByPeriod).reduce((a, b) => a + b, 0), 0)
        return { ...wbs, laborEstimates: updated, totalHours }
      }
      return wbs
    }))
  }, [companyRoles, setEstimateWbsElements])

  // Generate WBS for selected requirements
  const handleGenerateWbs = useCallback(async () => {
    const selectedReqs = requirements.filter(r => selectedRequirements.has(r.id))
    if (selectedReqs.length === 0) return

    setIsGenerating(true)
    setGeneratingRequirementIds(new Set(selectedReqs.map(r => r.id)))

    const availableRolesForApi = companyRoles.map(r => ({
      id: r.id,
      name: r.title,
      laborCategory: r.laborCategory,
      description: r.description,
      levels: r.levels.map(l => ({
        level: l.level,
        levelName: l.levelName,
        yearsExperience: l.yearsExperience,
        baseSalary: l.steps[0]?.salary || 0,
      })),
    }))

    try {
      const response = await fetch('/api/generate-wbs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements: selectedReqs,
          availableRoles: availableRolesForApi,
          existingWbsNumbers: wbsElements.map(w => w.wbsNumber),
          contractContext: {
            title: solicitation?.title || 'Untitled',
            agency: solicitation?.clientAgency || 'Government Agency',
            contractType: solicitation?.contractType?.toLowerCase() || 'tm',
            periodOfPerformance: solicitation?.periodOfPerformance || { baseYear: true, optionYears: 2 }
          }
        })
      })

      if (!response.ok) throw new Error('Failed to generate WBS')

      const data = await response.json()
      const generatedWbs = data.wbsElements || []

      const newWbs = generatedWbs.map((wbs: EnhancedWBSElement) => ({
        ...wbs,
        id: `wbs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))

      setWbsElements(prev => [...prev, ...newWbs])
      setEstimateWbsElements(prev => [...(prev || []), ...newWbs])

      newWbs.forEach((wbs: EnhancedWBSElement) => {
        if (wbs.linkedRequirementIds) {
          wbs.linkedRequirementIds.forEach(reqId => {
            handleLinkWbsToRequirement(reqId, wbs.id)
          })
        }
      })
    } catch (err) {
      console.error('[EstimateTab] WBS generation failed:', err)
    } finally {
      setIsGenerating(false)
      setGeneratingRequirementIds(new Set())
    }
  }, [requirements, selectedRequirements, wbsElements, companyRoles, solicitation, setEstimateWbsElements, handleLinkWbsToRequirement])

  // Get linked requirements for WBS slideout
  const getLinkedRequirements = useCallback((wbs: EnhancedWBSElement | null) => {
    if (!wbs) return []
    return requirements.filter(req => req.linkedWbsIds.includes(wbs.id))
  }, [requirements])

  return (
    <TooltipProvider>
      <div className="absolute inset-0 flex flex-col bg-white overflow-hidden">
        {/* Stats Bar */}
        <StatsBar
          totalRequirements={stats.total}
          selectedRequirements={stats.selected}
          wbsCount={stats.wbsCount}
          totalHours={stats.totalHours}
          estimatedCost={stats.estimatedCost}
          periods={periods}
          activePeriod={activePeriod}
          onPeriodChange={setActivePeriod}
        />

        {/* Tabs */}
        <Tabs value={activeView} onValueChange={setActiveView} className="flex-1 flex flex-col min-h-0">
          <div className="flex-shrink-0 border-b border-gray-200 px-4">
            <TabsList className="h-12 bg-transparent p-0 gap-4">
              <TabsTrigger
                value="requirements"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 rounded-none px-1 pb-3 pt-3"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Requirements
              </TabsTrigger>
              <TabsTrigger
                value="labor-matrix"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 rounded-none px-1 pb-3 pt-3"
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Labor Matrix
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 rounded-none px-1 pb-3 pt-3"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Timeline
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="requirements" className="flex-1 m-0 overflow-hidden">
            <RequirementsView
              requirements={requirements}
              wbsElements={wbsElements}
              selectedIds={selectedRequirements}
              onToggleSelection={handleToggleRequirementSelection}
              onSelectAll={handleSelectAllRequirements}
              onGenerateWbs={handleGenerateWbs}
              isGenerating={isGenerating}
              generatingIds={generatingRequirementIds}
              onViewWbs={handleViewWbs}
              hasUploadedRfp={!!solicitation?.analyzedFromDocument}
              allSelected={allSelected}
            />
          </TabsContent>

          <TabsContent value="labor-matrix" className="flex-1 m-0 overflow-hidden">
            <LaborMatrixView
              wbsElements={wbsElements}
              periods={periods}
              activePeriod={activePeriod}
              companyRoles={companyRoles.map(r => ({ id: r.id, title: r.title }))}
              onUpdateHours={handleUpdateHours}
              onViewWbs={handleViewWbs}
              onAddWbs={handleAddWbs}
            />
          </TabsContent>

          <TabsContent value="timeline" className="flex-1 m-0 overflow-hidden">
            <TimelineView
              wbsElements={wbsElements}
              periods={periods}
              companyRoles={companyRoles.map(r => ({ id: r.id, title: r.title }))}
              billableHoursPerMonth={uiBillableHours || 160}
            />
          </TabsContent>
        </Tabs>

        {/* WBS Slideout */}
        <WBSSlideout
          wbs={selectedWbs}
          linkedRequirements={getLinkedRequirements(selectedWbs)}
          isOpen={showWbsSlideout}
          onClose={() => {
            setShowWbsSlideout(false)
            setSelectedWbs(null)
            setIsEditingWbs(false)
            setIsNewWbs(false)
          }}
          onSave={handleSaveWbs}
          onDelete={handleDeleteWbs}
          companyRoles={companyRoles.map(r => ({ id: r.id, title: r.title }))}
          periods={periods}
          isEditing={isEditingWbs}
          isNew={isNewWbs}
        />
      </div>
    </TooltipProvider>
  )
}
