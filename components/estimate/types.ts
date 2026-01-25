// Shared types for estimate components

export interface SOORequirement {
  id: string
  referenceNumber: string
  title: string
  description: string
  type: 'functional' | 'technical' | 'compliance' | 'management' | 'other'
  category: string
  source: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  linkedWbsIds: string[]
}

export interface LaborEstimate {
  id: string
  roleId: string
  roleName: string
  hoursByPeriod: {
    base: number
    option1: number
    option2: number
    option3: number
    option4: number
  }
  rationale: string
  confidence: 'high' | 'medium' | 'low'
  isAISuggested?: boolean
  isOrphaned?: boolean
}

export interface WBSRisk {
  id: string
  description: string
  probability: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  mitigation: string
}

export interface EnhancedWBSElement {
  id: string
  wbsNumber: string
  title: string
  sowReference: string
  why: string
  what: string
  notIncluded: string
  assumptions: string[]
  estimateMethod: 'engineering' | 'analogous' | 'parametric' | 'expert'
  laborEstimates: LaborEstimate[]
  linkedRequirementIds: string[]
  totalHours: number
  confidence: 'high' | 'medium' | 'low'
  risks?: WBSRisk[]
  dependencies?: string[]
}

export interface EstimateStats {
  total: number
  mapped: number
  unmapped: number
  totalHours: number
}

// View type for tab navigation
export type EstimateViewType = 'requirements' | 'labor-matrix' | 'timeline'

// Period configuration
export interface PeriodConfig {
  id: string
  label: string
  shortLabel: string
  monthsCount: number
}

export const DEFAULT_PERIODS: PeriodConfig[] = [
  { id: 'base', label: 'Base Year', shortLabel: 'BY', monthsCount: 12 },
  { id: 'option1', label: 'Option Year 1', shortLabel: 'OY1', monthsCount: 12 },
  { id: 'option2', label: 'Option Year 2', shortLabel: 'OY2', monthsCount: 12 },
  { id: 'option3', label: 'Option Year 3', shortLabel: 'OY3', monthsCount: 12 },
  { id: 'option4', label: 'Option Year 4', shortLabel: 'OY4', monthsCount: 12 },
]
