'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Search, Plus, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Info, HelpCircle,
  Clock, Calendar, AlertTriangle, Link2, Pencil, Trash2, X, Check,
  FileText, Users, BarChart3, Target, Lightbulb, MessageSquare,
  Bot, TrendingUp, Shield, ArrowRight, CheckCircle2, XCircle,
  Layers, ClipboardList, Download, RefreshCw, Sparkles, Grid3X3,
  List, Table2, Building2, Hash, BookOpen, Eye, EyeOff, Filter,
  ClipboardCheck, GitMerge, CircleDot, LinkIcon, Unlink, CheckSquare,
  Square, ArrowRightLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppContext } from '@/contexts/app-context'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type PeriodKey = 'base' | 'option1' | 'option2' | 'option3' | 'option4'

interface PeriodHours {
  base: number
  option1: number
  option2: number
  option3: number
  option4: number
}

type EstimateMethod = 'historical' | 'parametric' | 'firm-quote' | 'level-of-effort' | 'engineering'

interface ChargeCode {
  id: string
  chargeNumber: string
  projectName: string
  client: string
  dateRange: string
  totalHours: number
  description: string
  roles: string[]
}

// SOO/PWS Requirement for traceability
type RequirementType = 'shall' | 'should' | 'may' | 'will'
type RequirementCategory = 'functional' | 'technical' | 'compliance' | 'performance' | 'security' | 'management' | 'other'

interface SOORequirement {
  id: string
  referenceNumber: string
  title: string
  description: string
  type: RequirementType
  category: RequirementCategory
  priority: 'critical' | 'high' | 'medium' | 'low'
  source: string
  linkedWbsIds: string[]
  notes: string
  isAIExtracted: boolean
}

interface HistoricalReference {
  chargeCodeId: string
  chargeNumber: string
  projectName: string
  dateRange: string
  actualHours: number
  notes: string
}

interface EnhancedLaborEstimate {
  id: string
  roleId: string
  roleName: string
  hoursByPeriod: PeriodHours
  rationale: string
  confidence: 'high' | 'medium' | 'low'
  isAISuggested: boolean
  isOrphaned?: boolean
}

interface WBSRisk {
  id: string
  description: string
  probability: 1 | 2 | 3 | 4 | 5
  impact: 1 | 2 | 3 | 4 | 5
  mitigation: string
  status: 'open' | 'mitigated' | 'accepted' | 'closed'
}

interface WBSDependency {
  id: string
  predecessorWbsId: string
  predecessorWbsNumber: string
  type: 'FS' | 'SS' | 'FF' | 'SF'
  lagDays: number
}

interface EnhancedWBSElement {
  id: string
  wbsNumber: string
  title: string
  sowReference: string
  clin?: string
  
  periodOfPerformance: {
    startDate: string
    endDate: string
  }
  
  why: string
  what: string
  notIncluded: string
  assumptions: string[]
  
  estimateMethod: EstimateMethod
  historicalReference?: HistoricalReference
  engineeringBasis?: {
    similarWork: string
    expertSource: string
    assumptions: string
    confidenceNotes: string
  }
  complexityFactor: number
  complexityJustification: string
  
  laborEstimates: EnhancedLaborEstimate[]
  risks: WBSRisk[]
  dependencies: WBSDependency[]
  
  qualityGrade: 'blue' | 'green' | 'yellow' | 'red'
  qualityScore: number
  qualityIssues: string[]
  
  isAIGenerated: boolean
  aiConfidence: number
}

// Internal role type for this component (mapped from context)
interface SelectedRole {
  id: string
  name: string
  category: string
  baseRate: number
}

type ViewMode = 'grid' | 'list' | 'table'

// ============================================================================
// CONSTANTS & LABELS
// ============================================================================

const ESTIMATE_METHOD_LABELS: Record<EstimateMethod, { label: string; description: string; icon: string }> = {
  'historical': { 
    label: 'Historical', 
    description: 'Based on actual hours from similar completed projects',
    icon: '📊'
  },
  'parametric': { 
    label: 'Parametric', 
    description: 'Calculated using known metrics (e.g., hours per screen)',
    icon: '📐'
  },
  'firm-quote': { 
    label: 'Firm Quote', 
    description: 'Based on quotes from subcontractors or vendors',
    icon: '📋'
  },
  'level-of-effort': { 
    label: 'Level of Effort', 
    description: 'Ongoing support without specific deliverables',
    icon: '🔄'
  },
  'engineering': { 
    label: 'Engineering Judgment', 
    description: 'Expert assessment based on team experience',
    icon: '🧠'
  },
}

const PROBABILITY_LABELS: Record<number, string> = {
  1: 'Very unlikely',
  2: 'Unlikely',
  3: 'Possible',
  4: 'Likely',
  5: 'Very likely',
}

const IMPACT_LABELS: Record<number, string> = {
  1: 'Minimal',
  2: 'Minor',
  3: 'Moderate',
  4: 'Significant',
  5: 'Severe',
}

const QUALITY_GRADE_CONFIG: Record<string, { label: string; description: string; bgColor: string; textColor: string; borderColor: string }> = {
  'blue': { 
    label: 'Audit-Ready', 
    description: 'Historical basis with charge number',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-100'
  },
  'green': { 
    label: 'Complete', 
    description: 'Well-documented estimate',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200'
  },
  'yellow': { 
    label: 'Needs Review', 
    description: 'Missing some documentation',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200'
  },
  'red': { 
    label: 'Incomplete', 
    description: 'Critical information missing',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200'
  },
}

const DEPENDENCY_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  'FS': { label: 'Finish-to-Start', description: 'B starts after A finishes' },
  'SS': { label: 'Start-to-Start', description: 'B starts when A starts' },
  'FF': { label: 'Finish-to-Finish', description: 'B finishes when A finishes' },
  'SF': { label: 'Start-to-Finish', description: 'B finishes when A starts' },
}

const CONFIDENCE_CONFIG: Record<string, { label: string; color: string }> = {
  'high': { label: 'High', color: 'text-green-600' },
  'medium': { label: 'Medium', color: 'text-yellow-600' },
  'low': { label: 'Low', color: 'text-red-600' },
}

// Requirement Type Labels (FAR language strength)
const REQUIREMENT_TYPE_CONFIG: Record<RequirementType, { label: string; description: string; color: string }> = {
  'shall': { 
    label: 'Shall', 
    description: 'Mandatory requirement - must be met',
    color: 'text-red-700 bg-red-50 border-red-200'
  },
  'should': { 
    label: 'Should', 
    description: 'Expected requirement - strongly recommended',
    color: 'text-orange-700 bg-orange-50 border-orange-100'
  },
  'will': { 
    label: 'Will', 
    description: 'Government action or statement of fact',
    color: 'text-blue-700 bg-blue-50 border-blue-100'
  },
  'may': { 
    label: 'May', 
    description: 'Optional - at contractor discretion',
    color: 'text-gray-700 bg-gray-50 border-gray-100'
  },
}

const REQUIREMENT_CATEGORY_CONFIG: Record<RequirementCategory, { label: string; icon: string }> = {
  'functional': { label: 'Functional', icon: '⚙️' },
  'technical': { label: 'Technical', icon: '🔧' },
  'compliance': { label: 'Compliance', icon: '📋' },
  'performance': { label: 'Performance', icon: '📈' },
  'security': { label: 'Security', icon: '🔒' },
  'management': { label: 'Management', icon: '📊' },
  'other': { label: 'Other', icon: '📌' },
}

const REQUIREMENT_PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  'critical': { label: 'Critical', color: 'text-red-700 bg-red-100' },
  'high': { label: 'High', color: 'text-orange-700 bg-orange-100' },
  'medium': { label: 'Medium', color: 'text-yellow-700 bg-yellow-100' },
  'low': { label: 'Low', color: 'text-gray-600 bg-gray-100' },
}

// ============================================================================
// MOCK CHARGE CODE LIBRARY
// ============================================================================

const MOCK_CHARGE_CODES: ChargeCode[] = [
  {
    id: 'cc-1',
    chargeNumber: 'TT-2024-0892',
    projectName: 'VA Transition Support',
    client: 'Department of Veterans Affairs',
    dateRange: 'Jan 2024 - Mar 2024',
    totalHours: 2400,
    description: 'Transition-in support for legacy system migration',
    roles: ['Delivery Manager', 'Technical Lead', 'DevOps Engineer'],
  },
  {
    id: 'cc-2',
    chargeNumber: 'DOS-2023-1547',
    projectName: 'Consular Scheduling MVP',
    client: 'Department of State',
    dateRange: 'Jun 2023 - Dec 2023',
    totalHours: 14500,
    description: 'Public-facing appointment scheduling system',
    roles: ['Product Manager', 'Frontend Engineer', 'Backend Engineer', 'QA Engineer'],
  },
  {
    id: 'cc-3',
    chargeNumber: 'HHS-2024-0234',
    projectName: 'Healthcare Portal Redesign',
    client: 'Health and Human Services',
    dateRange: 'Feb 2024 - Aug 2024',
    totalHours: 8900,
    description: 'Section 508 compliant portal with multi-language support',
    roles: ['Design Lead', 'UX Researcher', 'Frontend Engineer'],
  },
  {
    id: 'cc-4',
    chargeNumber: 'DHS-2023-0891',
    projectName: 'Border Systems Integration',
    client: 'Department of Homeland Security',
    dateRange: 'Sep 2023 - Feb 2024',
    totalHours: 5600,
    description: 'API integration with legacy border management systems',
    roles: ['Technical Lead', 'Backend Engineer', 'DevOps Engineer'],
  },
]

// ============================================================================
// MOCK SOO REQUIREMENTS
// ============================================================================

