"use client"

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  ClipboardList, Grid3X3, Calendar, Sparkles, ChevronDown, CheckCircle2, X, Clock, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAppContext, type ExtractedRequirement } from '@/contexts/app-context'
import { requirementsApi, wbsApi } from '@/lib/api'
import { useParams } from 'next/navigation'

// Import new components
import {
  RequirementsView,
  LaborMatrixView,
  TimelineView,
  WBSSlideout,
  type SOORequirement,
  type EnhancedWBSElement,
  type LaborEstimate,
  type EstimateViewType,
  type PeriodConfig,
  DEFAULT_PERIODS,
  formatHours,
  mapToSOOType,
  mapTypeToCategory,
  generateNextWbsNumber,
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
  const [activeView, setActiveView] = useState<EstimateViewType>('requirements')
  const [activePeriod, setActivePeriod] = useState<string>('base')

  // Requirements state
  const [requirements, setRequirements] = useState<SOORequirement[]>([])
  const [requirementSearch, setRequirementSearch] = useState('')
  const [requirementFilter, setRequirementFilter] = useState<'all' | 'unmapped' | 'mapped'>('all')
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
    if (!pop) return DEFAULT_PERIODS.slice(0, 3) // Default: Base + 2 option years

    const activePeriods: PeriodConfig[] = [DEFAULT_PERIODS[0]] // Always include base
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
  const filteredRequirements = useMemo(() => {
    let filtered = requirements

    if (requirementSearch) {
      const search = requirementSearch.toLowerCase()
      filtered = filtered.filter(req =>
        req.title.toLowerCase().includes(search) ||
        req.referenceNumber.toLowerCase().includes(search) ||
        req.description.toLowerCase().includes(search)
      )
    }

    if (requirementFilter === 'unmapped') {
      filtered = filtered.filter(req => req.linkedWbsIds.length === 0)
    } else if (requirementFilter === 'mapped') {
      filtered = filtered.filter(req => req.linkedWbsIds.length > 0)
    }

    return filtered
  }, [requirements, requirementSearch, requirementFilter])

  const stats = useMemo(() => {
    const total = requirements.length
    const mapped = requirements.filter(r => r.linkedWbsIds.length > 0).length
    const unmapped = total - mapped
    const totalHours = wbsElements.reduce((sum, w) => sum + w.totalHours, 0)

    return { total, mapped, unmapped, totalHours }
  }, [requirements, wbsElements])

  const selectedUnmappedCount = useMemo(() => {
    return Array.from(selectedRequirements).filter(id => {
      const req = requirements.find(r => r.id === id)
      return req && req.linkedWbsIds.length === 0
    }).length
  }, [selectedRequirements, requirements])

  const allFilteredSelected = useMemo(() => {
    if (filteredRequirements.length === 0) return false
    return filteredRequirements.every(r => selectedRequirements.has(r.id))
  }, [filteredRequirements, selectedRequirements])

  const someFilteredSelected = useMemo(() => {
    if (filteredRequirements.length === 0) return false
    const selectedCount = filteredRequirements.filter(r => selectedRequirements.has(r.id)).length
    return selectedCount > 0 && selectedCount < filteredRequirements.length
  }, [filteredRequirements, selectedRequirements])

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

  const handleSelectAllFiltered = useCallback(() => {
    const filteredIds = filteredRequirements.map(r => r.id)
    const allSelected = filteredIds.every(id => selectedRequirements.has(id))
    if (allSelected) {
      setSelectedRequirements(prev => {
        const next = new Set(prev)
        filteredIds.forEach(id => next.delete(id))
        return next
      })
    } else {
      setSelectedRequirements(prev => new Set([...prev, ...filteredIds]))
    }
  }, [filteredRequirements, selectedRequirements])

  const handleSelectAllUnmapped = useCallback(() => {
    const unmappedIds = requirements
      .filter(r => r.linkedWbsIds.length === 0)
      .map(r => r.id)
    setSelectedRequirements(new Set(unmappedIds))
  }, [requirements])

  const handleClearSelection = useCallback(() => {
    setSelectedRequirements(new Set())
  }, [])

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

  const handleUnlinkWbsFromRequirement = useCallback((reqId: string, wbsId: string) => {
    const currentReq = requirements.find(r => r.id === reqId)
    const newLinkedWbsIds = currentReq
      ? currentReq.linkedWbsIds.filter(id => id !== wbsId)
      : []

    setRequirements(prev => prev.map(req => {
      if (req.id === reqId) {
        return { ...req, linkedWbsIds: req.linkedWbsIds.filter(id => id !== wbsId) }
      }
      return req
    }))

    setWbsElements(prev => prev.map(wbs => {
      if (wbs.id === wbsId) {
        return { ...wbs, linkedRequirementIds: wbs.linkedRequirementIds.filter(id => id !== reqId) }
      }
      return wbs
    }))

    // Sync to context
    setEstimateWbsElements(prev => (prev || []).map(wbs => {
      if (wbs.id === wbsId) {
        return { ...wbs, linkedRequirementIds: (wbs.linkedRequirementIds || []).filter(id => id !== reqId) }
      }
      return wbs
    }))
    setExtractedRequirements((prev: ExtractedRequirement[]) => (prev || []).map(req => {
      if (req.id === reqId) {
        return { ...req, linkedWbsIds: (req.linkedWbsIds || []).filter(id => id !== wbsId) }
      }
      return req
    }))

    // Sync to API
    if (proposalId) {
      const uuidOnly = newLinkedWbsIds.filter((id: string) => !id.startsWith('wbs-'))
      requirementsApi.update(proposalId, { reqId, linked_wbs_ids: uuidOnly })
        .catch(err => console.warn('[Estimate] Failed to sync requirement unlink to API:', err))
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
      // Create new WBS
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
      // Update existing WBS
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

    // Sync to context (debounced in production)
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
  const handleBulkGenerateWBS = useCallback(async () => {
    const selectedReqs = requirements.filter(r =>
      selectedRequirements.has(r.id) && r.linkedWbsIds.length === 0
    )

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

      // Add generated WBS and auto-link
      const newWbs = generatedWbs.map((wbs: EnhancedWBSElement) => ({
        ...wbs,
        id: `wbs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))

      setWbsElements(prev => [...prev, ...newWbs])
      setEstimateWbsElements(prev => [...(prev || []), ...newWbs])

      // Auto-link to requirements
      newWbs.forEach((wbs: EnhancedWBSElement) => {
        if (wbs.linkedRequirementIds) {
          wbs.linkedRequirementIds.forEach(reqId => {
            handleLinkWbsToRequirement(reqId, wbs.id)
          })
        }
      })

      setSelectedRequirements(new Set())
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

  // View tabs
  const viewTabs = [
    { id: 'requirements' as const, label: 'Requirements', icon: ClipboardList },
    { id: 'labor-matrix' as const, label: 'Labor Matrix', icon: Grid3X3 },
    { id: 'timeline' as const, label: 'Timeline', icon: Calendar },
  ]

  return (
    <TooltipProvider>
      <div className="absolute inset-0 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Estimate</h1>
              <p className="text-sm text-gray-500 mt-1">
                {stats.total} requirements → {wbsElements.length} WBS elements
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {selectedRequirements.size > 0 && (
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-sm text-gray-600">
                    {selectedRequirements.size} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelection}
                    className="h-7 w-7 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={selectedUnmappedCount === 0 || isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate WBS
                    {selectedUnmappedCount > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-emerald-500 text-white">
                        {selectedUnmappedCount}
                      </Badge>
                    )}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleBulkGenerateWBS} disabled={isGenerating}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate for {selectedUnmappedCount} selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSelectAllUnmapped}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Select all unmapped ({stats.unmapped})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{stats.mapped}</span> mapped
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{stats.unmapped}</span> unmapped
              </span>
            </div>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Total: <span className="font-medium text-gray-900">{formatHours(stats.totalHours)} hours</span>
              </span>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex gap-1 mt-4 -mb-4 -mx-6 px-6 border-t border-gray-100 pt-4 bg-gray-50">
            {viewTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                  ${activeView === tab.id
                    ? 'bg-white text-emerald-600 border border-gray-200 border-b-white -mb-px'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden bg-white">
          {activeView === 'requirements' && (
            <RequirementsView
              requirements={filteredRequirements}
              wbsElements={wbsElements}
              stats={stats}
              searchQuery={requirementSearch}
              onSearchChange={setRequirementSearch}
              filterStatus={requirementFilter}
              onFilterChange={setRequirementFilter}
              selectedIds={selectedRequirements}
              onToggleSelection={handleToggleRequirementSelection}
              onSelectAll={handleSelectAllFiltered}
              onClearSelection={handleClearSelection}
              onGenerateWbs={handleBulkGenerateWBS}
              isGenerating={isGenerating}
              generatingIds={generatingRequirementIds}
              onViewWbs={handleViewWbs}
              onUnlinkWbs={handleUnlinkWbsFromRequirement}
              hasUploadedRfp={!!solicitation?.analyzedFromDocument}
              allSelected={allFilteredSelected}
              someSelected={someFilteredSelected}
            />
          )}

          {activeView === 'labor-matrix' && (
            <LaborMatrixView
              wbsElements={wbsElements}
              periods={periods}
              activePeriod={activePeriod}
              onPeriodChange={setActivePeriod}
              companyRoles={companyRoles.map(r => ({ id: r.id, title: r.title }))}
              onUpdateHours={handleUpdateHours}
              onViewWbs={handleViewWbs}
              onAddWbs={handleAddWbs}
            />
          )}

          {activeView === 'timeline' && (
            <TimelineView
              wbsElements={wbsElements}
              periods={periods}
              companyRoles={companyRoles.map(r => ({ id: r.id, title: r.title }))}
              billableHoursPerMonth={uiBillableHours || 160}
            />
          )}
        </div>

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
