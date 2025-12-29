'use client'

import { useEffect, useRef } from 'react'
import { useAppContext } from '@/contexts/app-context'

const PROPOSALS_STORAGE_KEY = 'truebid-proposals'
const PROPOSAL_DATA_PREFIX = 'truebid-proposal-data-'

interface DashboardProposal {
  id: string
  title: string
  solicitation: string
  client: string
  status: 'draft' | 'in-review' | 'submitted' | 'won' | 'lost' | 'no-bid'
  totalValue: number
  dueDate: string | null
  updatedAt: string
  createdAt: string
  teamSize: number
  progress: number
  starred: boolean
  archived: boolean
  contractType: 'tm' | 'ffp' | 'hybrid'
  periodOfPerformance: string
}

/**
 * Hook to sync AppContext data with dashboard localStorage
 * 
 * This bridges the gap between:
 * - Dashboard's proposal list (truebid-proposals) - metadata for cards
 * - AppContext state (solicitation, selectedRoles, etc.) - working data
 * - Per-proposal storage (truebid-proposal-data-{id}) - full proposal data
 * 
 * Usage: Call this hook in the proposal workspace layout/page
 */
export function useProposalSync(proposalId: string) {
  const {
    solicitation,
    selectedRoles,
    subcontractors,
    teamingPartners,
    estimateWbsElements,
    rateJustifications,
    odcs,
    perDiem,
    setSolicitation,
    setSelectedRoles,
    setSubcontractors,
    setTeamingPartners,
    setEstimateWbsElements,
    setRateJustifications,
    setODCs,
    setPerDiem,
    resetSolicitation,
  } = useAppContext()

  const isInitialLoad = useRef(true)
  const lastSavedRef = useRef<string>('')

  // Load proposal data on mount
  useEffect(() => {
    if (!proposalId) return

    // Load full proposal data from per-proposal storage
    const proposalDataKey = `${PROPOSAL_DATA_PREFIX}${proposalId}`
    const storedData = localStorage.getItem(proposalDataKey)

    if (storedData) {
      try {
        const data = JSON.parse(storedData)
        
        // Restore all AppContext state
        if (data.solicitation) setSolicitation(data.solicitation)
        if (data.selectedRoles) setSelectedRoles(data.selectedRoles)
        if (data.subcontractors) setSubcontractors(data.subcontractors)
        if (data.teamingPartners) setTeamingPartners(data.teamingPartners)
        if (data.estimateWbsElements) setEstimateWbsElements(data.estimateWbsElements)
        if (data.rateJustifications) setRateJustifications(data.rateJustifications)
        if (data.odcs) setODCs(data.odcs)
        if (data.perDiem) setPerDiem(data.perDiem)
        
        console.log('[ProposalSync] Loaded proposal data:', proposalId)
      } catch (e) {
        console.error('[ProposalSync] Failed to parse proposal data:', e)
      }
    } else {
      // New proposal - reset to defaults
      resetSolicitation()
      setSelectedRoles([])
      setSubcontractors([])
      setEstimateWbsElements([])
      setRateJustifications({})
      setODCs([])
      setPerDiem([])
      console.log('[ProposalSync] New proposal, reset to defaults:', proposalId)
    }

    // Mark initial load complete after a tick
    setTimeout(() => {
      isInitialLoad.current = false
    }, 100)

    // Cleanup on unmount - don't reset, data is saved
    return () => {
      isInitialLoad.current = true
    }
  }, [proposalId])

  // Save proposal data when AppContext changes
  useEffect(() => {
    // Skip during initial load to avoid overwriting with defaults
    if (isInitialLoad.current || !proposalId) return

    const proposalData = {
      solicitation,
      selectedRoles,
      subcontractors,
      teamingPartners,
      estimateWbsElements,
      rateJustifications,
      odcs,
      perDiem,
      lastSaved: new Date().toISOString(),
    }

    // Avoid saving if nothing changed (simple hash check)
    const dataHash = JSON.stringify(proposalData)
    if (dataHash === lastSavedRef.current) return
    lastSavedRef.current = dataHash

    // Save full proposal data
    const proposalDataKey = `${PROPOSAL_DATA_PREFIX}${proposalId}`
    localStorage.setItem(proposalDataKey, JSON.stringify(proposalData))

    // Also update the dashboard's proposal list with summary data
    updateDashboardProposal(proposalId, {
      title: solicitation.title || 'Untitled Proposal',
      solicitation: solicitation.solicitationNumber || '',
      client: solicitation.clientAgency || '',
      totalValue: calculateTotalValue(selectedRoles, subcontractors),
      dueDate: solicitation.proposalDueDate || null,
      teamSize: selectedRoles.length + subcontractors.length,
      contractType: mapContractType(solicitation.contractType),
      periodOfPerformance: formatPeriodOfPerformance(solicitation.periodOfPerformance),
      progress: calculateProgress(solicitation, selectedRoles, estimateWbsElements),
      updatedAt: new Date().toISOString(),
    })

    console.log('[ProposalSync] Saved proposal data:', proposalId)
  }, [
    proposalId,
    solicitation,
    selectedRoles,
    subcontractors,
    teamingPartners,
    estimateWbsElements,
    rateJustifications,
    odcs,
    perDiem,
  ])
}