const MOCK_REQUIREMENTS: SOORequirement[] = [
  {
    id: 'req-1',
    referenceNumber: 'SOO 3.1.1',
    title: 'Transition-In Support',
    description: 'The contractor shall provide transition-in support to ensure seamless takeover of operations from the incumbent contractor within 60 days of contract award.',
    type: 'shall',
    category: 'management',
    priority: 'critical',
    source: 'SOO Section 3.1 - Transition Requirements',
    linkedWbsIds: [],
    notes: '',
    isAIExtracted: true,
  },
  {
    id: 'req-2',
    referenceNumber: 'SOO 3.2.1',
    title: 'Public Appointment Booking System',
    description: 'The contractor shall develop and maintain a public-facing appointment booking system that allows users to schedule appointments in under 5 minutes.',
    type: 'shall',
    category: 'functional',
    priority: 'critical',
    source: 'SOO Section 3.2 - Core System Requirements',
    linkedWbsIds: [],
    notes: '5-minute SLA is key evaluation criteria',
    isAIExtracted: true,
  },
  {
    id: 'req-3',
    referenceNumber: 'SOO 3.2.2',
    title: 'Administrative Portal',
    description: 'The contractor shall provide an administrative portal for consular staff to manage appointment availability, view metrics, and handle scheduling conflicts.',
    type: 'shall',
    category: 'functional',
    priority: 'high',
    source: 'SOO Section 3.2 - Core System Requirements',
    linkedWbsIds: [],
    notes: '',
    isAIExtracted: true,
  },
  {
    id: 'req-4',
    referenceNumber: 'SOO 3.3.1',
    title: 'Section 508 Compliance',
    description: 'All public-facing interfaces shall comply with Section 508 accessibility standards and WCAG 2.1 Level AA guidelines.',
    type: 'shall',
    category: 'compliance',
    priority: 'critical',
    source: 'SOO Section 3.3 - Compliance Requirements',
    linkedWbsIds: [],
    notes: 'Applies to all user-facing components',
    isAIExtracted: true,
  },
  {
    id: 'req-5',
    referenceNumber: 'SOO 3.3.2',
    title: 'FedRAMP Authorization',
    description: 'The system shall be deployed in a FedRAMP Moderate authorized cloud environment.',
    type: 'shall',
    category: 'security',
    priority: 'critical',
    source: 'SOO Section 3.3 - Compliance Requirements',
    linkedWbsIds: [],
    notes: 'AWS GovCloud or Azure Government',
    isAIExtracted: true,
  },
  {
    id: 'req-6',
    referenceNumber: 'SOO 3.4.1',
    title: 'Multi-Language Support',
    description: 'The public booking system shall support a minimum of 5 languages including English, Spanish, French, Arabic, and Mandarin Chinese.',
    type: 'shall',
    category: 'functional',
    priority: 'high',
    source: 'SOO Section 3.4 - User Experience Requirements',
    linkedWbsIds: [],
    notes: 'Initial launch requires English and Spanish minimum',
    isAIExtracted: true,
  },
  {
    id: 'req-7',
    referenceNumber: 'SOO 3.5.1',
    title: 'System Availability',
    description: 'The system shall maintain 99.9% availability during business hours (6am-10pm EST) with planned maintenance windows not exceeding 4 hours per month.',
    type: 'shall',
    category: 'performance',
    priority: 'high',
    source: 'SOO Section 3.5 - Performance Requirements',
    linkedWbsIds: [],
    notes: '',
    isAIExtracted: true,
  },
  {
    id: 'req-8',
    referenceNumber: 'SOO 3.6.1',
    title: 'Monthly Status Reporting',
    description: 'The contractor shall provide monthly status reports including metrics on system performance, user adoption, and issue resolution.',
    type: 'shall',
    category: 'management',
    priority: 'medium',
    source: 'SOO Section 3.6 - Reporting Requirements',
    linkedWbsIds: [],
    notes: 'Template provided in Attachment 3',
    isAIExtracted: true,
  },
  {
    id: 'req-9',
    referenceNumber: 'SOO 4.1.1',
    title: 'Agile Development Methodology',
    description: 'The contractor should utilize an Agile development methodology with 2-week sprint cycles and regular stakeholder demonstrations.',
    type: 'should',
    category: 'management',
    priority: 'medium',
    source: 'SOO Section 4.1 - Development Approach',
    linkedWbsIds: [],
    notes: 'Not mandatory but expected',
    isAIExtracted: true,
  },
  {
    id: 'req-10',
    referenceNumber: 'SOO 4.2.1',
    title: 'Integration with Legacy Systems',
    description: 'The contractor may be required to integrate with existing legacy scheduling systems during the transition period.',
    type: 'may',
    category: 'technical',
    priority: 'low',
    source: 'SOO Section 4.2 - Integration Requirements',
    linkedWbsIds: [],
    notes: 'Pending agency decision on legacy system sunset',
    isAIExtracted: true,
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function calculateQualityScore(element: EnhancedWBSElement): { score: number; grade: 'blue' | 'green' | 'yellow' | 'red'; issues: string[] } {
  let score = 100
  const issues: string[] = []
  
  if (!element.sowReference) {
    score -= 15
    issues.push('Missing SOW reference')
  }
  
  if (!element.periodOfPerformance.startDate || !element.periodOfPerformance.endDate) {
    score -= 10
    issues.push('Missing period of performance dates')
  }
  
  if (!element.why || element.why.length < 20) {
    score -= 10
    issues.push('Insufficient "Why" description')
  }
  if (!element.what || element.what.length < 20) {
    score -= 10
    issues.push('Insufficient "What" description')
  }
  
  if (element.estimateMethod === 'engineering') {
    const basis = element.engineeringBasis
    const hasGoodBasis = basis && (
      (basis.similarWork && basis.similarWork.length > 20) ||
      (basis.expertSource && basis.assumptions && basis.assumptions.length > 20)
    )
    
    if (hasGoodBasis) {
      score -= 5
      issues.push('Engineering judgment (documented)')
    } else {
      score -= 15
      issues.push('Engineering judgment needs supporting data')
    }
  } else if (element.estimateMethod === 'level-of-effort') {
    score -= 5
    issues.push('LOE should be minimized')
  }
  
  if (element.estimateMethod === 'historical' && !element.historicalReference?.chargeNumber) {
    score -= 20
    issues.push('Historical method requires charge number')
  }
  
  if (element.complexityFactor !== 1.0 && !element.complexityJustification) {
    score -= 10
    issues.push('Complexity factor needs justification')
  }
  
  if (element.laborEstimates.length === 0) {
    score -= 25
    issues.push('No labor estimates defined')
  } else {
    const missingRationale = element.laborEstimates.filter(l => !l.rationale || l.rationale.length < 10)
    if (missingRationale.length > 0) {
      score -= 10
      issues.push(`${missingRationale.length} role(s) missing rationale`)
    }
    
    const orphanedRoles = element.laborEstimates.filter(l => l.isOrphaned)
    if (orphanedRoles.length > 0) {
      score -= 10
      issues.push(`${orphanedRoles.length} orphaned role(s)`)
    }
  }
  
  let grade: 'blue' | 'green' | 'yellow' | 'red'
  if (score >= 90 && element.estimateMethod === 'historical' && element.historicalReference?.chargeNumber) {
    grade = 'blue'
  } else if (score >= 75) {
    grade = 'green'
  } else if (score >= 50) {
    grade = 'yellow'
  } else {
    grade = 'red'
  }
  
  return { score: Math.max(0, score), grade, issues }
}

function getTotalHours(hoursByPeriod: PeriodHours): number {
  return Object.values(hoursByPeriod).reduce((sum, h) => sum + h, 0)
}

function getElementTotalHours(element: EnhancedWBSElement): number {
  return element.laborEstimates.reduce((sum, labor) => sum + getTotalHours(labor.hoursByPeriod), 0)
}

function getRiskScore(risk: WBSRisk): number {
  return risk.probability * risk.impact
}

function getRiskColor(score: number): string {
  if (score >= 12) return 'border-l-red-500'
  if (score >= 6) return 'border-l-yellow-500'
  return 'border-l-green-500'
}

function formatDate(dateString: string): string {
  if (!dateString) return 'Not set'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateShort(dateString: string): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

// ============================================================================
// MOCK DATA GENERATOR - Now accepts roles from context
// ============================================================================

function generateMockWBSElements(
  selectedRoles: SelectedRole[],
  optionYears: number
): EnhancedWBSElement[] {
  if (selectedRoles.length === 0) return []
  
  const mockElements: EnhancedWBSElement[] = [
    {
      id: 'wbs-1',
      wbsNumber: '1.1',
      title: 'Transition-In Planning & Knowledge Transfer',
      sowReference: 'SOO 3.1.1',
      clin: '0001',
      periodOfPerformance: {
        startDate: '2025-01-01',
        endDate: '2025-02-28',
      },
      why: 'Establish a seamless transition from the incumbent contractor to minimize disruption to ongoing operations.',
      what: 'Conduct knowledge transfer sessions, review documentation, establish dev environments, complete security onboarding.',
      notIncluded: 'Incumbent contractor responsibilities, hardware procurement.',
      assumptions: [
        'Incumbent will provide 40 hours of knowledge transfer support',
        'All team members will have clearances adjudicated within 30 days',
      ],
      estimateMethod: 'historical',
      historicalReference: {
        chargeCodeId: 'cc-1',
        chargeNumber: 'TT-2024-0892',
        projectName: 'VA Transition Support',
        dateRange: 'Jan-Mar 2024',
        actualHours: 560,
        notes: 'Similar complexity, same clearance requirements. Adjusted for smaller team size.',
      },
      complexityFactor: 1.0,
      complexityJustification: '',
      laborEstimates: selectedRoles.slice(0, 3).map((role, idx) => ({
        id: `labor-1-${idx}`,
        roleId: role.id,
        roleName: role.name,
        hoursByPeriod: {
          base: idx === 0 ? 200 : 180,
          option1: 0,
          option2: 0,
          option3: 0,
          option4: 0,
        },
        rationale: `Transition activities require ${role.name} for ${idx === 0 ? 'leading coordination and stakeholder management' : 'technical handoff and environment setup'}.`,
        confidence: 'high' as const,
        isAISuggested: false,
        isOrphaned: false,
      })),
      risks: [
        {
          id: 'risk-1-1',
          description: 'Incumbent knowledge transfer may be incomplete or delayed',
          probability: 3 as const,
          impact: 4 as const,
          mitigation: 'Schedule redundant sessions, document all verbal knowledge transfer',
          status: 'open' as const,
        },
      ],
      dependencies: [],
      qualityGrade: 'blue' as const,
      qualityScore: 95,
      qualityIssues: [],
      isAIGenerated: false,
      aiConfidence: 0,
    },
    {
      id: 'wbs-2',
      wbsNumber: '1.2',
      title: 'Public Booking System Development',
      sowReference: 'SOO 3.2.1',
      clin: '0001',
      periodOfPerformance: {
        startDate: '2025-03-01',
        endDate: '2025-12-31',
      },
      why: 'Enable public users to schedule appointments in under 5 minutes, improving customer satisfaction.',
      what: 'Design and develop a responsive booking interface with multi-language support and real-time availability.',
      notIncluded: 'Third-party payment processing, SMS notifications, backend calendar infrastructure.',
      assumptions: [
        'Design system (USWDS) components are available',
        '10 primary screens identified in discovery',
      ],
      estimateMethod: 'parametric',
      engineeringBasis: {
        similarWork: '10 screens × 80 hours per screen = 800 base hours per role. Based on FFTC productivity data from similar React/USWDS federal projects.',
        expertSource: 'FFTC-PROD-2024 productivity metrics',
        assumptions: 'Assumes standard complexity screens with USWDS components',
        confidenceNotes: 'High confidence based on 3 similar projects completed in 2024',
      },
      complexityFactor: 1.2,
      complexityJustification: 'Multi-language support (5 languages) and WCAG 2.1 AA accessibility requirements add 20% overhead.',
      laborEstimates: selectedRoles.slice(0, 4).map((role, idx) => ({
        id: `labor-2-${idx}`,
        roleId: role.id,
        roleName: role.name,
        hoursByPeriod: {
          base: [480, 520, 400, 320][idx] || 400,
          option1: optionYears >= 1 ? [120, 100, 80, 60][idx] || 80 : 0,
          option2: optionYears >= 2 ? [60, 50, 40, 30][idx] || 40 : 0,
          option3: 0,
          option4: 0,
        },
        rationale: `Based on parametric calculation: 10 screens × 80 hrs × 1.2 complexity. ${role.name} allocation based on role distribution from similar projects.`,
        confidence: idx < 2 ? 'high' as const : 'medium' as const,
        isAISuggested: false,
        isOrphaned: false,
      })),
      risks: [
        {
          id: 'risk-2-1',
          description: 'Section 508 compliance may require significant rework',
          probability: 2 as const,
          impact: 3 as const,
          mitigation: 'Build accessibility into design from day one, conduct regular audits',
          status: 'open' as const,
        },
      ],
      dependencies: [
        {
          id: 'dep-2-1',
          predecessorWbsId: 'wbs-1',
          predecessorWbsNumber: '1.1',
          type: 'FS' as const,
          lagDays: 0,
        },
      ],
      qualityGrade: 'green' as const,
      qualityScore: 85,
      qualityIssues: [],
      isAIGenerated: false,
      aiConfidence: 0,
    },
    {
      id: 'wbs-3',
      wbsNumber: '1.3',
      title: 'Admin Portal & Capacity Management',
      sowReference: 'SOO 3.2.2',
      clin: '0001',
      periodOfPerformance: {
        startDate: '2025-04-01',
        endDate: '2025-12-31',
      },
      why: 'Consular staff need to efficiently manage appointment slots, view metrics, and handle scheduling conflicts.',
      what: 'Build admin dashboard with calendar views, bulk slot management, and reporting dashboards.',
      notIncluded: 'Mobile admin app, offline functionality.',
      assumptions: [
        'Role-based access control requirements are defined',
        'Maximum 50 concurrent admin users per post',
      ],
      estimateMethod: 'engineering',
      engineeringBasis: {
        similarWork: 'Based on similar admin portal built for HHS in 2023. That project had comparable complexity with RBAC and reporting features.',
        expertSource: 'Technical Lead (J. Smith) with 8+ years building federal admin systems',
        assumptions: 'Assumes standard federal security requirements, reusable component library',
        confidenceNotes: 'Medium confidence - report requirements not yet finalized, may need iteration',
      },
      complexityFactor: 1.0,
      complexityJustification: '',
      laborEstimates: selectedRoles.slice(0, 3).map((role, idx) => ({
        id: `labor-3-${idx}`,
        roleId: role.id,
        roleName: role.name,
        hoursByPeriod: {
          base: [360, 400, 280][idx] || 300,
          option1: optionYears >= 1 ? [80, 100, 60][idx] || 80 : 0,
          option2: optionYears >= 2 ? [40, 50, 30][idx] || 40 : 0,
          option3: 0,
          option4: 0,
        },
        rationale: `Engineering estimate based on similar HHS admin portal. ${role.name} hours derived from team experience with comparable federal dashboards.`,
        confidence: 'medium' as const,
        isAISuggested: false,
        isOrphaned: false,
      })),
      risks: [
        {
          id: 'risk-3-1',
          description: 'Report requirements may change significantly after initial delivery',
          probability: 4 as const,
          impact: 3 as const,
          mitigation: 'Build flexible reporting framework, plan for iteration in option years',
          status: 'open' as const,
        },
      ],
      dependencies: [
        {
          id: 'dep-3-1',
          predecessorWbsId: 'wbs-2',
          predecessorWbsNumber: '1.2',
          type: 'SS' as const,
          lagDays: 30,
        },
      ],
      qualityGrade: 'yellow' as const,
      qualityScore: 70,
      qualityIssues: ['Engineering judgment - document similar work reference'],
      isAIGenerated: false,
      aiConfidence: 0,
    },
  ]
  
  return mockElements.map(el => {
    const { score, grade, issues } = calculateQualityScore(el)
    return { ...el, qualityScore: score, qualityGrade: grade, qualityIssues: issues }
  })
}

// ============================================================================
// HELP BANNER COMPONENT
// ============================================================================

function HelpBanner() {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Info className="w-4 h-4" />
        <span>Understanding quality grades & estimate methods</span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {isExpanded && (
        <div className="mt-3 grid grid-cols-2 gap-4">
          {/* Quality Grades */}
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Quality Grades</h4>
            <div className="space-y-2">
              {Object.entries(QUALITY_GRADE_CONFIG).map(([key, config]) => (
                <div key={key} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${config.bgColor} border ${config.borderColor}`} />
                  <span className={`text-sm font-medium ${config.textColor}`}>{config.label}</span>
                  <span className="text-xs text-gray-500">— {config.description}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Estimate Methods */}
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Estimate Methods</h4>
            <div className="space-y-2">
              {Object.entries(ESTIMATE_METHOD_LABELS).map(([key, config]) => (
                <div key={key} className="flex items-start gap-2">
                  <span className="text-sm">{config.icon}</span>
                  <div>
                    <span className="text-sm font-medium text-gray-900">{config.label}</span>
                    <span className="text-xs text-gray-500 ml-2">— {config.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// VIEW MODE TOGGLE
// ============================================================================

interface ViewModeToggleProps {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

function ViewModeToggle({ viewMode, setViewMode }: ViewModeToggleProps) {
  return (
    <div className="flex gap-1 border border-gray-100 rounded-lg p-0.5 bg-white">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="px-2 h-8"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Card view</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="px-2 h-8"
          >
            <List className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>List view</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="px-2 h-8"
          >
            <Table2 className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Table view</TooltipContent>
      </Tooltip>
    </div>
  )
}

// ============================================================================
// WBS CARD VIEW
// ============================================================================

interface WBSCardProps {
  element: EnhancedWBSElement
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  contractPeriods: { key: PeriodKey; label: string }[]
}

function WBSCard({ element, onClick, onEdit, onDelete, contractPeriods }: WBSCardProps) {
  const totalHours = getElementTotalHours(element)
  const gradeConfig = QUALITY_GRADE_CONFIG[element.qualityGrade]
  const methodConfig = ESTIMATE_METHOD_LABELS[element.estimateMethod]
  
  return (
    <div
      className="group bg-white border border-gray-100 rounded-lg hover:border-gray-300 
                 hover:shadow-sm transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900">{element.wbsNumber}</span>
              <h3 className="text-sm font-medium text-gray-900 truncate">{element.title}</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {element.sowReference && <span>{element.sowReference}</span>}
              <span>•</span>
              <span>{formatDateShort(element.periodOfPerformance.startDate)} – {formatDateShort(element.periodOfPerformance.endDate)}</span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Body */}
      <div className="px-4 py-3">
        {/* Status Row */}
        <div className="flex items-center gap-2 mb-3">
          <Badge className={`${gradeConfig.bgColor} ${gradeConfig.textColor} border ${gradeConfig.borderColor} text-[10px] px-1.5 py-0 h-5`}>
            {gradeConfig.label}
          </Badge>
          <span className="text-xs text-gray-500">{methodConfig.icon} {methodConfig.label}</span>
          {element.isAIGenerated && (
            <div className="flex items-center gap-1 ml-auto">
              <Bot className="w-3 h-3 text-purple-500" />
              <span className="text-[10px] text-purple-600">{Math.round(element.aiConfidence * 100)}%</span>
            </div>
          )}
        </div>
        
        {/* Hours Summary */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-600">{element.laborEstimates.length} roles</span>
          <span className="text-sm font-semibold text-gray-900">{totalHours.toLocaleString()} hrs</span>
        </div>
        
        {/* Labor Preview */}
        <div className="space-y-1.5">
          {element.laborEstimates.slice(0, 2).map((labor) => (
            <div key={labor.id} className="flex items-center justify-between text-xs">
              <span className={labor.isOrphaned ? 'text-red-600' : 'text-gray-600'}>{labor.roleName}</span>
              <span className="text-gray-900">{getTotalHours(labor.hoursByPeriod).toLocaleString()}</span>
            </div>
          ))}
          {element.laborEstimates.length > 2 && (
            <span className="text-[10px] text-gray-400">+{element.laborEstimates.length - 2} more</span>
          )}
        </div>
      </div>
      
      {/* Footer */}
      {(element.risks.length > 0 || element.dependencies.length > 0 || element.qualityIssues.length > 0) && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-500">
          {element.risks.length > 0 && (
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {element.risks.length}
            </span>
          )}
          {element.dependencies.length > 0 && (
            <span className="flex items-center gap-1">
              <Link2 className="w-3 h-3" />
              {element.dependencies.map(d => d.predecessorWbsNumber).join(', ')}
            </span>
          )}
          {element.qualityIssues.length > 0 && (
            <span className="flex items-center gap-1 text-yellow-600">
              <AlertTriangle className="w-3 h-3" />
              {element.qualityIssues.length} issues
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// WBS LIST VIEW
// ============================================================================

interface WBSListItemProps {
  element: EnhancedWBSElement
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}

function WBSListItem({ element, onClick, onEdit, onDelete }: WBSListItemProps) {
  const totalHours = getElementTotalHours(element)
  const gradeConfig = QUALITY_GRADE_CONFIG[element.qualityGrade]
  
  return (
    <div
      className="group flex items-center gap-4 px-4 py-3 bg-white border border-gray-100 rounded-lg 
                 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* WBS Number */}
      <div className="w-16 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-900">{element.wbsNumber}</span>
      </div>
      
      {/* Title & SOW */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">{element.title}</h3>
        <span className="text-xs text-gray-500">{element.sowReference || 'No SOW ref'}</span>
      </div>
      
      {/* Quality */}
      <div className="w-24 flex-shrink-0">
        <Badge className={`${gradeConfig.bgColor} ${gradeConfig.textColor} border ${gradeConfig.borderColor} text-[10px] px-1.5 py-0 h-5`}>
          {gradeConfig.label}
        </Badge>
      </div>
      
      {/* Method */}
      <div className="w-32 flex-shrink-0 text-xs text-gray-600">
        {ESTIMATE_METHOD_LABELS[element.estimateMethod].label}
      </div>
      
      {/* Roles */}
      <div className="w-16 flex-shrink-0 text-xs text-gray-600 text-center">
        {element.laborEstimates.length}
      </div>
      
      {/* Hours */}
      <div className="w-24 flex-shrink-0 text-right">
        <span className="text-sm font-semibold text-gray-900">{totalHours.toLocaleString()}</span>
      </div>
      
      {/* Issues */}
      <div className="w-16 flex-shrink-0 text-center">
        {element.qualityIssues.length > 0 ? (
          <span className="text-xs text-yellow-600">{element.qualityIssues.length}</span>
        ) : (
          <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
        )}
      </div>
      
      {/* Actions */}
      <div className="w-16 flex-shrink-0 flex gap-1 justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 
                     opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// WBS TABLE VIEW
// ============================================================================

interface WBSTableViewProps {
  elements: EnhancedWBSElement[]
  onElementClick: (id: string) => void
  onEdit: (element: EnhancedWBSElement) => void
  onDelete: (id: string) => void
  contractPeriods: { key: PeriodKey; label: string }[]
}

function WBSTableView({ elements, onElementClick, onEdit, onDelete, contractPeriods }: WBSTableViewProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">WBS</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Title</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">SOW</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Quality</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Method</th>
            {contractPeriods.slice(0, 3).map(period => (
              <th key={period.key} className="text-right px-4 py-3 text-xs font-medium text-gray-600">
                {period.label}
              </th>
            ))}
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-600">Total</th>
            <th className="w-20"></th>
          </tr>
        </thead>
        <tbody>
          {elements.map((element, idx) => {
            const totalHours = getElementTotalHours(element)
            const gradeConfig = QUALITY_GRADE_CONFIG[element.qualityGrade]
            
            return (
              <tr 
                key={element.id}
                className={`group border-b border-gray-100 hover:bg-gray-50 cursor-pointer 
                           ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                onClick={() => onElementClick(element.id)}
              >
                <td className="px-4 py-3 font-semibold text-gray-900">{element.wbsNumber}</td>
                <td className="px-4 py-3 text-gray-900 max-w-[200px] truncate">{element.title}</td>
                <td className="px-4 py-3 text-gray-500">{element.sowReference || '—'}</td>
                <td className="px-4 py-3">
                  <Badge className={`${gradeConfig.bgColor} ${gradeConfig.textColor} border ${gradeConfig.borderColor} text-[10px] px-1.5 py-0 h-5`}>
                    {gradeConfig.label}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {ESTIMATE_METHOD_LABELS[element.estimateMethod].label}
                </td>
                {contractPeriods.slice(0, 3).map(period => {
                  const periodTotal = element.laborEstimates.reduce(
                    (sum, l) => sum + l.hoursByPeriod[period.key], 0
                  )
                  return (
                    <td key={period.key} className="px-4 py-3 text-right text-gray-900">
                      {periodTotal > 0 ? periodTotal.toLocaleString() : '—'}
                    </td>
                  )
                })}
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {totalHours.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onEdit(element); }}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onDelete(element.id); }}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 
                                 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================================
// CHARGE CODE LIBRARY
// ============================================================================

interface ChargeCodeLibraryProps {
  chargeCodes: ChargeCode[]
  onSelect?: (chargeCode: ChargeCode) => void
  onAdd: (chargeCode: ChargeCode) => void
  onUpdate: (id: string, updates: Partial<ChargeCode>) => void
  onDelete: (id: string) => void
}

function ChargeCodeLibrary({ chargeCodes, onSelect, onAdd, onUpdate, onDelete }: ChargeCodeLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingCode, setEditingCode] = useState<ChargeCode | null>(null)
  const [formData, setFormData] = useState<Partial<ChargeCode>>({
    chargeNumber: '',
    projectName: '',
    client: '',
    dateRange: '',
    totalHours: 0,
    description: '',
    roles: [],
  })
  const [rolesInput, setRolesInput] = useState('')
  
  const filteredCodes = chargeCodes.filter(cc => 
    cc.chargeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cc.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cc.client.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const handleOpenDialog = (chargeCode?: ChargeCode) => {
    if (chargeCode) {
      setEditingCode(chargeCode)
      setFormData({ ...chargeCode })
      setRolesInput(chargeCode.roles.join(', '))
    } else {
      setEditingCode(null)
      setFormData({
        chargeNumber: '',
        projectName: '',
        client: '',
        dateRange: '',
        totalHours: 0,
        description: '',
        roles: [],
      })
      setRolesInput('')
    }
    setShowDialog(true)
  }
  
  const handleSave = () => {
    const roles = rolesInput.split(',').map(r => r.trim()).filter(r => r)
    
    if (editingCode) {
      onUpdate(editingCode.id, { ...formData, roles })
    } else {
      onAdd({
        id: `cc-${Date.now()}`,
        chargeNumber: formData.chargeNumber || '',
        projectName: formData.projectName || '',
        client: formData.client || '',
        dateRange: formData.dateRange || '',
        totalHours: formData.totalHours || 0,
        description: formData.description || '',
        roles,
      })
    }
    setShowDialog(false)
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Charge Code Library</h2>
        <Button size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Charge Code
        </Button>
      </div>
      
      <p className="text-sm text-gray-600">
        Reference past projects to support historical estimates. Link charge codes to WBS elements for audit defensibility.
      </p>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search charge codes, projects, or clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {/* Charge Code Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredCodes.map(cc => (
          <div 
            key={cc.id}
            className={`group bg-white border border-gray-100 rounded-lg p-4 hover:border-gray-300 transition-all`}
          >
            <div className="flex items-start justify-between mb-2">
              <div 
                className={onSelect ? 'cursor-pointer flex-1' : 'flex-1'}
                onClick={() => onSelect?.(cc)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="w-4 h-4 text-blue-600" />
                  <span className="font-mono text-sm font-semibold text-gray-900">{cc.chargeNumber}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-900">{cc.projectName}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{cc.totalHours.toLocaleString()} hrs</Badge>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0"
                    onClick={(e) => { e.stopPropagation(); handleOpenDialog(cc); }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => { e.stopPropagation(); onDelete(cc.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Building2 className="w-3 h-3" />
              <span>{cc.client}</span>
              <span>•</span>
              <Calendar className="w-3 h-3" />
              <span>{cc.dateRange}</span>
            </div>
            
            <p className="text-xs text-gray-600 mb-2">{cc.description}</p>
            
            <div className="flex flex-wrap gap-1">
              {cc.roles.map(role => (
                <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {filteredCodes.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Hash className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600">
            {chargeCodes.length === 0 ? 'No charge codes yet' : 'No charge codes match your search'}
          </p>
        </div>
      )}
      
      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCode ? 'Edit Charge Code' : 'Add Charge Code'}</DialogTitle>
            <DialogDescription>
              {editingCode ? 'Update charge code details' : 'Add a historical project for reference'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Charge Number <span className="text-red-500">*</span></Label>
                <Input 
                  value={formData.chargeNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, chargeNumber: e.target.value }))}
                  placeholder="e.g., TT-2024-0892"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Hours</Label>
                <Input 
                  type="number"
                  value={formData.totalHours || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalHours: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g., 1200"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Project Name <span className="text-red-500">*</span></Label>
              <Input 
                value={formData.projectName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                placeholder="e.g., VA Transition Support"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Input 
                  value={formData.client || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                  placeholder="e.g., Department of Veterans Affairs"
                />
              </div>
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Input 
                  value={formData.dateRange || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateRange: e.target.value }))}
                  placeholder="e.g., Jan-Mar 2024"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                placeholder="Brief description of the project scope and deliverables..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Roles (comma-separated)</Label>
              <Input 
                value={rolesInput}
                onChange={(e) => setRolesInput(e.target.value)}
                placeholder="e.g., PM, Tech Lead, Developer, QA"
              />
              <p className="text-xs text-gray-500">Enter roles that worked on this project</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.chargeNumber || !formData.projectName}
            >
              {editingCode ? 'Save Changes' : 'Add Charge Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// REQUIREMENTS SECTION (Abbreviated for space)
// ============================================================================

interface RequirementsSectionProps {
  requirements: SOORequirement[]
  wbsElements: EnhancedWBSElement[]
  onAdd: (req: SOORequirement) => void
  onUpdate: (id: string, updates: Partial<SOORequirement>) => void
  onDelete: (id: string) => void
  onLinkWbs: (reqId: string, wbsId: string) => void
  onUnlinkWbs: (reqId: string, wbsId: string) => void
}

function RequirementsSection({ 
  requirements, 
  wbsElements, 
  onAdd, 
  onUpdate, 
  onDelete,
  onLinkWbs,
  onUnlinkWbs
}: RequirementsSectionProps) {
  const [viewMode, setViewMode] = useState<'list' | 'matrix' | 'gaps'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  
  // Edit dialog state
  const [showDialog, setShowDialog] = useState(false)
  const [editingReq, setEditingReq] = useState<SOORequirement | null>(null)
  const [formData, setFormData] = useState<Partial<SOORequirement>>({
    referenceNumber: '',
    title: '',
    description: '',
    type: 'shall',
    category: 'functional',
    priority: 'medium',
    source: '',
    notes: '',
  })
  
  const handleOpenDialog = (req?: SOORequirement) => {
    if (req) {
      setEditingReq(req)
      setFormData({ ...req })
    } else {
      setEditingReq(null)
      setFormData({
        referenceNumber: '',
        title: '',
        description: '',
        type: 'shall',
        category: 'functional',
        priority: 'medium',
        source: '',
        notes: '',
      })
    }
    setShowDialog(true)
  }
  
  const handleSave = () => {
    if (editingReq) {
      onUpdate(editingReq.id, formData)
    } else {
      onAdd({
        id: `req-${Date.now()}`,
        referenceNumber: formData.referenceNumber || '',
        title: formData.title || '',
        description: formData.description || '',
        type: formData.type as RequirementType || 'shall',
        category: formData.category as RequirementCategory || 'functional',
        priority: formData.priority as 'critical' | 'high' | 'medium' | 'low' || 'medium',
        source: formData.source || '',
        linkedWbsIds: [],
        notes: formData.notes || '',
        isAIExtracted: false,
      })
    }
    setShowDialog(false)
  }
  
  const filteredRequirements = useMemo(() => {
    let filtered = [...requirements]
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(req => 
        req.referenceNumber.toLowerCase().includes(query) ||
        req.title.toLowerCase().includes(query) ||
        req.description.toLowerCase().includes(query)
      )
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(req => req.type === filterType)
    }
    
    return filtered
  }, [requirements, searchQuery, filterType])
  
  const stats = useMemo(() => {
    const total = requirements.length
    const mapped = requirements.filter(r => r.linkedWbsIds.length > 0).length
    const shallCount = requirements.filter(r => r.type === 'shall').length
    const shallMapped = requirements.filter(r => r.type === 'shall' && r.linkedWbsIds.length > 0).length
    
    return {
      total,
      mapped,
      unmapped: total - mapped,
      coverage: total > 0 ? Math.round((mapped / total) * 100) : 0,
      shallCoverage: shallCount > 0 ? Math.round((shallMapped / shallCount) * 100) : 0,
    }
  }, [requirements])
  
  const unmappedRequirements = requirements.filter(r => r.linkedWbsIds.length === 0)
  
  const getLinkedWbsElements = (wbsIds: string[]) => {
    return wbsElements.filter(el => wbsIds.includes(el.id))
  }
  
  return (
    <div className="space-y-4">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Requirements & Traceability</h2>
          <p className="text-sm text-gray-600 mt-1">
            {stats.total} requirements · {stats.mapped} mapped · {stats.shallCoverage}% "shall" covered
            {stats.unmapped > 0 && <span className="text-red-600 ml-1">· {stats.unmapped} gaps</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}
              `}
            >
              <List className="w-4 h-4 inline mr-1.5" />
              List
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                ${viewMode === 'matrix' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}
              `}
            >
              <Table2 className="w-4 h-4 inline mr-1.5" />
              Matrix
            </button>
            <button
              onClick={() => setViewMode('gaps')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors relative
                ${viewMode === 'gaps' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}
              `}
            >
              <AlertTriangle className="w-4 h-4 inline mr-1.5" />
              Gaps
              {stats.unmapped > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] bg-red-500 text-white rounded-full flex items-center justify-center">
                  {stats.unmapped}
                </span>
              )}
            </button>
          </div>
          
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
      
      {/* Filter Bar */}
      {(viewMode === 'list' || viewMode === 'matrix') && (
        <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-4 py-2">
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[120px] h-8 text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="shall">Shall</SelectItem>
              <SelectItem value="should">Should</SelectItem>
              <SelectItem value="will">Will</SelectItem>
              <SelectItem value="may">May</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="text-sm text-gray-500">
            {filteredRequirements.length} of {requirements.length}
          </div>
        </div>
      )}
      
      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredRequirements.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-100 rounded-lg">
              <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600">No requirements found</p>
            </div>
          ) : (
            filteredRequirements.map(req => {
              const typeConfig = REQUIREMENT_TYPE_CONFIG[req.type]
              const linkedWbs = getLinkedWbsElements(req.linkedWbsIds)
              const isMapped = linkedWbs.length > 0
              
              return (
                <div 
                  key={req.id}
                  className={`group bg-white border rounded-lg p-3 transition-all hover:border-gray-300
                    ${!isMapped ? 'border-l-4 border-l-red-400' : 'border-gray-100'}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-[10px] px-1.5 py-0 h-5 border ${typeConfig.color}`}>
                          {typeConfig.label}
                        </Badge>
                        <span className="font-mono text-sm font-medium text-gray-900">{req.referenceNumber}</span>
                        <span className="text-sm text-gray-700 truncate">{req.title}</span>
                      </div>
                      {req.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 mb-2">{req.description}</p>
                      )}
                      {/* Linked WBS */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {linkedWbs.map(wbs => (
                          <Badge 
                            key={wbs.id} 
                            variant="secondary" 
                            className="text-[10px] px-1.5 py-0 h-5 cursor-pointer hover:bg-red-100"
                            onClick={() => onUnlinkWbs(req.id, wbs.id)}
                            title="Click to unlink"
                          >
                            {wbs.wbsNumber} ×
                          </Badge>
                        ))}
                        <Select onValueChange={(wbsId) => onLinkWbs(req.id, wbsId)}>
                          <SelectTrigger className="h-5 w-auto px-2 text-[10px] text-blue-600 border-none bg-transparent hover:bg-blue-50">
                            <span>+ Link WBS</span>
                          </SelectTrigger>
                          <SelectContent>
                            {wbsElements
                              .filter(wbs => !req.linkedWbsIds.includes(wbs.id))
                              .map(wbs => (
                                <SelectItem key={wbs.id} value={wbs.id} className="text-xs">
                                  {wbs.wbsNumber} - {wbs.title}
                                </SelectItem>
                              ))
                            }
                            {wbsElements.filter(wbs => !req.linkedWbsIds.includes(wbs.id)).length === 0 && (
                              <div className="px-2 py-1 text-xs text-gray-500">All WBS elements linked</div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0"
                        onClick={() => handleOpenDialog(req)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(req.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
      
      {/* GAPS VIEW */}
      {viewMode === 'gaps' && (
        <div className="space-y-4">
          {unmappedRequirements.length === 0 ? (
            <div className="text-center py-12 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-green-800">All Requirements Mapped!</p>
              <p className="text-sm text-green-600 mt-1">Every requirement has at least one WBS element.</p>
            </div>
          ) : (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">{unmappedRequirements.length} Unmapped Requirement{unmappedRequirements.length !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-sm text-red-700 mt-1">Link each requirement to at least one WBS element.</p>
              </div>
              
              <div className="space-y-2">
                {unmappedRequirements.map(req => {
                  const typeConfig = REQUIREMENT_TYPE_CONFIG[req.type]
                  return (
                    <div key={req.id} className="bg-white border border-l-4 border-l-red-400 border-gray-100 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-[10px] px-1.5 py-0 h-5 border ${typeConfig.color}`}>{typeConfig.label}</Badge>
                            <span className="font-mono text-sm font-medium text-gray-900">{req.referenceNumber}</span>
                          </div>
                          <p className="text-sm text-gray-700">{req.title}</p>
                        </div>
                        <Select onValueChange={(wbsId) => onLinkWbs(req.id, wbsId)}>
                          <SelectTrigger className="w-[180px] h-8 text-xs">
                            <SelectValue placeholder="Link to WBS..." />
                          </SelectTrigger>
                          <SelectContent>
                            {wbsElements.map(wbs => (
                              <SelectItem key={wbs.id} value={wbs.id}>{wbs.wbsNumber} - {wbs.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
      
      {/* MATRIX VIEW - Simplified for space */}
      {viewMode === 'matrix' && (
        <div className="bg-white border border-gray-100 rounded-lg p-8 text-center text-gray-500">
          <Table2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Matrix view shows requirement-to-WBS traceability</p>
        </div>
      )}
      
      {/* Add/Edit Requirement Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingReq ? 'Edit Requirement' : 'Add Requirement'}</DialogTitle>
            <DialogDescription>
              {editingReq ? 'Update requirement details' : 'Add a SOO/PWS requirement for traceability'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Reference # <span className="text-red-500">*</span></Label>
                <Input 
                  value={formData.referenceNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                  placeholder="SOO 3.1.1"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={formData.type || 'shall'} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as RequirementType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shall">Shall (Required)</SelectItem>
                    <SelectItem value="should">Should</SelectItem>
                    <SelectItem value="may">May (Optional)</SelectItem>
                    <SelectItem value="will">Will</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={formData.priority || 'medium'} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v as 'critical' | 'high' | 'medium' | 'low' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input 
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief title for this requirement"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Full requirement text..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={formData.category || 'functional'} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as RequirementCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functional">Functional</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Input 
                  value={formData.source || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  placeholder="e.g., Page 12, Section 3.1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                placeholder="Internal notes about this requirement..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.referenceNumber || !formData.title}
            >
              {editingReq ? 'Save Changes' : 'Add Requirement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// WBS SLIDEOUT PANEL
// ============================================================================

interface WBSSlideoutProps {
  element: EnhancedWBSElement
  isOpen: boolean
  onClose: () => void
  onUpdate: (id: string, updates: Partial<EnhancedWBSElement>) => void
  contractPeriods: { key: PeriodKey; label: string }[]
  allElements: EnhancedWBSElement[]
  selectedRoles: SelectedRole[]
  chargeCodes: ChargeCode[]
  // Labor editing
  onOpenLaborDialog: (labor?: EnhancedLaborEstimate) => void
  onDeleteLabor: (laborId: string) => void
  // Risk editing
  onOpenRiskDialog: (risk?: WBSRisk) => void
  onDeleteRisk: (riskId: string) => void
  // Dependency editing
  onOpenDependencyDialog: (dep?: WBSDependency) => void
  onDeleteDependency: (depId: string) => void
  // Element editing
  onOpenEditElement: () => void
}

function WBSSlideout({ 
  element, 
  isOpen, 
  onClose, 
  onUpdate, 
  contractPeriods,
  allElements,
  selectedRoles,
  chargeCodes,
  onOpenLaborDialog,
  onDeleteLabor,
  onOpenRiskDialog,
  onDeleteRisk,
  onOpenDependencyDialog,
  onDeleteDependency,
  onOpenEditElement,
}: WBSSlideoutProps) {
  const [activeTab, setActiveTab] = useState('details')
  
  if (!isOpen) return null
  
  const gradeConfig = QUALITY_GRADE_CONFIG[element.qualityGrade]
  const totalHours = getElementTotalHours(element)
  
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-[700px] bg-white shadow-2xl z-50 
                      overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-100 px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-semibold text-gray-900">{element.wbsNumber}</span>
                <h3 className="text-lg font-semibold text-gray-900">{element.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${gradeConfig.bgColor} ${gradeConfig.textColor} border ${gradeConfig.borderColor} text-[10px] px-1.5 py-0 h-5`}>
                  {gradeConfig.label} ({element.qualityScore}%)
                </Badge>
                {element.sowReference && (
                  <span className="text-sm text-gray-600">{element.sowReference}</span>
                )}
                <span className="text-sm font-semibold text-gray-900 ml-auto">{totalHours.toLocaleString()} hrs</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onOpenEditElement}
                className="h-8"
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClose}
                className="text-2xl leading-none h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        </div>
        
        {/* Quality Issues Banner */}
        {element.qualityIssues.length > 0 && (
          <div className="flex-shrink-0 px-6 py-2 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">{element.qualityIssues.length} issue(s):</span>
              <span>{element.qualityIssues.join(' • ')}</span>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
              <TabsTrigger value="labor" className="text-xs">
                Labor
                <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 h-4">
                  {element.laborEstimates.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="risks" className="text-xs">
                Risks
                <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 h-4">
                  {element.risks.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="dependencies" className="text-xs">Deps</TabsTrigger>
            </TabsList>
            
            {/* DETAILS TAB */}
            <TabsContent value="details" className="space-y-6">
              <div className="space-y-4">
                {/* Period of Performance */}
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(element.periodOfPerformance.startDate)} – {formatDate(element.periodOfPerformance.endDate)}</span>
                </div>
                
                {/* Description Sections */}
                {element.why && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Why</h4>
                    <p className="text-sm text-gray-900">{element.why}</p>
                  </div>
                )}
                
                {element.what && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">What</h4>
                    <p className="text-sm text-gray-900">{element.what}</p>
                  </div>
                )}
                
                {element.notIncluded && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Not Included</h4>
                    <p className="text-sm text-gray-600">{element.notIncluded}</p>
                  </div>
                )}
                
                {/* Estimate Method */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{ESTIMATE_METHOD_LABELS[element.estimateMethod].icon}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {ESTIMATE_METHOD_LABELS[element.estimateMethod].label}
                    </span>
                    {element.complexityFactor !== 1.0 && (
                      <Badge variant="outline" className="text-[10px]">{element.complexityFactor}x</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    {ESTIMATE_METHOD_LABELS[element.estimateMethod].description}
                  </p>
                  
                  {/* Complexity Justification */}
                  {element.complexityFactor !== 1.0 && element.complexityJustification && (
                    <div className="text-xs text-gray-700 bg-white rounded p-2 mb-3">
                      <span className="font-semibold">Complexity Justification:</span> {element.complexityJustification}
                    </div>
                  )}
                  
                  {/* Historical Reference Display */}
                  {element.estimateMethod === 'historical' && element.historicalReference && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Hash className="w-4 h-4" />
                        <span className="font-medium text-sm">Historical Reference</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-mono font-semibold text-blue-900">{element.historicalReference.chargeNumber}</span>
                        {element.historicalReference.projectName && (
                          <span className="text-blue-700 ml-2">— {element.historicalReference.projectName}</span>
                        )}
                      </div>
                      {element.historicalReference.dateRange && (
                        <div className="text-xs text-blue-600">{element.historicalReference.dateRange}</div>
                      )}
                      {element.historicalReference.actualHours > 0 && (
                        <div className="text-xs text-blue-700">
                          <span className="font-semibold">Reference Hours:</span> {element.historicalReference.actualHours.toLocaleString()}
                        </div>
                      )}
                      {element.historicalReference.notes && (
                        <div className="text-xs text-blue-700 mt-1">
                          <span className="font-semibold">Notes:</span> {element.historicalReference.notes}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Engineering Basis Display */}
                  {element.estimateMethod === 'engineering' && element.engineeringBasis && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-3 space-y-2">
                      <div className="flex items-center gap-2 text-amber-800">
                        <Lightbulb className="w-4 h-4" />
                        <span className="font-medium text-sm">Engineering Judgment Basis</span>
                      </div>
                      {element.engineeringBasis.similarWork && (
                        <div className="text-xs text-amber-700">
                          <span className="font-semibold">Similar Work:</span> {element.engineeringBasis.similarWork}
                        </div>
                      )}
                      {element.engineeringBasis.expertSource && (
                        <div className="text-xs text-amber-700">
                          <span className="font-semibold">Expert Source:</span> {element.engineeringBasis.expertSource}
                        </div>
                      )}
                      {element.engineeringBasis.assumptions && (
                        <div className="text-xs text-amber-700">
                          <span className="font-semibold">Assumptions:</span> {element.engineeringBasis.assumptions}
                        </div>
                      )}
                      {element.engineeringBasis.confidenceNotes && (
                        <div className="text-xs text-amber-700">
                          <span className="font-semibold">Confidence Notes:</span> {element.engineeringBasis.confidenceNotes}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Parametric Basis Display */}
                  {element.estimateMethod === 'parametric' && element.engineeringBasis && (
                    <div className="bg-green-50 border border-green-200 rounded p-3 space-y-2">
                      <div className="flex items-center gap-2 text-green-800">
                        <BarChart3 className="w-4 h-4" />
                        <span className="font-medium text-sm">Parametric Calculation</span>
                      </div>
                      {element.engineeringBasis.similarWork && (
                        <div className="text-xs text-green-700">
                          <span className="font-semibold">Calculation:</span> {element.engineeringBasis.similarWork}
                        </div>
                      )}
                      {element.engineeringBasis.expertSource && (
                        <div className="text-xs text-green-700">
                          <span className="font-semibold">Data Source:</span> {element.engineeringBasis.expertSource}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Firm Quote Display */}
                  {element.estimateMethod === 'firm-quote' && element.engineeringBasis && (
                    <div className="bg-purple-50 border border-purple-200 rounded p-3 space-y-2">
                      <div className="flex items-center gap-2 text-purple-800">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium text-sm">Firm Quote</span>
                      </div>
                      {element.engineeringBasis.expertSource && (
                        <div className="text-xs text-purple-700">
                          <span className="font-semibold">Vendor:</span> {element.engineeringBasis.expertSource}
                        </div>
                      )}
                      {element.engineeringBasis.assumptions && (
                        <div className="text-xs text-purple-700">
                          <span className="font-semibold">Quote Reference:</span> {element.engineeringBasis.assumptions}
                        </div>
                      )}
                      {element.engineeringBasis.similarWork && (
                        <div className="text-xs text-purple-700">
                          <span className="font-semibold">Details:</span> {element.engineeringBasis.similarWork}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* LOE Display */}
                  {element.estimateMethod === 'level-of-effort' && element.engineeringBasis && (
                    <div className="bg-gray-100 border border-gray-300 rounded p-3 space-y-2">
                      <div className="flex items-center gap-2 text-gray-800">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium text-sm">Level of Effort Basis</span>
                      </div>
                      {element.engineeringBasis.similarWork && (
                        <div className="text-xs text-gray-700">
                          <span className="font-semibold">Staffing Rationale:</span> {element.engineeringBasis.similarWork}
                        </div>
                      )}
                      {element.engineeringBasis.expertSource && (
                        <div className="text-xs text-gray-700">
                          <span className="font-semibold">Contract Basis:</span> {element.engineeringBasis.expertSource}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Warning if no justification */}
                  {element.estimateMethod === 'historical' && !element.historicalReference?.chargeNumber && (
                    <div className="text-xs text-red-600 flex items-center gap-1 mt-2">
                      <AlertTriangle className="w-3 h-3" />
                      Missing historical reference - click Edit to add
                    </div>
                  )}
                  {element.estimateMethod === 'engineering' && !element.engineeringBasis?.similarWork && !element.engineeringBasis?.expertSource && (
                    <div className="text-xs text-yellow-600 flex items-center gap-1 mt-2">
                      <AlertTriangle className="w-3 h-3" />
                      Engineering basis incomplete - click Edit to document
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* LABOR TAB */}
            <TabsContent value="labor" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-900">Labor Estimates</h4>
                <Button size="sm" variant="outline" onClick={() => onOpenLaborDialog()}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Role
                </Button>
              </div>
              
              {element.laborEstimates.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No labor estimates defined</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => onOpenLaborDialog()}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add First Role
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {element.laborEstimates.map(labor => (
                    <div 
                      key={labor.id}
                      className={`group border rounded-lg p-4 ${labor.isOrphaned ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white hover:border-gray-300'} transition-colors`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${labor.isOrphaned ? 'text-red-700' : 'text-gray-900'}`}>
                            {labor.roleName}
                          </span>
                          {labor.isOrphaned && (
                            <Badge variant="destructive" className="text-[10px]">Orphaned</Badge>
                          )}
                          {labor.isAISuggested && (
                            <Bot className="w-3 h-3 text-purple-500" />
                          )}
                          <Badge variant="outline" className={`text-[10px] ${CONFIDENCE_CONFIG[labor.confidence].color}`}>
                            {CONFIDENCE_CONFIG[labor.confidence].label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {getTotalHours(labor.hoursByPeriod).toLocaleString()} hrs
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => onOpenLaborDialog(labor)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => onDeleteLabor(labor.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Hours Grid */}
                      <div className="grid grid-cols-5 gap-2 mb-2 text-xs">
                        {contractPeriods.map(period => (
                          <div key={period.key} className="text-center">
                            <div className="text-gray-500">{period.label}</div>
                            <div className="font-semibold text-gray-900">
                              {labor.hoursByPeriod[period.key].toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {labor.rationale && (
                        <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                          <span className="font-semibold text-gray-700">Rationale:</span> {labor.rationale}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* RISKS TAB */}
            <TabsContent value="risks" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-900">Risk Register</h4>
                <Button size="sm" variant="outline" onClick={() => onOpenRiskDialog()}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Risk
                </Button>
              </div>
              
              {element.risks.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No risks identified</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => onOpenRiskDialog()}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add First Risk
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {element.risks.map(risk => {
                    const score = getRiskScore(risk)
                    return (
                      <div 
                        key={risk.id}
                        className={`group border border-l-4 ${getRiskColor(score)} border-gray-100 rounded-lg p-4 hover:border-gray-300 transition-colors`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm text-gray-900 flex-1">{risk.description}</p>
                          <div className="flex items-center gap-2 ml-4">
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">{score}</div>
                              <div className="text-[10px] text-gray-500">P×I</div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => onOpenRiskDialog(risk)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => onDeleteRisk(risk.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-600">{PROBABILITY_LABELS[risk.probability]}</span>
                          <span className="text-gray-300">×</span>
                          <span className="text-gray-600">{IMPACT_LABELS[risk.impact]}</span>
                          <Badge variant="outline" className="text-[10px] capitalize">{risk.status}</Badge>
                        </div>
                        {risk.mitigation && (
                          <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                            <span className="font-semibold text-gray-700">Mitigation:</span> {risk.mitigation}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>
            
            {/* DEPENDENCIES TAB */}
            <TabsContent value="dependencies" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-900">Dependencies</h4>
                <Button size="sm" variant="outline" onClick={() => onOpenDependencyDialog()}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Dependency
                </Button>
              </div>
              
              {element.dependencies.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No dependencies defined</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => onOpenDependencyDialog()}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add First Dependency
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {element.dependencies.map(dep => (
                    <div 
                      key={dep.id}
                      className="group flex items-center justify-between border border-gray-100 rounded-lg p-3 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">{dep.predecessorWbsNumber}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{element.wbsNumber}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {DEPENDENCY_TYPE_LABELS[dep.type].label}
                        </Badge>
                        {dep.lagDays > 0 && (
                          <span className="text-xs text-gray-500">+{dep.lagDays} days lag</span>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => onOpenDependencyDialog(dep)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onDeleteDependency(dep.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

// ============================================================================
// MAIN ESTIMATE TAB COMPONENT - NOW CONNECTED TO CONTEXT
// ============================================================================

export function EstimateTab() {
  // ============================================================================
  // CONTEXT INTEGRATION - Pull data from shared app state
  // ============================================================================
  const { 
    // Roles from Roles & Pricing tab
    selectedRoles: contextRoles,
    
    // Solicitation from Upload tab (period of performance)
    solicitation,
    
    // Billable hours setting
    uiBillableHours,
    
    // Rate calculation (for showing loaded rates if needed)
    calculateLoadedRate,
  } = useAppContext()
  
  // ============================================================================
  // MAP CONTEXT DATA TO COMPONENT TYPES
  // ============================================================================
  
  // Map context roles to internal SelectedRole format
  const selectedRoles: SelectedRole[] = useMemo(() => {
    if (contextRoles.length === 0) {
      // Provide fallback mock data if no roles selected yet
      return [
        { id: '1', name: 'Delivery Manager', category: 'Management', baseRate: 180 },
        { id: '2', name: 'Product Manager', category: 'Management', baseRate: 165 },
        { id: '3', name: 'Design Lead', category: 'Design', baseRate: 150 },
        { id: '4', name: 'Frontend Engineer', category: 'Engineering', baseRate: 145 },
        { id: '5', name: 'Backend Engineer', category: 'Engineering', baseRate: 145 },
        { id: '6', name: 'DevOps Engineer', category: 'Engineering', baseRate: 155 },
        { id: '7', name: 'QA Engineer', category: 'Engineering', baseRate: 125 },
      ]
    }
    
    return contextRoles.map(role => ({
      id: role.id,
      name: role.name,
      category: role.icLevel || 'General', // Use IC level as category
      baseRate: Math.round(calculateLoadedRate(role.baseSalary)), // Calculate hourly bill rate
    }))
  }, [contextRoles, calculateLoadedRate])
  
  // Build contract periods from solicitation
  const contractPeriods = useMemo(() => {
    const periods: { key: PeriodKey; label: string }[] = []
    
    if (solicitation.periodOfPerformance.baseYear) {
      periods.push({ key: 'base', label: 'Base' })
    }
    
    for (let i = 1; i <= solicitation.periodOfPerformance.optionYears; i++) {
      periods.push({ key: `option${i}` as PeriodKey, label: `Opt ${i}` })
    }
    
    // Ensure at least base year if nothing configured
    if (periods.length === 0) {
      periods.push({ key: 'base', label: 'Base' })
    }
    
    return periods
  }, [solicitation.periodOfPerformance])
  
  // ============================================================================
  // LOCAL STATE (Component-specific, not shared)
  // ============================================================================
  
  const [chargeCodes, setChargeCodes] = useState<ChargeCode[]>(MOCK_CHARGE_CODES)
  const [requirements, setRequirements] = useState<SOORequirement[]>(MOCK_REQUIREMENTS)
  
  // WBS Elements - initialize with mock data based on actual roles
  const [wbsElements, setWbsElements] = useState<EnhancedWBSElement[]>(() => 
    generateMockWBSElements(selectedRoles, solicitation.periodOfPerformance.optionYears)
  )
  
  // Re-generate WBS mock data when roles change significantly
  useEffect(() => {
    if (selectedRoles.length > 0 && wbsElements.length === 0) {
      setWbsElements(generateMockWBSElements(selectedRoles, solicitation.periodOfPerformance.optionYears))
    }
  }, [selectedRoles, solicitation.periodOfPerformance.optionYears])
  
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGrade, setFilterGrade] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('wbs')
  const [activeSection, setActiveSection] = useState('wbs')
  
  // Add Element Dialog State
  const [showAddElement, setShowAddElement] = useState(false)
  const [newElement, setNewElement] = useState<Partial<EnhancedWBSElement>>({
    wbsNumber: '',
    title: '',
    sowReference: '',
    clin: '',
    periodOfPerformance: { startDate: '', endDate: '' },
    why: '',
    what: '',
    notIncluded: '',
    assumptions: [],
    estimateMethod: 'engineering',
    complexityFactor: 1.0,
    complexityJustification: '',
  })
  
  // ============================================================================
  // EDITING DIALOG STATES
  // ============================================================================
  
  // Labor Dialog
  const [showLaborDialog, setShowLaborDialog] = useState(false)
  const [editingLabor, setEditingLabor] = useState<EnhancedLaborEstimate | null>(null)
  const [laborForm, setLaborForm] = useState<{
    roleId: string
    rationale: string
    confidence: 'high' | 'medium' | 'low'
    hoursByPeriod: PeriodHours
  }>({
    roleId: '',
    rationale: '',
    confidence: 'medium',
    hoursByPeriod: { base: 0, option1: 0, option2: 0, option3: 0, option4: 0 },
  })
  
  // Risk Dialog
  const [showRiskDialog, setShowRiskDialog] = useState(false)
  const [editingRisk, setEditingRisk] = useState<WBSRisk | null>(null)
  const [riskForm, setRiskForm] = useState<{
    description: string
    probability: 1 | 2 | 3 | 4 | 5
    impact: 1 | 2 | 3 | 4 | 5
    mitigation: string
    status: 'open' | 'mitigated' | 'accepted' | 'closed'
  }>({
    description: '',
    probability: 3,
    impact: 3,
    mitigation: '',
    status: 'open',
  })
  
  // Dependency Dialog
  const [showDependencyDialog, setShowDependencyDialog] = useState(false)
  const [editingDependency, setEditingDependency] = useState<WBSDependency | null>(null)
  const [dependencyForm, setDependencyForm] = useState<{
    predecessorWbsId: string
    type: 'FS' | 'SS' | 'FF' | 'SF'
    lagDays: number
  }>({
    predecessorWbsId: '',
    type: 'FS',
    lagDays: 0,
  })
  
  // Edit Element Dialog
  const [showEditElement, setShowEditElement] = useState(false)
  const [editElementBuffer, setEditElementBuffer] = useState<Partial<EnhancedWBSElement>>({})
  const [directEditElementId, setDirectEditElementId] = useState<string | null>(null)
  
  // ============================================================================
  // DIALOG OPEN HANDLERS
  // ============================================================================
  
  const handleOpenLaborDialog = (labor?: EnhancedLaborEstimate) => {
    if (labor) {
      setEditingLabor(labor)
      setLaborForm({
        roleId: labor.roleId,
        rationale: labor.rationale,
        confidence: labor.confidence,
        hoursByPeriod: { ...labor.hoursByPeriod },
      })
    } else {
      setEditingLabor(null)
      setLaborForm({
        roleId: '',
        rationale: '',
        confidence: 'medium',
        hoursByPeriod: { base: 0, option1: 0, option2: 0, option3: 0, option4: 0 },
      })
    }
    setShowLaborDialog(true)
  }
  
  const handleOpenRiskDialog = (risk?: WBSRisk) => {
    if (risk) {
      setEditingRisk(risk)
      setRiskForm({
        description: risk.description,
        probability: risk.probability,
        impact: risk.impact,
        mitigation: risk.mitigation,
        status: risk.status,
      })
    } else {
      setEditingRisk(null)
      setRiskForm({
        description: '',
        probability: 3,
        impact: 3,
        mitigation: '',
        status: 'open',
      })
    }
    setShowRiskDialog(true)
  }
  
  const handleOpenDependencyDialog = (dep?: WBSDependency) => {
    if (dep) {
      setEditingDependency(dep)
      setDependencyForm({
        predecessorWbsId: dep.predecessorWbsId,
        type: dep.type,
        lagDays: dep.lagDays,
      })
    } else {
      setEditingDependency(null)
      setDependencyForm({
        predecessorWbsId: '',
        type: 'FS',
        lagDays: 0,
      })
    }
    setShowDependencyDialog(true)
  }
  
  const handleOpenEditElement = () => {
    if (selectedElement) {
      setDirectEditElementId(null) // Use selectedElement.id for saves
      setEditElementBuffer({
        wbsNumber: selectedElement.wbsNumber,
        title: selectedElement.title,
        sowReference: selectedElement.sowReference,
        clin: selectedElement.clin,
        periodOfPerformance: { ...selectedElement.periodOfPerformance },
        why: selectedElement.why,
        what: selectedElement.what,
        notIncluded: selectedElement.notIncluded,
        estimateMethod: selectedElement.estimateMethod,
        complexityFactor: selectedElement.complexityFactor,
        complexityJustification: selectedElement.complexityJustification,
        historicalReference: selectedElement.historicalReference 
          ? { ...selectedElement.historicalReference }
          : undefined,
        engineeringBasis: selectedElement.engineeringBasis
          ? { ...selectedElement.engineeringBasis }
          : undefined,
      })
      setShowEditElement(true)
    }
  }
  
  // Direct edit from card/list - takes element directly instead of relying on selectedElement state
  const handleDirectEditElement = (element: EnhancedWBSElement) => {
    // Don't set selectedElementId - that opens the slideout
    // Just populate the edit buffer and open the dialog
    setEditElementBuffer({
      wbsNumber: element.wbsNumber,
      title: element.title,
      sowReference: element.sowReference,
      clin: element.clin,
      periodOfPerformance: { ...element.periodOfPerformance },
      why: element.why,
      what: element.what,
      notIncluded: element.notIncluded,
      estimateMethod: element.estimateMethod,
      complexityFactor: element.complexityFactor,
      complexityJustification: element.complexityJustification,
      historicalReference: element.historicalReference 
        ? { ...element.historicalReference }
        : undefined,
      engineeringBasis: element.engineeringBasis
        ? { ...element.engineeringBasis }
        : undefined,
    })
    // Store which element we're editing so save works correctly
    setDirectEditElementId(element.id)
    setShowEditElement(true)
  }
  
  // ============================================================================
  // DIALOG SAVE HANDLERS
  // ============================================================================
  
  const handleSaveLabor = () => {
    if (!selectedElement || !laborForm.roleId) return
    
    const role = selectedRoles.find(r => r.id === laborForm.roleId)
    if (!role) return
    
    if (editingLabor) {
      // Update existing labor
      const updatedEstimates = selectedElement.laborEstimates.map(l => {
        if (l.id !== editingLabor.id) return l
        return {
          ...l,
          roleId: laborForm.roleId,
          roleName: role.name,
          rationale: laborForm.rationale,
          confidence: laborForm.confidence,
          hoursByPeriod: { ...laborForm.hoursByPeriod },
        }
      })
      handleUpdateElement(selectedElement.id, { laborEstimates: updatedEstimates })
    } else {
      // Add new labor
      const newLabor: EnhancedLaborEstimate = {
        id: generateId(),
        roleId: role.id,
        roleName: role.name,
        hoursByPeriod: { ...laborForm.hoursByPeriod },
        rationale: laborForm.rationale,
        confidence: laborForm.confidence,
        isAISuggested: false,
        isOrphaned: false,
      }
      handleUpdateElement(selectedElement.id, {
        laborEstimates: [...selectedElement.laborEstimates, newLabor],
      })
    }
    
    setShowLaborDialog(false)
    setEditingLabor(null)
  }
  
  const handleDeleteLabor = (laborId: string) => {
    if (!selectedElement) return
    handleUpdateElement(selectedElement.id, {
      laborEstimates: selectedElement.laborEstimates.filter(l => l.id !== laborId),
    })
  }
  
  const handleSaveRisk = () => {
    if (!selectedElement || !riskForm.description) return
    
    if (editingRisk) {
      const updatedRisks = selectedElement.risks.map(r => {
        if (r.id !== editingRisk.id) return r
        return { ...r, ...riskForm }
      })
      handleUpdateElement(selectedElement.id, { risks: updatedRisks })
    } else {
      const newRisk: WBSRisk = {
        id: generateId(),
        ...riskForm,
      }
      handleUpdateElement(selectedElement.id, {
        risks: [...selectedElement.risks, newRisk],
      })
    }
    
    setShowRiskDialog(false)
    setEditingRisk(null)
  }
  
  const handleDeleteRisk = (riskId: string) => {
    if (!selectedElement) return
    handleUpdateElement(selectedElement.id, {
      risks: selectedElement.risks.filter(r => r.id !== riskId),
    })
  }
  
  const handleSaveDependency = () => {
    if (!selectedElement || !dependencyForm.predecessorWbsId) return
    
    const predecessor = wbsElements.find(el => el.id === dependencyForm.predecessorWbsId)
    if (!predecessor) return
    
    if (editingDependency) {
      const updatedDeps = selectedElement.dependencies.map(d => {
        if (d.id !== editingDependency.id) return d
        return {
          ...d,
          predecessorWbsId: dependencyForm.predecessorWbsId,
          predecessorWbsNumber: predecessor.wbsNumber,
          type: dependencyForm.type,
          lagDays: dependencyForm.lagDays,
        }
      })
      handleUpdateElement(selectedElement.id, { dependencies: updatedDeps })
    } else {
      const newDep: WBSDependency = {
        id: generateId(),
        predecessorWbsId: dependencyForm.predecessorWbsId,
        predecessorWbsNumber: predecessor.wbsNumber,
        type: dependencyForm.type,
        lagDays: dependencyForm.lagDays,
      }
      handleUpdateElement(selectedElement.id, {
        dependencies: [...selectedElement.dependencies, newDep],
      })
    }
    
    setShowDependencyDialog(false)
    setEditingDependency(null)
  }
  
  const handleDeleteDependency = (depId: string) => {
    if (!selectedElement) return
    handleUpdateElement(selectedElement.id, {
      dependencies: selectedElement.dependencies.filter(d => d.id !== depId),
    })
  }
  
  const handleSaveEditElement = () => {
    // Use directEditElementId if editing from card, otherwise use selectedElement
    const elementId = directEditElementId || selectedElement?.id
    if (!elementId) return
    
    handleUpdateElement(elementId, editElementBuffer)
    setShowEditElement(false)
    setDirectEditElementId(null) // Reset for next time
  }
  
  // ============================================================================
  // CHARGE CODE HANDLERS
  // ============================================================================
  
  const handleAddChargeCode = (chargeCode: ChargeCode) => {
    setChargeCodes(prev => [...prev, chargeCode])
  }
  
  const handleUpdateChargeCode = (id: string, updates: Partial<ChargeCode>) => {
    setChargeCodes(prev => prev.map(cc => 
      cc.id === id ? { ...cc, ...updates } : cc
    ))
  }
  
  const handleDeleteChargeCode = (id: string) => {
    setChargeCodes(prev => prev.filter(cc => cc.id !== id))
  }
  
  // ============================================================================
  // REQUIREMENTS HANDLERS
  // ============================================================================
  
  // Auto-link requirements to WBS elements based on sowReference on mount
  useEffect(() => {
    setRequirements(prev => prev.map(req => {
      const matchingWbs = wbsElements.filter(wbs => {
        if (!wbs.sowReference) return false
        const wbsSection = wbs.sowReference.replace(/^(SOO|PWS|SOW)\s*/i, '')
        return req.referenceNumber.includes(wbsSection)
      })
      return {
        ...req,
        linkedWbsIds: matchingWbs.map(w => w.id)
      }
    }))
  }, []) // Only run on mount
  
  const handleAddRequirement = (req: SOORequirement) => {
    setRequirements(prev => [...prev, req])
  }
  
  const handleUpdateRequirement = (id: string, updates: Partial<SOORequirement>) => {
    setRequirements(prev => prev.map(r => 
      r.id === id ? { ...r, ...updates } : r
    ))
  }
  
  const handleDeleteRequirement = (id: string) => {
    setRequirements(prev => prev.filter(r => r.id !== id))
  }
  
  const handleLinkWbs = (reqId: string, wbsId: string) => {
    setRequirements(prev => prev.map(r => {
      if (r.id !== reqId) return r
      if (r.linkedWbsIds.includes(wbsId)) return r
      return { ...r, linkedWbsIds: [...r.linkedWbsIds, wbsId] }
    }))
  }
  
  const handleUnlinkWbs = (reqId: string, wbsId: string) => {
    setRequirements(prev => prev.map(r => {
      if (r.id !== reqId) return r
      return { ...r, linkedWbsIds: r.linkedWbsIds.filter(id => id !== wbsId) }
    }))
  }
  
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const stats = useMemo(() => {
    const totalHours = wbsElements.reduce((sum, el) => sum + getElementTotalHours(el), 0)
    const avgQuality = wbsElements.length > 0 
      ? Math.round(wbsElements.reduce((sum, el) => sum + el.qualityScore, 0) / wbsElements.length)
      : 0
    const totalRisks = wbsElements.reduce((sum, el) => sum + el.risks.length, 0)
    const issueCount = wbsElements.reduce((sum, el) => sum + el.qualityIssues.length, 0)
    
    // Requirements coverage
    const totalReqs = requirements.length
    const mappedReqs = requirements.filter(r => r.linkedWbsIds.length > 0).length
    const requirementsCoverage = totalReqs > 0 ? Math.round((mappedReqs / totalReqs) * 100) : 100
    const unmappedRequirements = totalReqs - mappedReqs
    
    return { totalHours, avgQuality, totalRisks, issueCount, requirementsCoverage, unmappedRequirements }
  }, [wbsElements, requirements])
  
  const filteredElements = useMemo(() => {
    let filtered = [...wbsElements]
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(el => 
        el.title.toLowerCase().includes(query) ||
        el.wbsNumber.toLowerCase().includes(query) ||
        el.sowReference?.toLowerCase().includes(query)
      )
    }
    
    if (filterGrade !== 'all') {
      filtered = filtered.filter(el => el.qualityGrade === filterGrade)
    }
    
    switch (sortBy) {
      case 'wbs':
        filtered.sort((a, b) => a.wbsNumber.localeCompare(b.wbsNumber, undefined, { numeric: true }))
        break
      case 'quality':
        filtered.sort((a, b) => b.qualityScore - a.qualityScore)
        break
      case 'hours':
        filtered.sort((a, b) => getElementTotalHours(b) - getElementTotalHours(a))
        break
    }
    
    return filtered
  }, [wbsElements, searchQuery, filterGrade, sortBy])
  
  const selectedElement = wbsElements.find(el => el.id === selectedElementId)
  
  // ============================================================================
  // WBS ELEMENT HANDLERS
  // ============================================================================
  
  const handleUpdateElement = (id: string, updates: Partial<EnhancedWBSElement>) => {
    setWbsElements(prev => prev.map(el => {
      if (el.id !== id) return el
      const updated = { ...el, ...updates }
      const { score, grade, issues } = calculateQualityScore(updated)
      return { ...updated, qualityScore: score, qualityGrade: grade, qualityIssues: issues }
    }))
  }
  
  const handleDeleteElement = (id: string) => {
    setWbsElements(prev => prev.filter(el => el.id !== id))
    if (selectedElementId === id) setSelectedElementId(null)
  }
  
  const handleAddElement = () => {
    if (!newElement.wbsNumber || !newElement.title) return
    
    const element: EnhancedWBSElement = {
      id: generateId(),
      wbsNumber: newElement.wbsNumber!,
      title: newElement.title!,
      sowReference: newElement.sowReference || '',
      clin: newElement.clin,
      periodOfPerformance: newElement.periodOfPerformance || { startDate: '', endDate: '' },
      why: newElement.why || '',
      what: newElement.what || '',
      notIncluded: newElement.notIncluded || '',
      assumptions: newElement.assumptions || [],
      estimateMethod: newElement.estimateMethod || 'engineering',
      complexityFactor: newElement.complexityFactor || 1.0,
      complexityJustification: newElement.complexityJustification || '',
      laborEstimates: [],
      risks: [],
      dependencies: [],
      qualityGrade: 'red',
      qualityScore: 0,
      qualityIssues: [],
      isAIGenerated: false,
      aiConfidence: 0,
    }
    
    const { score, grade, issues } = calculateQualityScore(element)
    element.qualityScore = score
    element.qualityGrade = grade
    element.qualityIssues = issues
    
    setWbsElements(prev => [...prev, element])
    setShowAddElement(false)
    setNewElement({
      wbsNumber: '',
      title: '',
      sowReference: '',
      clin: '',
      periodOfPerformance: { startDate: '', endDate: '' },
      why: '',
      what: '',
      notIncluded: '',
      assumptions: [],
      estimateMethod: 'engineering',
      complexityFactor: 1.0,
      complexityJustification: '',
    })
    setSelectedElementId(element.id)
  }
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">Estimate</h1>
            <Badge variant="outline" className="text-xs">
              {wbsElements.length} WBS
            </Badge>
            {/* Show data source indicator */}
            {contextRoles.length > 0 && (
              <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                {contextRoles.length} roles from Roles & Pricing
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Stats Summary */}
            <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-lg text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Hours</span>
                <span className="font-semibold text-gray-900">{stats.totalHours.toLocaleString()}</span>
              </div>
              <span className="text-gray-300">·</span>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Quality</span>
                <span className="font-semibold text-gray-900">{stats.avgQuality}%</span>
              </div>
              <span className="text-gray-300">·</span>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Reqs</span>
                <span className={`font-semibold ${stats.requirementsCoverage === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {stats.requirementsCoverage}%
                </span>
              </div>
              {stats.issueCount > 0 && (
                <>
                  <span className="text-gray-300">·</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-yellow-600">Issues</span>
                    <span className="font-semibold text-yellow-600">{stats.issueCount}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Context Info Banner - Show when no roles */}
        {contextRoles.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <Info className="w-5 h-5" />
              <span className="font-medium">Using sample roles</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Add roles in the <strong>Roles & Pricing</strong> tab to see your actual team here. 
              Contract periods are based on your solicitation ({solicitation.periodOfPerformance.baseYear ? '1 Base' : ''} 
              {solicitation.periodOfPerformance.optionYears > 0 ? ` + ${solicitation.periodOfPerformance.optionYears} Options` : ''}).
            </p>
          </div>
        )}
        
        {/* Horizontal Tabs Navigation */}
        <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="bg-gray-100 p-1">
              <TabsTrigger value="requirements" className="text-xs px-4 data-[state=active]:bg-white">
                <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />
                Requirements
                {stats.unmappedRequirements > 0 && (
                  <Badge variant="destructive" className="ml-1.5 text-[10px] px-1 py-0 h-4">
                    {stats.unmappedRequirements}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="wbs" className="text-xs px-4 data-[state=active]:bg-white">
                <Layers className="w-3.5 h-3.5 mr-1.5" />
                WBS Elements
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0 h-4">
                  {wbsElements.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="charges" className="text-xs px-4 data-[state=active]:bg-white">
                <Hash className="w-3.5 h-3.5 mr-1.5" />
                Charge Codes
              </TabsTrigger>
            </TabsList>
            
            {/* Context-aware action buttons */}
            {activeSection === 'wbs' && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI
                </Button>
                <Button size="sm" onClick={() => setShowAddElement(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Element
                </Button>
              </div>
            )}
          </div>
          
          {/* WBS ELEMENTS SECTION */}
          <TabsContent value="wbs" className="space-y-4 mt-0">
            <HelpBanner />
            
            {/* Filters & View Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search WBS..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
              
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="w-[140px] h-9">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="blue">Audit-Ready</SelectItem>
                  <SelectItem value="green">Complete</SelectItem>
                  <SelectItem value="yellow">Needs Review</SelectItem>
                  <SelectItem value="red">Incomplete</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wbs">By WBS #</SelectItem>
                  <SelectItem value="quality">By Quality</SelectItem>
                  <SelectItem value="hours">By Hours</SelectItem>
                </SelectContent>
              </Select>
              
              <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
            </div>
            
            {/* Content */}
            {filteredElements.length === 0 ? (
              <div className="text-center py-12 bg-white border border-gray-100 rounded-lg">
                <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No WBS elements found</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAddElement(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Element
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredElements.map(element => (
                  <WBSCard
                    key={element.id}
                    element={element}
                    onClick={() => setSelectedElementId(element.id)}
                    onEdit={() => handleDirectEditElement(element)}
                    onDelete={() => handleDeleteElement(element.id)}
                    contractPeriods={contractPeriods}
                  />
                ))}
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-2">
                {/* List Header */}
                <div className="flex items-center gap-4 px-4 py-2 text-xs font-medium text-gray-500">
                  <div className="w-16">WBS</div>
                  <div className="flex-1">Title</div>
                  <div className="w-24">Quality</div>
                  <div className="w-32">Method</div>
                  <div className="w-16 text-center">Roles</div>
                  <div className="w-24 text-right">Hours</div>
                  <div className="w-16 text-center">Issues</div>
                  <div className="w-16"></div>
                </div>
                {filteredElements.map(element => (
                  <WBSListItem
                    key={element.id}
                    element={element}
                    onClick={() => setSelectedElementId(element.id)}
                    onEdit={() => handleDirectEditElement(element)}
                    onDelete={() => handleDeleteElement(element.id)}
                  />
                ))}
              </div>
            ) : (
              <WBSTableView
                elements={filteredElements}
                onElementClick={setSelectedElementId}
                onEdit={handleDirectEditElement}
                onDelete={handleDeleteElement}
                contractPeriods={contractPeriods}
              />
            )}
          </TabsContent>
          
          {/* REQUIREMENTS SECTION */}
          <TabsContent value="requirements" className="mt-0">
            <RequirementsSection
              requirements={requirements}
              wbsElements={wbsElements}
              onAdd={handleAddRequirement}
              onUpdate={handleUpdateRequirement}
              onDelete={handleDeleteRequirement}
              onLinkWbs={handleLinkWbs}
              onUnlinkWbs={handleUnlinkWbs}
            />
          </TabsContent>
          
          {/* CHARGE CODES SECTION */}
          <TabsContent value="charges" className="mt-0">
            <ChargeCodeLibrary 
              chargeCodes={chargeCodes}
              onAdd={handleAddChargeCode}
              onUpdate={handleUpdateChargeCode}
              onDelete={handleDeleteChargeCode}
            />
          </TabsContent>
        </Tabs>
        
        {/* Slideout */}
        {selectedElement && (
          <WBSSlideout
            element={selectedElement}
            isOpen={!!selectedElementId}
            onClose={() => setSelectedElementId(null)}
            onUpdate={handleUpdateElement}
            contractPeriods={contractPeriods}
            allElements={wbsElements}
            selectedRoles={selectedRoles}
            chargeCodes={chargeCodes}
            onOpenLaborDialog={handleOpenLaborDialog}
            onDeleteLabor={handleDeleteLabor}
            onOpenRiskDialog={handleOpenRiskDialog}
            onDeleteRisk={handleDeleteRisk}
            onOpenDependencyDialog={handleOpenDependencyDialog}
            onDeleteDependency={handleDeleteDependency}
            onOpenEditElement={handleOpenEditElement}
          />
        )}
        
        {/* Add Element Dialog */}
        <Dialog open={showAddElement} onOpenChange={setShowAddElement}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add WBS Element</DialogTitle>
              <DialogDescription>
                Create a new Work Breakdown Structure element for your estimate
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>WBS Number <span className="text-red-500">*</span></Label>
                  <Input 
                    value={newElement.wbsNumber || ''}
                    onChange={(e) => setNewElement(prev => ({ ...prev, wbsNumber: e.target.value }))}
                    placeholder="e.g., 1.4"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Title <span className="text-red-500">*</span></Label>
                  <Input 
                    value={newElement.title || ''}
                    onChange={(e) => setNewElement(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., User Authentication Module"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SOW Reference</Label>
                  <Input 
                    value={newElement.sowReference || ''}
                    onChange={(e) => setNewElement(prev => ({ ...prev, sowReference: e.target.value }))}
                    placeholder="e.g., SOW 3.2.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CLIN</Label>
                  <Input 
                    value={newElement.clin || ''}
                    onChange={(e) => setNewElement(prev => ({ ...prev, clin: e.target.value }))}
                    placeholder="e.g., 0001"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Why (Purpose)</Label>
                <Textarea 
                  value={newElement.why || ''}
                  onChange={(e) => setNewElement(prev => ({ ...prev, why: e.target.value }))}
                  rows={2}
                  placeholder="Why is this work necessary?"
                />
              </div>
              
              <div className="space-y-2">
                <Label>What (Deliverables)</Label>
                <Textarea 
                  value={newElement.what || ''}
                  onChange={(e) => setNewElement(prev => ({ ...prev, what: e.target.value }))}
                  rows={2}
                  placeholder="What will be delivered?"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estimate Method</Label>
                  <Select 
                    value={newElement.estimateMethod || 'engineering'}
                    onValueChange={(v) => setNewElement(prev => ({ ...prev, estimateMethod: v as EstimateMethod }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ESTIMATE_METHOD_LABELS).map(([key, { label, icon }]) => (
                        <SelectItem key={key} value={key}>{icon} {label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Complexity Factor</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="3.0"
                    value={newElement.complexityFactor || 1.0}
                    onChange={(e) => setNewElement(prev => ({ ...prev, complexityFactor: parseFloat(e.target.value) || 1.0 }))}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddElement(false)}>Cancel</Button>
              <Button 
                onClick={handleAddElement}
                disabled={!newElement.wbsNumber || !newElement.title}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Element
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Labor Dialog */}
        <Dialog open={showLaborDialog} onOpenChange={setShowLaborDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingLabor ? 'Edit' : 'Add'} Labor Estimate</DialogTitle>
              <DialogDescription>
                {editingLabor ? 'Update the hours and rationale for this role' : 'Add a role with hours for each contract period'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Role <span className="text-red-500">*</span></Label>
                <Select 
                  value={laborForm.roleId}
                  onValueChange={(v) => setLaborForm(prev => ({ ...prev, roleId: v }))}
                  disabled={!!editingLabor}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedRoles.map(role => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Hours by Period</Label>
                <div className="grid grid-cols-5 gap-2">
                  {contractPeriods.map(period => (
                    <div key={period.key}>
                      <Label className="text-xs text-gray-500">{period.label}</Label>
                      <Input 
                        type="number"
                        min="0"
                        value={laborForm.hoursByPeriod[period.key] || ''}
                        onChange={(e) => setLaborForm(prev => ({
                          ...prev,
                          hoursByPeriod: { ...prev.hoursByPeriod, [period.key]: parseInt(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 text-right">
                  Total: {Object.values(laborForm.hoursByPeriod).reduce((a, b) => a + b, 0).toLocaleString()} hrs
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Confidence Level</Label>
                <Select 
                  value={laborForm.confidence}
                  onValueChange={(v) => setLaborForm(prev => ({ ...prev, confidence: v as typeof laborForm.confidence }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High - Strong basis for estimate</SelectItem>
                    <SelectItem value="medium">Medium - Reasonable basis</SelectItem>
                    <SelectItem value="low">Low - Limited basis, needs review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Rationale</Label>
                <Textarea 
                  value={laborForm.rationale}
                  onChange={(e) => setLaborForm(prev => ({ ...prev, rationale: e.target.value }))}
                  rows={3}
                  placeholder="Explain how you determined these hours. This helps auditors understand your estimate."
                />
                <p className="text-xs text-gray-500">
                  Include the basis of your estimate: historical data, parametric calculations, or engineering judgment.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLaborDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveLabor} disabled={!laborForm.roleId}>
                {editingLabor ? 'Save Changes' : 'Add Labor'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Risk Dialog */}
        <Dialog open={showRiskDialog} onOpenChange={setShowRiskDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRisk ? 'Edit' : 'Add'} Risk</DialogTitle>
              <DialogDescription>
                {editingRisk ? 'Update this risk assessment' : 'Identify a potential risk and mitigation strategy'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Risk Description <span className="text-red-500">*</span></Label>
                <Textarea 
                  value={riskForm.description}
                  onChange={(e) => setRiskForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  placeholder="Describe the risk and its potential impact on the project..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Probability</Label>
                  <Select 
                    value={String(riskForm.probability)}
                    onValueChange={(v) => setRiskForm(prev => ({ ...prev, probability: parseInt(v) as typeof riskForm.probability }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} - {PROBABILITY_LABELS[n]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Impact</Label>
                  <Select 
                    value={String(riskForm.impact)}
                    onValueChange={(v) => setRiskForm(prev => ({ ...prev, impact: parseInt(v) as typeof riskForm.impact }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} - {IMPACT_LABELS[n]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-center">
                Risk Score: <span className="font-bold text-lg">{riskForm.probability * riskForm.impact}</span>
                <span className="text-gray-500 ml-2">(Probability × Impact)</span>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={riskForm.status}
                  onValueChange={(v) => setRiskForm(prev => ({ ...prev, status: v as typeof riskForm.status }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open - Needs attention</SelectItem>
                    <SelectItem value="mitigated">Mitigated - Controls in place</SelectItem>
                    <SelectItem value="accepted">Accepted - Risk acknowledged</SelectItem>
                    <SelectItem value="closed">Closed - No longer applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Mitigation Strategy</Label>
                <Textarea 
                  value={riskForm.mitigation}
                  onChange={(e) => setRiskForm(prev => ({ ...prev, mitigation: e.target.value }))}
                  rows={2}
                  placeholder="Describe how you will prevent or reduce this risk..."
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRiskDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveRisk} disabled={!riskForm.description}>
                {editingRisk ? 'Save Changes' : 'Add Risk'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Dependency Dialog */}
        <Dialog open={showDependencyDialog} onOpenChange={setShowDependencyDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingDependency ? 'Edit' : 'Add'} Dependency</DialogTitle>
              <DialogDescription>
                {editingDependency ? 'Update this dependency relationship' : 'Link this element to a predecessor'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Predecessor WBS <span className="text-red-500">*</span></Label>
                <Select 
                  value={dependencyForm.predecessorWbsId}
                  onValueChange={(v) => setDependencyForm(prev => ({ ...prev, predecessorWbsId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select predecessor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {wbsElements
                      .filter(el => el.id !== selectedElement?.id)
                      .map(el => (
                        <SelectItem key={el.id} value={el.id}>
                          {el.wbsNumber} - {el.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Dependency Type</Label>
                <Select 
                  value={dependencyForm.type}
                  onValueChange={(v) => setDependencyForm(prev => ({ ...prev, type: v as typeof dependencyForm.type }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DEPENDENCY_TYPE_LABELS).map(([key, { label, description }]) => (
                      <SelectItem key={key} value={key}>
                        {label} - {description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Lag Days</Label>
                <Input 
                  type="number"
                  min="0"
                  value={dependencyForm.lagDays}
                  onChange={(e) => setDependencyForm(prev => ({ ...prev, lagDays: parseInt(e.target.value) || 0 }))}
                />
                <p className="text-xs text-gray-500">Optional delay between predecessor and successor</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDependencyDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveDependency} disabled={!dependencyForm.predecessorWbsId}>
                {editingDependency ? 'Save Changes' : 'Add Dependency'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Element Dialog */}
        <Dialog open={showEditElement} onOpenChange={(open) => {
          setShowEditElement(open)
          if (!open) setDirectEditElementId(null)
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit WBS Element</DialogTitle>
              <DialogDescription>
                Update the details for {editElementBuffer.wbsNumber} - {editElementBuffer.title}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>WBS Number <span className="text-red-500">*</span></Label>
                  <Input 
                    value={editElementBuffer.wbsNumber || ''}
                    onChange={(e) => setEditElementBuffer(prev => ({ ...prev, wbsNumber: e.target.value }))}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Title <span className="text-red-500">*</span></Label>
                  <Input 
                    value={editElementBuffer.title || ''}
                    onChange={(e) => setEditElementBuffer(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SOW Reference</Label>
                  <Input 
                    value={editElementBuffer.sowReference || ''}
                    onChange={(e) => setEditElementBuffer(prev => ({ ...prev, sowReference: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CLIN</Label>
                  <Input 
                    value={editElementBuffer.clin || ''}
                    onChange={(e) => setEditElementBuffer(prev => ({ ...prev, clin: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date"
                    value={editElementBuffer.periodOfPerformance?.startDate || ''}
                    onChange={(e) => setEditElementBuffer(prev => ({
                      ...prev,
                      periodOfPerformance: { ...prev.periodOfPerformance!, startDate: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input 
                    type="date"
                    value={editElementBuffer.periodOfPerformance?.endDate || ''}
                    onChange={(e) => setEditElementBuffer(prev => ({
                      ...prev,
                      periodOfPerformance: { ...prev.periodOfPerformance!, endDate: e.target.value }
                    }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Why (Purpose)</Label>
                <Textarea 
                  value={editElementBuffer.why || ''}
                  onChange={(e) => setEditElementBuffer(prev => ({ ...prev, why: e.target.value }))}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>What (Deliverables)</Label>
                <Textarea 
                  value={editElementBuffer.what || ''}
                  onChange={(e) => setEditElementBuffer(prev => ({ ...prev, what: e.target.value }))}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Not Included (Scope Exclusions)</Label>
                <Textarea 
                  value={editElementBuffer.notIncluded || ''}
                  onChange={(e) => setEditElementBuffer(prev => ({ ...prev, notIncluded: e.target.value }))}
                  rows={2}
                />
              </div>
              
              {/* Estimate Method Section */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Basis of Estimate</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Estimate Method</Label>
                    <Select 
                      value={editElementBuffer.estimateMethod || 'engineering'}
                      onValueChange={(v) => setEditElementBuffer(prev => ({ ...prev, estimateMethod: v as EstimateMethod }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ESTIMATE_METHOD_LABELS).map(([key, { label, icon, description }]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <span>{icon}</span>
                              <span>{label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {ESTIMATE_METHOD_LABELS[editElementBuffer.estimateMethod || 'engineering']?.description}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Complexity Factor</Label>
                    <Input 
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="3.0"
                      value={editElementBuffer.complexityFactor || 1.0}
                      onChange={(e) => setEditElementBuffer(prev => ({ ...prev, complexityFactor: parseFloat(e.target.value) || 1.0 }))}
                    />
                    <p className="text-xs text-gray-500">1.0 = standard, &gt;1.0 = more complex</p>
                  </div>
                </div>
                
                {editElementBuffer.complexityFactor !== 1.0 && (
                  <div className="space-y-2 mb-4">
                    <Label>Complexity Justification <span className="text-red-500">*</span></Label>
                    <Textarea 
                      value={editElementBuffer.complexityJustification || ''}
                      onChange={(e) => setEditElementBuffer(prev => ({ ...prev, complexityJustification: e.target.value }))}
                      rows={2}
                      placeholder="Explain why this task is more or less complex than typical..."
                    />
                  </div>
                )}
                
                {/* HISTORICAL METHOD - Charge Code Reference */}
                {editElementBuffer.estimateMethod === 'historical' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Hash className="w-4 h-4" />
                      <span className="font-medium">Historical Reference</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Charge Code / Project Number</Label>
                      <Input 
                        value={editElementBuffer.historicalReference?.chargeNumber || ''}
                        onChange={(e) => setEditElementBuffer(prev => ({
                          ...prev,
                          historicalReference: {
                            ...prev.historicalReference,
                            chargeCodeId: prev.historicalReference?.chargeCodeId || '',
                            chargeNumber: e.target.value,
                            projectName: prev.historicalReference?.projectName || '',
                            dateRange: prev.historicalReference?.dateRange || '',
                            actualHours: prev.historicalReference?.actualHours || 0,
                            notes: prev.historicalReference?.notes || '',
                          }
                        }))}
                        placeholder="e.g., TT-2024-0892"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Project Name</Label>
                        <Input 
                          value={editElementBuffer.historicalReference?.projectName || ''}
                          onChange={(e) => setEditElementBuffer(prev => ({
                            ...prev,
                            historicalReference: { ...prev.historicalReference!, projectName: e.target.value }
                          }))}
                          placeholder="e.g., VA Transition Support"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date Range</Label>
                        <Input 
                          value={editElementBuffer.historicalReference?.dateRange || ''}
                          onChange={(e) => setEditElementBuffer(prev => ({
                            ...prev,
                            historicalReference: { ...prev.historicalReference!, dateRange: e.target.value }
                          }))}
                          placeholder="e.g., Jan-Mar 2024"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Actual Hours from Reference</Label>
                      <Input 
                        type="number"
                        value={editElementBuffer.historicalReference?.actualHours || ''}
                        onChange={(e) => setEditElementBuffer(prev => ({
                          ...prev,
                          historicalReference: { ...prev.historicalReference!, actualHours: parseInt(e.target.value) || 0 }
                        }))}
                        placeholder="Hours from the reference project"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Relevance Notes</Label>
                      <Textarea 
                        value={editElementBuffer.historicalReference?.notes || ''}
                        onChange={(e) => setEditElementBuffer(prev => ({
                          ...prev,
                          historicalReference: { ...prev.historicalReference!, notes: e.target.value }
                        }))}
                        rows={2}
                        placeholder="Explain why this historical project is relevant and any adjustments needed..."
                      />
                    </div>
                  </div>
                )}
                
                {/* ENGINEERING METHOD - Expert Judgment Basis */}
                {editElementBuffer.estimateMethod === 'engineering' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Lightbulb className="w-4 h-4" />
                      <span className="font-medium">Engineering Judgment Basis</span>
                    </div>
                    <p className="text-xs text-amber-700">
                      Engineering estimates require strong documentation to be audit-defensible.
                    </p>
                    
                    <div className="space-y-2">
                      <Label>Similar Work Reference</Label>
                      <Textarea 
                        value={editElementBuffer.engineeringBasis?.similarWork || ''}
                        onChange={(e) => setEditElementBuffer(prev => ({
                          ...prev,
                          engineeringBasis: {
                            similarWork: e.target.value,
                            expertSource: prev.engineeringBasis?.expertSource || '',
                            assumptions: prev.engineeringBasis?.assumptions || '',
                            confidenceNotes: prev.engineeringBasis?.confidenceNotes || '',
                          }
                        }))}
                        rows={2}
                        placeholder="Describe similar work you've done that informs this estimate..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Expert Source</Label>
                      <Input 
                        value={editElementBuffer.engineeringBasis?.expertSource || ''}
                        onChange={(e) => setEditElementBuffer(prev => ({
                          ...prev,
                          engineeringBasis: { ...prev.engineeringBasis!, expertSource: e.target.value }
                        }))}
                        placeholder="e.g., Technical Lead with 10+ years in similar systems"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Key Assumptions</Label>
                      <Textarea 
                        value={editElementBuffer.engineeringBasis?.assumptions || ''}
                        onChange={(e) => setEditElementBuffer(prev => ({
                          ...prev,
                          engineeringBasis: { ...prev.engineeringBasis!, assumptions: e.target.value }
                        }))}
                        rows={2}
                        placeholder="List the assumptions underlying this estimate..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Confidence Notes</Label>
                      <Textarea 
                        value={editElementBuffer.engineeringBasis?.confidenceNotes || ''}
                        onChange={(e) => setEditElementBuffer(prev => ({
                          ...prev,
                          engineeringBasis: { ...prev.engineeringBasis!, confidenceNotes: e.target.value }
                        }))}
                        rows={2}
                        placeholder="What could make this estimate higher or lower? What are the unknowns?"
                      />
                    </div>
                  </div>
                )}
                
                {/* PARAMETRIC METHOD */}
                {editElementBuffer.estimateMethod === 'parametric' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-green-800">
                      <BarChart3 className="w-4 h-4" />
                      <span className="font-medium">Parametric Calculation</span>
                    </div>
                    <p className="text-xs text-green-700">
                      Document the formula: Base Rate × Quantity × Complexity Factor
                    </p>
                    
                    <div className="space-y-2">
                      <Label>Calculation Basis</Label>
                      <Textarea 
                        value={editElementBuffer.engineeringBasis?.similarWork || ''}
                        onChange={(e) => setEditElementBuffer(prev => ({
                          ...prev,
                          engineeringBasis: {
                            ...prev.engineeringBasis,
                            similarWork: e.target.value,
                            expertSource: prev.engineeringBasis?.expertSource || '',
                            assumptions: prev.engineeringBasis?.assumptions || '',
                            confidenceNotes: prev.engineeringBasis?.confidenceNotes || '',
                          }
                        }))}
                        rows={3}
                        placeholder="e.g., 10 screens × 80 hours per screen = 800 base hours. Source: FFTC productivity data"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Data Source</Label>
                      <Input 
                        value={editElementBuffer.engineeringBasis?.expertSource || ''}
                        onChange={(e) => setEditElementBuffer(prev => ({
                          ...prev,
                          engineeringBasis: { ...prev.engineeringBasis!, expertSource: e.target.value }
                        }))}
                        placeholder="e.g., FFTC-PROD-2024 productivity metrics"
                      />
                    </div>
                  </div>
                )}
                
                {/* FIRM QUOTE METHOD */}
                {editElementBuffer.estimateMethod === 'firm-quote' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-purple-800">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">Firm Quote Details</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Vendor / Subcontractor</Label>
                      <Input 
                        value={editElementBuffer.engineeringBasis?.expertSource || ''}
                        onChange={(e) => setEditElementBuffer(prev => ({
                          ...prev,
                          engineeringBasis: {
                            ...prev.engineeringBasis,
                            expertSource: e.target.value,
                            similarWork: prev.engineeringBasis?.similarWork || '',
                            assumptions: prev.engineeringBasis?.assumptions || '',
                            confidenceNotes: prev.engineeringBasis?.confidenceNotes || '',
                          }
                        }))}
                        placeholder="Company name providing the quote"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quote Reference / Date</Label>
                      <Input 
                        value={editElementBuffer.engineeringBasis?.assumptions || ''}
                        onChange={(e) => setEditElementBuffer(prev => ({
                          ...prev,
                          engineeringBasis: { ...prev.engineeringBasis!, assumptions: e.target.value }
                        }))}
                        placeholder="e.g., Quote #12345, dated 2024-11-15"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quote Details</Label>
                      <Textarea 
                        value={editElementBuffer.engineeringBasis?.similarWork || ''}
                        onChange={(e) => setEditElementBuffer(prev => ({
                          ...prev,
                          engineeringBasis: { ...prev.engineeringBasis!, similarWork: e.target.value }
                        }))}
                        rows={2}
                        placeholder="Scope covered by the quote, any exclusions..."
                      />
                    </div>
                  </div>
                )}
                
                {/* LEVEL OF EFFORT METHOD */}
                {editElementBuffer.estimateMethod === 'level-of-effort' && (
                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-gray-800">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Level of Effort Basis</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      LOE is for ongoing support without specific deliverables. Document the staffing rationale.
                    </p>
                    
                    <div className="space-y-2">
                      <Label>Staffing Rationale</Label>
                      <Textarea 
                        value={editElementBuffer.engineeringBasis?.similarWork || ''}
                        onChange={(e) => setEditElementBuffer(prev => ({
                          ...prev,
                          engineeringBasis: {
                            ...prev.engineeringBasis,
                            similarWork: e.target.value,
                            expertSource: prev.engineeringBasis?.expertSource || '',
                            assumptions: prev.engineeringBasis?.assumptions || '',
                            confidenceNotes: prev.engineeringBasis?.confidenceNotes || '',
                          }
                        }))}
                        rows={3}
                        placeholder="e.g., 1 FTE Program Manager required for continuous stakeholder coordination per contract requirement"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Contract Basis</Label>
                      <Input 
                        value={editElementBuffer.engineeringBasis?.expertSource || ''}
                        onChange={(e) => setEditElementBuffer(prev => ({
                          ...prev,
                          engineeringBasis: { ...prev.engineeringBasis!, expertSource: e.target.value }
                        }))}
                        placeholder="e.g., SOO Section 4.1 requires dedicated PM"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditElement(false)}>Cancel</Button>
              <Button onClick={handleSaveEditElement}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}