// Helper: Update dashboard proposal list
function updateDashboardProposal(id: string, updates: Partial<DashboardProposal>) {
  const stored = localStorage.getItem(PROPOSALS_STORAGE_KEY)
  if (!stored) return

  try {
    const proposals: DashboardProposal[] = JSON.parse(stored)
    const index = proposals.findIndex(p => p.id === id)
    
    if (index !== -1) {
      proposals[index] = { ...proposals[index], ...updates }
      localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(proposals))
    }
  } catch (e) {
    console.error('[ProposalSync] Failed to update dashboard proposal:', e)
  }
}

// Helper: Calculate total contract value from roles and subs
function calculateTotalValue(
  roles: Array<{ baseSalary: number; fte: number; years: Record<string, boolean> }>,
  subs: Array<{ billedRate: number; fte: number; years: Record<string, boolean> }>
): number {
  const HOURS_PER_YEAR = 1920

  let total = 0

  // Prime labor (simplified - just base salary * FTE * years)
  roles.forEach(role => {
    const activeYears = Object.values(role.years).filter(Boolean).length
    total += role.baseSalary * role.fte * activeYears
  })

  // Subcontractors
  subs.forEach(sub => {
    const activeYears = Object.values(sub.years).filter(Boolean).length
    total += sub.billedRate * HOURS_PER_YEAR * sub.fte * activeYears
  })

  return total
}

// Helper: Map solicitation contract type to dashboard type
function mapContractType(type: string): 'tm' | 'ffp' | 'hybrid' {
  if (type === 'FFP' || type === 'CPFF' || type === 'CPAF') return 'ffp'
  if (type === 'T&M' || type === 'GSA') return 'tm'
  if (type === 'hybrid' || type === 'IDIQ' || type === 'BPA') return 'hybrid'
  return 'tm'
}

// Helper: Format period of performance for display
function formatPeriodOfPerformance(pop: { baseYear: boolean; optionYears: number }): string {
  if (pop.baseYear && pop.optionYears > 0) {
    return `1 Base + ${pop.optionYears} OY${pop.optionYears > 1 ? 's' : ''}`
  }
  if (pop.baseYear) {
    return '1 Base Year'
  }
  if (pop.optionYears > 0) {
    return `${pop.optionYears} Option Year${pop.optionYears > 1 ? 's' : ''}`
  }
  return ''
}

// Helper: Calculate rough progress percentage
function calculateProgress(
  solicitation: { title?: string; clientAgency?: string; solicitationNumber?: string },
  roles: unknown[],
  wbsElements: unknown[]
): number {
  let progress = 0
  
  // Has basic info (30%)
  if (solicitation.title || solicitation.solicitationNumber) progress += 15
  if (solicitation.clientAgency) progress += 15
  
  // Has roles (40%)
  if (roles.length > 0) progress += 40
  
  // Has estimates (30%)
  if (wbsElements.length > 0) progress += 30
  
  return Math.min(progress, 100)
}

export default useProposalSync