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
  referenceNumber: string      // e.g., "SOO 3.1.1", "PWS 4.2.3"
  title: string
  description: string
  type: RequirementType        // Requirement strength (shall = mandatory)
  category: RequirementCategory
  priority: 'critical' | 'high' | 'medium' | 'low'
  source: string               // Document section or page reference
  linkedWbsIds: string[]       // Which WBS elements address this requirement
  notes: string
  isAIExtracted: boolean       // Was this extracted by AI from RFP?
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
    similarWork: string        // Description of similar work this is based on
    expertSource: string       // Who provided the estimate (SME name/role)
    assumptions: string        // Key assumptions driving the estimate
    confidenceNotes: string    // Why we have confidence in this estimate
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

interface SelectedRole {
  id: string
  name: string
  category: string
  baseRate: number
}

interface Solicitation {
  title: string
  periodOfPerformance: {
    baseYear: boolean
    optionYears: number
    startDate?: string
  }
}

interface Settings {
  uiBillableHours: number
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
    linkedWbsIds: [], // Will be linked to WBS 1.1
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
    linkedWbsIds: [], // Will be linked to WBS 1.2
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
    linkedWbsIds: [], // Will be linked to WBS 1.3
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
    linkedWbsIds: [], // Should be linked to 1.2 and 1.3
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
    // Check if they've provided supporting data
    const basis = element.engineeringBasis
    const hasGoodBasis = basis && (
      (basis.similarWork && basis.similarWork.length > 20) ||
      (basis.expertSource && basis.assumptions && basis.assumptions.length > 20)
    )
    
    if (hasGoodBasis) {
      // Reduced penalty if they documented their basis
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
// MOCK DATA GENERATOR
// ============================================================================

function generateMockWBSElements(
  selectedRoles: SelectedRole[],
  solicitation: Solicitation
): EnhancedWBSElement[] {
  if (selectedRoles.length === 0) return []
  
  const mockElements: EnhancedWBSElement[] = [
    {
      id: generateId(),
      wbsNumber: '1.1',
      title: 'Transition-In Planning & Knowledge Transfer',
      sowReference: 'SOO 3.1.1',
      clin: '0001',
      periodOfPerformance: {
        startDate: '2025-01-01',
        endDate: '2025-02-28',
      },
      why: 'Establish a seamless transition from the incumbent contractor to minimize disruption to ongoing operations and ensure continuity of service.',
      what: 'Conduct knowledge transfer sessions, review existing documentation, establish development environments, and complete security onboarding.',
      notIncluded: 'Incumbent contractor responsibilities, hardware procurement, facility access beyond standard clearance processes.',
      assumptions: [
        'Incumbent will provide 40 hours of knowledge transfer support',
        'All team members will have clearances adjudicated within 30 days',
        'Development environments will be provisioned within 2 weeks',
      ],
      estimateMethod: 'historical',
      historicalReference: {
        chargeCodeId: 'cc-1',
        chargeNumber: 'TT-2024-0892',
        projectName: 'VA Transition Support',
        dateRange: 'Jan-Mar 2024',
        actualHours: 1200,
        notes: 'Similar complexity, same clearance requirements',
      },
      complexityFactor: 1.0,
      complexityJustification: '',
      laborEstimates: selectedRoles.slice(0, 4).map((role, idx) => ({
        id: generateId(),
        roleId: role.id,
        roleName: role.name,
        hoursByPeriod: {
          base: idx === 0 ? 200 : 120,
          option1: 0,
          option2: 0,
          option3: 0,
          option4: 0,
        },
        rationale: `Transition activities require ${role.name} involvement for ${idx === 0 ? 'leading coordination' : 'technical handoff'} over the 60-day transition period.`,
        confidence: 'high',
        isAISuggested: true,
        isOrphaned: false,
      })),
      risks: [
        {
          id: generateId(),
          description: 'Incumbent knowledge transfer may be incomplete or delayed',
          probability: 3,
          impact: 4,
          mitigation: 'Schedule redundant sessions, document all verbal knowledge transfer',
          status: 'open',
        },
      ],
      dependencies: [],
      qualityGrade: 'blue',
      qualityScore: 95,
      qualityIssues: [],
      isAIGenerated: true,
      aiConfidence: 0.92,
    },
    {
      id: generateId(),
      wbsNumber: '1.2',
      title: 'Public Booking System Development',
      sowReference: 'SOO 3.2.1',
      clin: '0001',
      periodOfPerformance: {
        startDate: '2025-03-01',
        endDate: '2025-12-31',
      },
      why: 'Enable public users to schedule appointments in under 5 minutes, improving customer satisfaction and reducing call center volume.',
      what: 'Design and develop a responsive booking interface with multi-language support, calendar integration, and real-time availability.',
      notIncluded: 'Third-party payment processing, SMS notifications (separate epic), backend calendar infrastructure.',
      assumptions: [
        'Design system (USWDS) components are available',
        '10 primary screens identified in discovery',
        'API contracts defined by backend team',
      ],
      estimateMethod: 'parametric',
      complexityFactor: 1.2,
      complexityJustification: 'Multi-language support and accessibility requirements add 20% overhead.',
      laborEstimates: selectedRoles.map((role, idx) => ({
        id: generateId(),
        roleId: role.id,
        roleName: role.name,
        hoursByPeriod: {
          base: Math.round(400 + Math.random() * 200),
          option1: Math.round(100 + Math.random() * 100),
          option2: Math.round(50 + Math.random() * 50),
          option3: 0,
          option4: 0,
        },
        rationale: `Based on 10 screens × 80 hours average per screen for ${role.name}, adjusted for multi-language complexity.`,
        confidence: idx < 3 ? 'high' : 'medium',
        isAISuggested: true,
        isOrphaned: false,
      })),
      risks: [
        {
          id: generateId(),
          description: 'Section 508 compliance may require significant rework',
          probability: 2,
          impact: 3,
          mitigation: 'Build accessibility into design from day one, conduct regular audits',
          status: 'open',
        },
        {
          id: generateId(),
          description: 'Multi-language support scope may expand beyond initial languages',
          probability: 4,
          impact: 2,
          mitigation: 'Design with i18n framework from start, modular translation files',
          status: 'mitigated',
        },
      ],
      dependencies: [
        {
          id: generateId(),
          predecessorWbsId: '',
          predecessorWbsNumber: '1.1',
          type: 'FS',
          lagDays: 0,
        },
      ],
      qualityGrade: 'green',
      qualityScore: 82,
      qualityIssues: [],
      isAIGenerated: true,
      aiConfidence: 0.88,
    },
    {
      id: generateId(),
      wbsNumber: '1.3',
      title: 'Admin Portal & Capacity Management',
      sowReference: 'SOO 3.2.2',
      clin: '0001',
      periodOfPerformance: {
        startDate: '2025-04-01',
        endDate: '2025-12-31',
      },
      why: 'Consular staff need to efficiently manage appointment slots, view metrics, and handle scheduling conflicts.',
      what: 'Build admin dashboard with calendar views, bulk slot management, reporting dashboards, and user management.',
      notIncluded: 'Mobile admin app, offline functionality, integration with HR systems.',
      assumptions: [
        'Role-based access control requirements are defined',
        'Maximum 50 concurrent admin users per post',
        'Report requirements will be finalized in sprint 3',
      ],
      estimateMethod: 'engineering',
      complexityFactor: 1.0,
      complexityJustification: '',
      laborEstimates: selectedRoles.slice(0, 5).map((role, idx) => ({
        id: generateId(),
        roleId: role.id,
        roleName: role.name,
        hoursByPeriod: {
          base: Math.round(300 + Math.random() * 150),
          option1: Math.round(80 + Math.random() * 80),
          option2: Math.round(40 + Math.random() * 40),
          option3: 0,
          option4: 0,
        },
        rationale: `Admin portal complexity for ${role.name} based on similar CRM dashboard implementations.`,
        confidence: 'medium',
        isAISuggested: true,
        isOrphaned: false,
      })),
      risks: [
        {
          id: generateId(),
          description: 'Report requirements may change significantly after initial delivery',
          probability: 4,
          impact: 3,
          mitigation: 'Build flexible reporting framework, plan for iteration in option years',
          status: 'open',
        },
      ],
      dependencies: [
        {
          id: generateId(),
          predecessorWbsId: '',
          predecessorWbsNumber: '1.2',
          type: 'SS',
          lagDays: 30,
        },
      ],
      qualityGrade: 'yellow',
      qualityScore: 65,
      qualityIssues: [
        'Engineering judgment needs supporting data',
      ],
      isAIGenerated: true,
      aiConfidence: 0.75,
    },
    // Additional WBS elements for demonstrating matrix pagination
    {
      id: generateId(),
      wbsNumber: '2.1',
      title: 'Section 508 Compliance & Accessibility',
      sowReference: 'SOO 3.3.1',
      clin: '0001',
      periodOfPerformance: { startDate: '2025-03-01', endDate: '2025-12-31' },
      why: 'Federal mandate requires all public-facing systems to meet Section 508 accessibility standards.',
      what: 'Implement WCAG 2.1 AA compliance across all interfaces, conduct accessibility audits, remediate findings.',
      notIncluded: 'Third-party widget accessibility, PDF remediation for legacy documents.',
      assumptions: ['Design system includes accessible components', 'Testing will include screen reader validation'],
      estimateMethod: 'engineering',
      complexityFactor: 1.15,
      complexityJustification: 'Accessibility testing adds overhead to all development activities.',
      laborEstimates: selectedRoles.slice(0, 3).map((role) => ({
        id: generateId(),
        roleId: role.id,
        roleName: role.name,
        hoursByPeriod: { base: 160, option1: 40, option2: 20, option3: 0, option4: 0 },
        rationale: 'Accessibility review and remediation effort.',
        confidence: 'medium' as const,
        isAISuggested: true,
        isOrphaned: false,
      })),
      risks: [],
      dependencies: [],
      qualityGrade: 'yellow' as const,
      qualityScore: 70,
      qualityIssues: [],
      isAIGenerated: true,
      aiConfidence: 0.8,
    },
    {
      id: generateId(),
      wbsNumber: '2.2',
      title: 'FedRAMP Authorization Support',
      sowReference: 'SOO 3.3.2',
      clin: '0001',
      periodOfPerformance: { startDate: '2025-02-01', endDate: '2025-09-30' },
      why: 'Cloud infrastructure must achieve FedRAMP Moderate authorization for government data.',
      what: 'Document security controls, support SSP development, coordinate with 3PAO assessor.',
      notIncluded: '3PAO assessment fees, ATO package approval timeline.',
      assumptions: ['Existing cloud infrastructure is FedRAMP-ready', 'Security team provides control implementations'],
      estimateMethod: 'historical',
      complexityFactor: 1.0,
      complexityJustification: '',
      laborEstimates: selectedRoles.slice(0, 2).map((role) => ({
        id: generateId(),
        roleId: role.id,
        roleName: role.name,
        hoursByPeriod: { base: 240, option1: 80, option2: 40, option3: 0, option4: 0 },
        rationale: 'Security documentation and assessment support.',
        confidence: 'high' as const,
        isAISuggested: true,
        isOrphaned: false,
      })),
      risks: [],
      dependencies: [],
      qualityGrade: 'green' as const,
      qualityScore: 85,
      qualityIssues: [],
      isAIGenerated: true,
      aiConfidence: 0.88,
    },
    {
      id: generateId(),
      wbsNumber: '2.3',
      title: 'Multi-Language Support Implementation',
      sowReference: 'SOO 3.4.1',
      clin: '0001',
      periodOfPerformance: { startDate: '2025-05-01', endDate: '2025-11-30' },
      why: 'Support non-English speakers accessing consular services globally.',
      what: 'Implement i18n framework, integrate translation management, support RTL languages.',
      notIncluded: 'Translation services, content localization beyond UI strings.',
      assumptions: ['Initial launch supports 5 languages', 'Translation memory system available'],
      estimateMethod: 'parametric',
      complexityFactor: 1.3,
      complexityJustification: 'RTL language support adds significant complexity.',
      laborEstimates: selectedRoles.slice(0, 4).map((role) => ({
        id: generateId(),
        roleId: role.id,
        roleName: role.name,
        hoursByPeriod: { base: 200, option1: 60, option2: 30, option3: 0, option4: 0 },
        rationale: 'Internationalization implementation effort.',
        confidence: 'medium' as const,
        isAISuggested: true,
        isOrphaned: false,
      })),
      risks: [],
      dependencies: [],
      qualityGrade: 'yellow' as const,
      qualityScore: 72,
      qualityIssues: [],
      isAIGenerated: true,
      aiConfidence: 0.78,
    },
    {
      id: generateId(),
      wbsNumber: '3.1',
      title: 'System Monitoring & Availability',
      sowReference: 'SOO 3.5.1',
      clin: '0002',
      periodOfPerformance: { startDate: '2025-06-01', endDate: '2026-03-31' },
      why: 'Ensure 99.9% uptime SLA compliance for mission-critical appointment system.',
      what: 'Implement monitoring dashboards, alerting, automated failover, and incident response procedures.',
      notIncluded: 'Infrastructure costs, on-call staffing beyond standard hours.',
      assumptions: ['Cloud provider offers 99.99% infrastructure SLA', 'Monitoring tools already licensed'],
      estimateMethod: 'engineering',
      complexityFactor: 1.1,
      complexityJustification: 'High availability requirements add complexity.',
      laborEstimates: selectedRoles.slice(0, 3).map((role) => ({
        id: generateId(),
        roleId: role.id,
        roleName: role.name,
        hoursByPeriod: { base: 120, option1: 80, option2: 80, option3: 40, option4: 40 },
        rationale: 'Ongoing monitoring and reliability engineering.',
        confidence: 'high' as const,
        isAISuggested: true,
        isOrphaned: false,
      })),
      risks: [],
      dependencies: [],
      qualityGrade: 'green' as const,
      qualityScore: 82,
      qualityIssues: [],
      isAIGenerated: true,
      aiConfidence: 0.85,
    },
    {
      id: generateId(),
      wbsNumber: '3.2',
      title: 'Monthly Status Reporting',
      sowReference: 'SOO 3.6.1',
      clin: '0002',
      periodOfPerformance: { startDate: '2025-01-01', endDate: '2026-12-31' },
      why: 'Contract requires monthly progress reports to COR and program office.',
      what: 'Prepare monthly status reports, metrics dashboards, risk registers, and financial summaries.',
      notIncluded: 'Ad-hoc reporting requests, congressional testimony support.',
      assumptions: ['Report template provided by government', 'Data available from project tools'],
      estimateMethod: 'engineering',
      complexityFactor: 1.0,
      complexityJustification: '',
      laborEstimates: selectedRoles.slice(0, 2).map((role) => ({
        id: generateId(),
        roleId: role.id,
        roleName: role.name,
        hoursByPeriod: { base: 48, option1: 48, option2: 48, option3: 48, option4: 48 },
        rationale: '4 hours per month for report preparation.',
        confidence: 'high' as const,
        isAISuggested: true,
        isOrphaned: false,
      })),
      risks: [],
      dependencies: [],
      qualityGrade: 'blue' as const,
      qualityScore: 90,
      qualityIssues: [],
      isAIGenerated: true,
      aiConfidence: 0.92,
    },
    {
      id: generateId(),
      wbsNumber: '3.3',
      title: 'Agile Process Implementation',
      sowReference: 'SOO 4.1.1',
      clin: '0001',
      periodOfPerformance: { startDate: '2025-01-01', endDate: '2025-06-30' },
      why: 'Government requires agile methodology with sprint demos and iterative delivery.',
      what: 'Establish sprint cadence, backlog management, demo schedule, and retrospective process.',
      notIncluded: 'Agile coaching for government stakeholders, tool licensing.',
      assumptions: ['2-week sprint cadence', 'Product Owner available for backlog grooming'],
      estimateMethod: 'engineering',
      complexityFactor: 1.0,
      complexityJustification: '',
      laborEstimates: selectedRoles.slice(0, 2).map((role) => ({
        id: generateId(),
        roleId: role.id,
        roleName: role.name,
        hoursByPeriod: { base: 80, option1: 20, option2: 20, option3: 20, option4: 20 },
        rationale: 'Agile ceremony facilitation and process management.',
        confidence: 'high' as const,
        isAISuggested: true,
        isOrphaned: false,
      })),
      risks: [],
      dependencies: [],
      qualityGrade: 'green' as const,
      qualityScore: 88,
      qualityIssues: [],
      isAIGenerated: true,
      aiConfidence: 0.9,
    },
    {
      id: generateId(),
      wbsNumber: '4.1',
      title: 'Legacy System Integration',
      sowReference: 'SOO 4.2.1',
      clin: '0001',
      periodOfPerformance: { startDate: '2025-07-01', endDate: '2025-12-31' },
      why: 'New system must integrate with existing consular management systems.',
      what: 'Develop API integrations, data migration scripts, and synchronization processes.',
      notIncluded: 'Legacy system modifications, data cleansing of historical records.',
      assumptions: ['API documentation available', 'Test environment access provided'],
      estimateMethod: 'parametric',
      complexityFactor: 1.4,
      complexityJustification: 'Legacy integration complexity and undocumented behaviors.',
      laborEstimates: selectedRoles.slice(0, 4).map((role) => ({
        id: generateId(),
        roleId: role.id,
        roleName: role.name,
        hoursByPeriod: { base: 280, option1: 80, option2: 40, option3: 0, option4: 0 },
        rationale: 'Integration development and testing.',
        confidence: 'low' as const,
        isAISuggested: true,
        isOrphaned: false,
      })),
      risks: [
        {
          id: generateId(),
          description: 'Legacy system APIs may be poorly documented or unstable',
          probability: 4,
          impact: 4,
          mitigation: 'Plan for discovery phase and build defensive integration patterns',
          status: 'open',
        },
      ],
      dependencies: [],
      qualityGrade: 'yellow' as const,
      qualityScore: 68,
      qualityIssues: ['Low confidence estimate needs validation'],
      isAIGenerated: true,
      aiConfidence: 0.65,
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
// SIDEBAR COMPONENT (DEPRECATED - replaced with horizontal tabs)
// ============================================================================
// NOTE: This component is no longer used. The Estimate tab now uses horizontal
// tabs at the top, matching the Roles & Pricing tab layout pattern.
// Keeping for reference in case we need to revert.

interface SidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
  wbsElements: EnhancedWBSElement[]
  requirements: SOORequirement[]
  stats: {
    totalHours: number
    avgQuality: number
    totalRisks: number
    issueCount: number
    requirementsCoverage: number  // percentage of requirements linked to WBS
    unmappedRequirements: number  // count of requirements with no WBS
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Sidebar({ activeSection, setActiveSection, wbsElements, requirements, stats }: SidebarProps) {
  const sections = [
    { id: 'requirements', label: 'Requirements', icon: ClipboardCheck, color: 'text-indigo-600', count: requirements.length, badge: stats.unmappedRequirements > 0 ? `${stats.unmappedRequirements} gaps` : null },
    { id: 'wbs', label: 'WBS Elements', icon: Layers, color: 'text-purple-600', count: wbsElements.length },
    { id: 'charges', label: 'Charge Codes', icon: Hash, color: 'text-blue-600', count: MOCK_CHARGE_CODES.length },
    { id: 'export', label: 'Export', icon: Download, color: 'text-gray-600', count: 0 },
  ]
  
  return (
    <div className="w-56 flex-shrink-0">
      <div className="sticky top-6">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Estimate</h2>
          <p className="text-xs text-gray-600">WBS & Basis of Estimate</p>
        </div>
        
        {/* Navigation */}
        <nav className="space-y-1 mb-6">
          {sections.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-lg 
                text-sm font-medium transition-colors
                ${activeSection === item.id 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <item.icon className={`w-4 h-4 ${activeSection === item.id ? item.color : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.count > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                  {item.count}
                </Badge>
              )}
              {'badge' in item && item.badge && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </nav>
        
        {/* Summary Stats */}
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Total Hours</span>
            <span className="font-semibold text-gray-900">{stats.totalHours.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Avg Quality</span>
            <span className="font-semibold text-gray-900">{stats.avgQuality}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Req Coverage</span>
            <span className={`font-semibold ${stats.requirementsCoverage === 100 ? 'text-green-600' : 'text-yellow-600'}`}>
              {stats.requirementsCoverage}%
            </span>
          </div>
          {stats.issueCount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-yellow-600">Issues</span>
              <span className="font-semibold text-yellow-600">{stats.issueCount}</span>
            </div>
          )}
        </div>
      </div>
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
  onDelete: () => void
  contractPeriods: { key: PeriodKey; label: string }[]
}

function WBSCard({ element, onClick, onDelete, contractPeriods }: WBSCardProps) {
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
  onDelete: () => void
}

function WBSListItem({ element, onClick, onDelete }: WBSListItemProps) {
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
      <div className="w-8 flex-shrink-0">
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
  onDelete: (id: string) => void
  contractPeriods: { key: PeriodKey; label: string }[]
}

function WBSTableView({ elements, onElementClick, onDelete, contractPeriods }: WBSTableViewProps) {
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
            <th className="w-10"></th>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onDelete(element.id); }}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 
                               opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
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
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBuffer, setEditBuffer] = useState<Partial<ChargeCode>>({})
  
  // New charge code form state
  const [newChargeCode, setNewChargeCode] = useState<Partial<ChargeCode>>({
    chargeNumber: '',
    projectName: '',
    client: '',
    dateRange: '',
    totalHours: 0,
    description: '',
    roles: [],
  })
  const [newRoleInput, setNewRoleInput] = useState('')
  const [editRoleInput, setEditRoleInput] = useState('')
  
  const filteredCodes = chargeCodes.filter(cc => 
    cc.chargeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cc.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cc.client.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const handleAddChargeCode = () => {
    if (!newChargeCode.chargeNumber || !newChargeCode.projectName) return
    
    const chargeCode: ChargeCode = {
      id: generateId(),
      chargeNumber: newChargeCode.chargeNumber!,
      projectName: newChargeCode.projectName!,
      client: newChargeCode.client || '',
      dateRange: newChargeCode.dateRange || '',
      totalHours: newChargeCode.totalHours || 0,
      description: newChargeCode.description || '',
      roles: newChargeCode.roles || [],
    }
    
    onAdd(chargeCode)
    setShowAddDialog(false)
    setNewChargeCode({
      chargeNumber: '',
      projectName: '',
      client: '',
      dateRange: '',
      totalHours: 0,
      description: '',
      roles: [],
    })
    setNewRoleInput('')
  }
  
  const handleStartEditing = (cc: ChargeCode) => {
    setEditBuffer({ ...cc, roles: [...cc.roles] })
    setEditingId(cc.id)
  }
  
  const handleSaveEdit = () => {
    if (!editingId || !editBuffer) return
    onUpdate(editingId, editBuffer)
    setEditingId(null)
    setEditBuffer({})
    setEditRoleInput('')
  }
  
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditBuffer({})
    setEditRoleInput('')
  }
  
  const handleAddNewRole = () => {
    if (!newRoleInput.trim()) return
    setNewChargeCode(prev => ({
      ...prev,
      roles: [...(prev.roles || []), newRoleInput.trim()]
    }))
    setNewRoleInput('')
  }
  
  const handleRemoveNewRole = (role: string) => {
    setNewChargeCode(prev => ({
      ...prev,
      roles: (prev.roles || []).filter(r => r !== role)
    }))
  }
  
  const handleAddEditRole = () => {
    if (!editRoleInput.trim()) return
    setEditBuffer(prev => ({
      ...prev,
      roles: [...(prev.roles || []), editRoleInput.trim()]
    }))
    setEditRoleInput('')
  }
  
  const handleRemoveEditRole = (role: string) => {
    setEditBuffer(prev => ({
      ...prev,
      roles: (prev.roles || []).filter(r => r !== role)
    }))
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Charge Code Library</h2>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
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
            className={`group bg-white border border-gray-100 rounded-lg p-4 ${onSelect ? 'hover:border-blue-400 hover:shadow-sm cursor-pointer' : ''} transition-all`}
            onClick={() => onSelect?.(cc)}
          >
            {editingId === cc.id ? (
              // EDIT MODE
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Charge Number *</Label>
                    <Input 
                      value={editBuffer.chargeNumber || ''}
                      onChange={(e) => setEditBuffer(prev => ({ ...prev, chargeNumber: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Total Hours</Label>
                    <Input 
                      type="number"
                      value={editBuffer.totalHours || 0}
                      onChange={(e) => setEditBuffer(prev => ({ ...prev, totalHours: parseInt(e.target.value) || 0 }))}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Project Name *</Label>
                  <Input 
                    value={editBuffer.projectName || ''}
                    onChange={(e) => setEditBuffer(prev => ({ ...prev, projectName: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Client</Label>
                    <Input 
                      value={editBuffer.client || ''}
                      onChange={(e) => setEditBuffer(prev => ({ ...prev, client: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Date Range</Label>
                    <Input 
                      value={editBuffer.dateRange || ''}
                      onChange={(e) => setEditBuffer(prev => ({ ...prev, dateRange: e.target.value }))}
                      className="h-8 text-sm"
                      placeholder="e.g., Jan 2024 - Mar 2024"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Textarea 
                    value={editBuffer.description || ''}
                    onChange={(e) => setEditBuffer(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Roles</Label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(editBuffer.roles || []).map(role => (
                      <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 pr-1">
                        {role}
                        <button 
                          onClick={() => handleRemoveEditRole(role)}
                          className="ml-1 text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={editRoleInput}
                      onChange={(e) => setEditRoleInput(e.target.value)}
                      placeholder="Add role..."
                      className="h-8 text-sm flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEditRole())}
                    />
                    <Button size="sm" variant="outline" onClick={handleAddEditRole} className="h-8">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              // VIEW MODE
              <>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="w-4 h-4 text-blue-600" />
                      <span className="font-mono text-sm font-semibold text-gray-900">{cc.chargeNumber}</span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900">{cc.projectName}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px]">{cc.totalHours.toLocaleString()} hrs</Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); handleStartEditing(cc); }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); onDelete(cc.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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
              </>
            )}
          </div>
        ))}
      </div>
      
      {filteredCodes.length === 0 && !showAddDialog && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Hash className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-2">
            {chargeCodes.length === 0 ? 'No charge codes yet' : 'No charge codes match your search'}
          </p>
          {chargeCodes.length === 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Charge Code
            </Button>
          )}
        </div>
      )}
      
      {/* Add Charge Code Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Charge Code</DialogTitle>
            <DialogDescription>
              Add a historical project reference for use in estimates
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Charge Number <span className="text-red-500">*</span></Label>
                <Input 
                  value={newChargeCode.chargeNumber || ''}
                  onChange={(e) => setNewChargeCode(prev => ({ ...prev, chargeNumber: e.target.value }))}
                  placeholder="e.g., TT-2024-0892"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Hours</Label>
                <Input 
                  type="number"
                  value={newChargeCode.totalHours || ''}
                  onChange={(e) => setNewChargeCode(prev => ({ ...prev, totalHours: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g., 2400"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Project Name <span className="text-red-500">*</span></Label>
              <Input 
                value={newChargeCode.projectName || ''}
                onChange={(e) => setNewChargeCode(prev => ({ ...prev, projectName: e.target.value }))}
                placeholder="e.g., VA Transition Support"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Input 
                  value={newChargeCode.client || ''}
                  onChange={(e) => setNewChargeCode(prev => ({ ...prev, client: e.target.value }))}
                  placeholder="e.g., Department of Veterans Affairs"
                />
              </div>
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Input 
                  value={newChargeCode.dateRange || ''}
                  onChange={(e) => setNewChargeCode(prev => ({ ...prev, dateRange: e.target.value }))}
                  placeholder="e.g., Jan 2024 - Mar 2024"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={newChargeCode.description || ''}
                onChange={(e) => setNewChargeCode(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                placeholder="Brief description of the project scope and deliverables"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Roles Involved</Label>
              <div className="flex flex-wrap gap-1 mb-2 min-h-[28px]">
                {(newChargeCode.roles || []).map(role => (
                  <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 pr-1">
                    {role}
                    <button 
                      onClick={() => handleRemoveNewRole(role)}
                      className="ml-1 text-gray-500 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {(newChargeCode.roles || []).length === 0 && (
                  <span className="text-xs text-gray-400">No roles added yet</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input 
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  placeholder="Type a role name and press Enter..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewRole())}
                />
                <Button variant="outline" onClick={handleAddNewRole} type="button">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleAddChargeCode} 
              disabled={!newChargeCode.chargeNumber || !newChargeCode.projectName}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Charge Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// REQUIREMENTS SECTION
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
  // View mode: list (default), matrix, gaps
  const [viewMode, setViewMode] = useState<'list' | 'matrix' | 'gaps'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  
  // Matrix pagination
  const WBS_COLUMNS_PER_PAGE = 6
  const [wbsPage, setWbsPage] = useState(0)
  const totalWbsPages = Math.ceil(wbsElements.length / WBS_COLUMNS_PER_PAGE)
  const visibleWbsElements = wbsElements.slice(
    wbsPage * WBS_COLUMNS_PER_PAGE, 
    (wbsPage + 1) * WBS_COLUMNS_PER_PAGE
  )
  
  // New requirement form state
  const [newReq, setNewReq] = useState<Partial<SOORequirement>>({
    referenceNumber: '',
    title: '',
    description: '',
    type: 'shall',
    category: 'functional',
    priority: 'high',
    source: '',
    linkedWbsIds: [],
    notes: '',
    isAIExtracted: false,
  })
  
  // Edit buffer state
  const [editBuffer, setEditBuffer] = useState<Partial<SOORequirement>>({})
  
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
  
  const handleAddRequirement = () => {
    if (!newReq.referenceNumber || !newReq.title) return
    
    const req: SOORequirement = {
      id: generateId(),
      referenceNumber: newReq.referenceNumber!,
      title: newReq.title!,
      description: newReq.description || '',
      type: newReq.type as RequirementType,
      category: newReq.category as RequirementCategory,
      priority: newReq.priority as 'critical' | 'high' | 'medium' | 'low',
      source: newReq.source || '',
      linkedWbsIds: [],
      notes: newReq.notes || '',
      isAIExtracted: false,
    }
    
    onAdd(req)
    setShowAddDialog(false)
    setNewReq({
      referenceNumber: '',
      title: '',
      description: '',
      type: 'shall',
      category: 'functional',
      priority: 'high',
      source: '',
      linkedWbsIds: [],
      notes: '',
      isAIExtracted: false,
    })
  }
  
  const handleStartEditing = (req: SOORequirement) => {
    setEditBuffer({ ...req })
    setEditingId(req.id)
  }
  
  const handleSaveEdit = () => {
    if (!editingId) return
    onUpdate(editingId, editBuffer)
    setEditingId(null)
    setEditBuffer({})
  }
  
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditBuffer({})
  }
  
  const handleOpenLinkDialog = (reqId: string) => {
    setSelectedReqId(reqId)
    setShowLinkDialog(true)
  }
  
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
          
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
      
      {/* Filter Bar - Only show for List and Matrix views */}
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
          
          {/* Matrix pagination - only in matrix view */}
          {viewMode === 'matrix' && wbsElements.length > WBS_COLUMNS_PER_PAGE && (
            <>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  WBS {wbsPage * WBS_COLUMNS_PER_PAGE + 1}-{Math.min((wbsPage + 1) * WBS_COLUMNS_PER_PAGE, wbsElements.length)}
                </span>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setWbsPage(p => Math.max(0, p - 1))} disabled={wbsPage === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setWbsPage(p => Math.min(totalWbsPages - 1, p + 1))} disabled={wbsPage >= totalWbsPages - 1}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
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
              const isEditing = editingId === req.id
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
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-3">
                        <Input 
                          value={editBuffer.referenceNumber || ''}
                          onChange={(e) => setEditBuffer(prev => ({ ...prev, referenceNumber: e.target.value }))}
                          className="h-8 text-sm"
                          placeholder="SOO 3.1.1"
                        />
                        <Input 
                          value={editBuffer.title || ''}
                          onChange={(e) => setEditBuffer(prev => ({ ...prev, title: e.target.value }))}
                          className="h-8 text-sm col-span-2"
                          placeholder="Title"
                        />
                        <Select 
                          value={editBuffer.type || 'shall'}
                          onValueChange={(v) => setEditBuffer(prev => ({ ...prev, type: v as RequirementType }))}
                        >
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(REQUIREMENT_TYPE_CONFIG).map(([key, { label }]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea 
                        value={editBuffer.description || ''}
                        onChange={(e) => setEditBuffer(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="text-sm"
                        placeholder="Full requirement text..."
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                        <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                      </div>
                    </div>
                  ) : (
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
                          <button
                            onClick={() => handleOpenLinkDialog(req.id)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                          >
                            + Link WBS
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleStartEditing(req)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(req.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
      
      {/* MATRIX VIEW */}
      {viewMode === 'matrix' && (
        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 sticky left-0 bg-gray-50 min-w-[280px] z-10">
                    Requirement
                  </th>
                  {visibleWbsElements.map(wbs => (
                    <th key={wbs.id} className="text-center px-3 py-3 text-xs font-medium text-gray-600 min-w-[100px]">
                      <div className="font-semibold text-gray-900">{wbs.wbsNumber}</div>
                      <div className="font-normal text-gray-500 truncate max-w-[90px]" title={wbs.title}>{wbs.title}</div>
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-600 min-w-[80px] sticky right-0 bg-gray-50 z-10">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequirements.map((req, idx) => {
                  const typeConfig = REQUIREMENT_TYPE_CONFIG[req.type]
                  const isMapped = req.linkedWbsIds.length > 0
                  
                  return (
                    <tr key={req.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${!isMapped ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3 sticky left-0 bg-inherit z-10">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-[10px] px-1.5 py-0 h-5 border ${typeConfig.color}`}>{typeConfig.label}</Badge>
                          <span className="font-mono text-xs font-medium text-gray-900">{req.referenceNumber}</span>
                        </div>
                        <div className="text-sm text-gray-700 line-clamp-1" title={req.title}>{req.title}</div>
                      </td>
                      {visibleWbsElements.map(wbs => {
                        const isLinked = req.linkedWbsIds.includes(wbs.id)
                        return (
                          <td key={wbs.id} className="text-center px-3 py-3">
                            <button
                              onClick={() => isLinked ? onUnlinkWbs(req.id, wbs.id) : onLinkWbs(req.id, wbs.id)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all mx-auto
                                ${isLinked ? 'bg-green-100 text-green-700 hover:bg-green-200 ring-2 ring-green-200' : 'bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600'}
                              `}
                            >
                              {isLinked ? <Check className="w-5 h-5" /> : <Plus className="w-4 h-4" />}
                            </button>
                          </td>
                        )
                      })}
                      <td className="text-center px-4 py-3 sticky right-0 bg-inherit z-10">
                        {isMapped ? (
                          <Badge className="bg-green-100 text-green-700 text-[10px] px-2">{req.linkedWbsIds.length} WBS</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] px-2">GAP</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center ring-1 ring-green-200"><Check className="w-3 h-3 text-green-700" /></div>
              Linked
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center"><Plus className="w-3 h-3 text-gray-400" /></div>
              Click to link
            </div>
          </div>
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
      
      {/* Add Requirement Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Requirement</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Reference *</Label>
                <Input 
                  value={newReq.referenceNumber || ''}
                  onChange={(e) => setNewReq(prev => ({ ...prev, referenceNumber: e.target.value }))}
                  placeholder="SOO 3.1.1"
                  className="h-9"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-xs">Title *</Label>
                <Input 
                  value={newReq.title || ''}
                  onChange={(e) => setNewReq(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Transition-In Support"
                  className="h-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Textarea 
                value={newReq.description || ''}
                onChange={(e) => setNewReq(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                placeholder="The contractor shall..."
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Type</Label>
                <Select value={newReq.type || 'shall'} onValueChange={(v) => setNewReq(prev => ({ ...prev, type: v as RequirementType }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(REQUIREMENT_TYPE_CONFIG).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Category</Label>
                <Select value={newReq.category || 'functional'} onValueChange={(v) => setNewReq(prev => ({ ...prev, category: v as RequirementCategory }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(REQUIREMENT_CATEGORY_CONFIG).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Priority</Label>
                <Select value={newReq.priority || 'high'} onValueChange={(v) => setNewReq(prev => ({ ...prev, priority: v as 'critical' | 'high' | 'medium' | 'low' }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(REQUIREMENT_PRIORITY_CONFIG).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddRequirement} disabled={!newReq.referenceNumber || !newReq.title}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Link WBS Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Link to WBS Elements</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-2 max-h-[400px] overflow-y-auto">
            {wbsElements.map(wbs => {
              const req = requirements.find(r => r.id === selectedReqId)
              const isLinked = req?.linkedWbsIds.includes(wbs.id) || false
              
              return (
                <div 
                  key={wbs.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors
                    ${isLinked ? 'bg-blue-50 border-blue-100' : 'hover:bg-gray-50 border-gray-100'}
                  `}
                  onClick={() => {
                    if (selectedReqId) {
                      isLinked ? onUnlinkWbs(selectedReqId, wbs.id) : onLinkWbs(selectedReqId, wbs.id)
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    {isLinked ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{wbs.wbsNumber}</span>
                        <span className="text-sm text-gray-700">{wbs.title}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">{getElementTotalHours(wbs).toLocaleString()} hrs</span>
                </div>
              )
            })}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowLinkDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// EXPORT SECTION (DEPRECATED - Export now lives in main Export tab)
// ============================================================================
// NOTE: This component is no longer used in the Estimate tab. Export functionality
// has been consolidated into the main Export tab (export-tab.tsx).
// Keeping for reference in case useful code needs to be merged.

// Readiness row component for export section
function ReadinessRow({ 
  label, 
  passed, 
  value, 
  isWarning 
}: { 
  label: string
  passed: boolean
  value?: string
  isWarning?: boolean 
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        {value && (
          <span className={`text-sm font-medium ${
            passed ? 'text-green-600' : isWarning ? 'text-amber-600' : 'text-red-600'
          }`}>
            {value}
          </span>
        )}
        {passed ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : isWarning ? (
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
      </div>
    </div>
  )
}

interface ExportSectionProps {
  wbsElements: EnhancedWBSElement[]
  requirements: SOORequirement[]
  contractPeriods: { key: PeriodKey; label: string }[]
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ExportSection({ wbsElements, requirements, contractPeriods }: ExportSectionProps) {
  const [contractTitle, setContractTitle] = useState('Government Contract')
  const [rfpNumber, setRfpNumber] = useState('')
  const [companyName, setCompanyName] = useState('Friends From The City, LLC')
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'word' | 'excel' | null>(null)
  
  // Calculate readiness checks
  const checks = useMemo(() => {
    const hasWbs = wbsElements.length > 0
    const allComplete = wbsElements.every(el => el.qualityScore >= 75)
    const noOrphans = !wbsElements.some(el => el.laborEstimates.some(l => l.isOrphaned))
    const reqsMapped = requirements.filter(r => r.linkedWbsIds.length > 0).length
    const shallReqs = requirements.filter(r => r.type === 'shall')
    const shallMapped = shallReqs.filter(r => r.linkedWbsIds.length > 0).length
    const allShallMapped = shallReqs.length === 0 || shallMapped === shallReqs.length
    const hasLabor = wbsElements.some(el => el.laborEstimates.length > 0)
    
    return {
      hasWbs,
      allComplete,
      noOrphans,
      allShallMapped,
      hasLabor,
      reqsMapped,
      totalReqs: requirements.length,
      shallMapped,
      shallTotal: shallReqs.length,
      passCount: [hasWbs, allComplete, noOrphans, allShallMapped, hasLabor].filter(Boolean).length,
      totalChecks: 5
    }
  }, [wbsElements, requirements])
  
  // Calculate totals for preview
  const totals = useMemo(() => {
    const totalHours = wbsElements.reduce((sum, el) => 
      sum + el.laborEstimates.reduce((s, l) => s + getTotalHours(l.hoursByPeriod), 0), 0
    )
    const totalRisks = wbsElements.reduce((sum, el) => sum + el.risks.length, 0)
    const avgQuality = wbsElements.length > 0
      ? Math.round(wbsElements.reduce((sum, el) => sum + el.qualityScore, 0) / wbsElements.length)
      : 0
    return { totalHours, totalRisks, avgQuality }
  }, [wbsElements])
  
  const handleExportWord = async () => {
    setIsExporting(true)
    setExportFormat('word')
    
    try {
      // Dynamic import docx library
      const docx = await import('docx')
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
              Header, Footer, AlignmentType, BorderStyle, WidthType, 
              ShadingType, PageNumber, PageBreak, LevelFormat, convertInchesToTwip } = docx
      
      // =========================================================================
      // DESIGN TOKENS - Clean, minimal, professional
      // =========================================================================
      const FONT = 'Helvetica Neue'
      const COLORS = {
        primary: '1a1a1a',      // Near black text
        secondary: '6b7280',    // Gray 500
        muted: '9ca3af',        // Gray 400
        border: 'e5e7eb',       // Gray 200
        tableAlt: 'f9fafb',     // Gray 50
      }
      const SIZE = {
        title: 56,      // 28pt
        h1: 32,         // 16pt
        h2: 26,         // 13pt
        body: 22,       // 11pt
        small: 20,      // 10pt
        tiny: 18,       // 9pt
      }
      
      // =========================================================================
      // HELPER: Styled text
      // =========================================================================
      const txt = (content: string, opts: { size?: number; bold?: boolean; color?: string; italic?: boolean; allCaps?: boolean } = {}) =>
        new TextRun({
          text: content,
          font: FONT,
          size: opts.size || SIZE.body,
          bold: opts.bold,
          color: opts.color || COLORS.primary,
          italics: opts.italic,
          allCaps: opts.allCaps,
        })
      
      // =========================================================================
      // HELPER: Paragraph with spacing
      // =========================================================================
      const para = (content: any, opts: { align?: any; before?: number; after?: number } = {}) =>
        new Paragraph({
          children: Array.isArray(content) ? content : [content],
          alignment: opts.align || AlignmentType.LEFT,
          spacing: { before: opts.before || 0, after: opts.after || 200, line: 276 },
        })
      
      // =========================================================================
      // HELPER: Section heading with bottom border
      // =========================================================================
      const sectionHead = (title: string) => new Paragraph({
        children: [txt(title.toUpperCase(), { size: SIZE.h1, bold: true, color: COLORS.primary })],
        spacing: { before: 100, after: 300, line: 276 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.border } },
      })
      
      // =========================================================================
      // HELPER: Subsection heading
      // =========================================================================
      const subHead = (title: string) => new Paragraph({
        children: [txt(title, { size: SIZE.h2, bold: true, color: COLORS.secondary })],
        spacing: { before: 300, after: 160, line: 276 },
      })
      
      // =========================================================================
      // HELPER: Clean table cell (horizontal borders only)
      // =========================================================================
      const cell = (content: string, opts: { width?: number; bold?: boolean; align?: any; shading?: string; isHeader?: boolean; isNum?: boolean } = {}) =>
        new TableCell({
          width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
          shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
          margins: {
            top: convertInchesToTwip(0.06),
            bottom: convertInchesToTwip(0.06),
            left: convertInchesToTwip(0.1),
            right: convertInchesToTwip(0.1),
          },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
            left: { style: BorderStyle.NIL },
            right: { style: BorderStyle.NIL },
          },
          children: [new Paragraph({
            alignment: opts.align || (opts.isNum ? AlignmentType.RIGHT : AlignmentType.LEFT),
            spacing: { after: 0 },
            children: [txt(content, {
              size: opts.isHeader ? SIZE.small : SIZE.body,
              bold: opts.bold || opts.isHeader,
              color: opts.isHeader ? COLORS.secondary : COLORS.primary,
            })]
          })]
        })
      
      const numCell = (val: number, opts: { width?: number; shading?: string; bold?: boolean } = {}) =>
        cell(val.toLocaleString(), { ...opts, isNum: true })
      
      // =========================================================================
      // CALCULATE STATS
      // =========================================================================
      const shallReqs = requirements.filter(r => r.type === 'shall')
      const shallMapped = shallReqs.filter(r => r.linkedWbsIds.length > 0).length
      const mappedReqs = requirements.filter(r => r.linkedWbsIds.length > 0).length
      const totalRisks = wbsElements.reduce((sum, el) => sum + el.risks.length, 0)
      const avgQuality = wbsElements.length > 0 
        ? Math.round(wbsElements.reduce((sum, el) => sum + el.qualityScore, 0) / wbsElements.length)
        : 0
      
      // =========================================================================
      // BUILD DOCUMENT CONTENT
      // =========================================================================
      const children: any[] = []
      
      // -------------------------------------------------------------------------
      // COVER PAGE
      // -------------------------------------------------------------------------
      children.push(para(txt(''), { after: 2000 })) // Push content down
      
      children.push(para(
        txt('BASIS OF ESTIMATE', { size: SIZE.small, color: COLORS.muted, allCaps: true }),
        { align: AlignmentType.CENTER, after: 300 }
      ))
      
      children.push(para(
        txt(contractTitle || 'Government Contract', { size: SIZE.title, bold: true }),
        { align: AlignmentType.CENTER, after: 200 }
      ))
      
      if (rfpNumber) {
        children.push(para(
          txt(`Solicitation ${rfpNumber}`, { size: SIZE.h2, color: COLORS.secondary }),
          { align: AlignmentType.CENTER, after: 400 }
        ))
      }
      
      // Divider
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600, after: 600 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border } },
        children: []
      }))
      
      children.push(para(
        txt(companyName, { size: SIZE.h2, bold: true }),
        { align: AlignmentType.CENTER, after: 400 }
      ))
      
      children.push(para(txt(''), { after: 800 })) // Spacer
      
      children.push(para(
        txt(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), { size: SIZE.small, color: COLORS.muted }),
        { align: AlignmentType.CENTER, after: 0 }
      ))
      
      children.push(new Paragraph({ children: [new PageBreak()] }))
      
      // -------------------------------------------------------------------------
      // EXECUTIVE SUMMARY
      // -------------------------------------------------------------------------
      children.push(sectionHead('Executive Summary'))
      
      children.push(para([
        txt('This Basis of Estimate documents '),
        txt(`${wbsElements.length} work breakdown structure elements`, { bold: true }),
        txt(' totaling '),
        txt(`${totals.totalHours.toLocaleString()} labor hours`, { bold: true }),
        txt(` across ${contractPeriods.length} contract periods.`),
      ], { after: 300 }))
      
      // Summary stats in clean 2-column table
      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            cell('Total Labor Hours', { isHeader: true }),
            cell(totals.totalHours.toLocaleString(), { bold: true, align: AlignmentType.RIGHT }),
          ]}),
          new TableRow({ children: [
            cell('WBS Elements', { shading: COLORS.tableAlt }),
            cell(wbsElements.length.toString(), { shading: COLORS.tableAlt, align: AlignmentType.RIGHT }),
          ]}),
          new TableRow({ children: [
            cell('Requirements Traced', {}),
            cell(`${mappedReqs} of ${requirements.length}`, { align: AlignmentType.RIGHT }),
          ]}),
          new TableRow({ children: [
            cell('"Shall" Requirements Covered', { shading: COLORS.tableAlt }),
            cell(`${shallMapped} of ${shallReqs.length}`, { shading: COLORS.tableAlt, align: AlignmentType.RIGHT }),
          ]}),
          new TableRow({ children: [
            cell('Identified Risks', {}),
            cell(totalRisks.toString(), { align: AlignmentType.RIGHT }),
          ]}),
          new TableRow({ children: [
            cell('Average Quality Score', { shading: COLORS.tableAlt }),
            cell(`${avgQuality}%`, { shading: COLORS.tableAlt, align: AlignmentType.RIGHT }),
          ]}),
        ]
      }))
      
      children.push(new Paragraph({ children: [new PageBreak()] }))
      
      // -------------------------------------------------------------------------
      // WBS SUMMARY
      // -------------------------------------------------------------------------
      children.push(sectionHead('WBS Summary'))
      
      children.push(para(
        txt('Overview of all work breakdown structure elements and estimated labor.', { color: COLORS.secondary }),
        { after: 300 }
      ))
      
      const wbsSummaryRows = wbsElements.map((el, idx) => {
        const hrs = el.laborEstimates.reduce((s, l) => s + getTotalHours(l.hoursByPeriod), 0)
        const shading = idx % 2 === 1 ? COLORS.tableAlt : undefined
        return new TableRow({ children: [
          cell(el.wbsNumber, { width: 1000, shading }),
          cell(el.title, { width: 5000, shading }),
          cell(hrs.toLocaleString(), { width: 1500, shading, align: AlignmentType.RIGHT }),
          cell(`${el.qualityScore}%`, { width: 1200, shading, align: AlignmentType.CENTER }),
        ]})
      })
      
      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ tableHeader: true, children: [
            cell('WBS', { width: 1000, isHeader: true }),
            cell('Title', { width: 5000, isHeader: true }),
            cell('Hours', { width: 1500, isHeader: true, align: AlignmentType.RIGHT }),
            cell('Quality', { width: 1200, isHeader: true, align: AlignmentType.CENTER }),
          ]}),
          ...wbsSummaryRows,
          new TableRow({ children: [
            cell('', { width: 1000 }),
            cell('Total', { width: 5000, bold: true }),
            cell(totals.totalHours.toLocaleString(), { width: 1500, bold: true, align: AlignmentType.RIGHT }),
            cell('', { width: 1200 }),
          ]}),
        ]
      }))
      
      // -------------------------------------------------------------------------
      // DETAILED WBS ELEMENTS
      // -------------------------------------------------------------------------
      wbsElements.forEach((el) => {
        const hrs = el.laborEstimates.reduce((s, l) => s + getTotalHours(l.hoursByPeriod), 0)
        const linkedReqs = requirements.filter(r => r.linkedWbsIds.includes(el.id))
        
        children.push(new Paragraph({ children: [new PageBreak()] }))
        
        // WBS Header
        children.push(new Paragraph({
          children: [
            txt(el.wbsNumber, { size: SIZE.h1, bold: true, color: COLORS.secondary }),
            txt('  ', { size: SIZE.h1 }),
            txt(el.title, { size: SIZE.h1, bold: true }),
          ],
          spacing: { before: 0, after: 200, line: 276 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.border } },
        }))
        
        // SOW Reference & Hours summary
        const metaParts: any[] = []
        if (el.sowReference) {
          metaParts.push(txt('SOW: ', { size: SIZE.small, color: COLORS.muted }))
          metaParts.push(txt(el.sowReference, { size: SIZE.small, bold: true }))
          metaParts.push(txt('    ', { size: SIZE.small }))
        }
        metaParts.push(txt('Total Hours: ', { size: SIZE.small, color: COLORS.muted }))
        metaParts.push(txt(hrs.toLocaleString(), { size: SIZE.small, bold: true }))
        
        children.push(para(metaParts, { after: 300 }))
        
        // Why - Purpose
        if (el.why) {
          children.push(subHead('Purpose'))
          children.push(para(txt(el.why, { color: COLORS.primary }), { after: 300 }))
        }
        
        // What - Task Description / Scope
        if (el.what) {
          children.push(subHead('Task Description'))
          children.push(para(txt(el.what, { color: COLORS.primary }), { after: 300 }))
        }
        
        // Not Included - Exclusions
        if (el.notIncluded) {
          children.push(subHead('Exclusions'))
          children.push(para(txt(el.notIncluded, { color: COLORS.secondary, italic: true }), { after: 300 }))
        }
        
        // Basis of Estimate - The methodology section
        const hasEstimateBasis = el.estimateMethod || el.historicalReference || el.engineeringBasis
        if (hasEstimateBasis) {
          children.push(subHead('Basis of Estimate'))
          
          // Estimate method label
          const methodLabels: Record<string, string> = {
            'historical': 'Historical Data',
            'engineering': 'Engineering Estimate',
            'parametric': 'Parametric Model',
            'expert': 'Expert Judgment',
            'analogy': 'Analogy-Based',
          }
          
          if (el.estimateMethod) {
            children.push(para([
              txt('Method: ', { size: SIZE.body, color: COLORS.muted }),
              txt(methodLabels[el.estimateMethod] || el.estimateMethod, { size: SIZE.body, bold: true }),
            ], { after: 160 }))
          }
          
          // Historical reference details
          if (el.historicalReference) {
            const hr = el.historicalReference
            children.push(para([
              txt('Reference Project: ', { size: SIZE.body, color: COLORS.muted }),
              txt(`${hr.projectName} (${hr.chargeNumber})`, { size: SIZE.body, bold: true }),
            ], { after: 80 }))
            
            if (hr.dateRange) {
              children.push(para([
                txt('Period: ', { size: SIZE.body, color: COLORS.muted }),
                txt(hr.dateRange, { size: SIZE.body }),
                txt('  |  Actual Hours: ', { size: SIZE.body, color: COLORS.muted }),
                txt(hr.actualHours.toLocaleString(), { size: SIZE.body, bold: true }),
              ], { after: 80 }))
            }
            
            if (hr.notes) {
              children.push(para(txt(hr.notes, { size: SIZE.body, italic: true }), { after: 160 }))
            }
          }
          
          // Engineering basis details
          if (el.engineeringBasis) {
            const eb = el.engineeringBasis
            
            if (eb.expertSource) {
              children.push(para([
                txt('Expert Source: ', { size: SIZE.body, color: COLORS.muted }),
                txt(eb.expertSource, { size: SIZE.body, bold: true }),
              ], { after: 80 }))
            }
            
            if (eb.similarWork) {
              children.push(para([
                txt('Similar Work: ', { size: SIZE.body, color: COLORS.muted }),
                txt(eb.similarWork, { size: SIZE.body }),
              ], { after: 80 }))
            }
            
            if (eb.assumptions) {
              children.push(para([
                txt('Key Assumptions: ', { size: SIZE.body, color: COLORS.muted }),
                txt(eb.assumptions, { size: SIZE.body }),
              ], { after: 80 }))
            }
            
            if (eb.confidenceNotes) {
              children.push(para([
                txt('Confidence: ', { size: SIZE.body, color: COLORS.muted }),
                txt(eb.confidenceNotes, { size: SIZE.body, italic: true }),
              ], { after: 160 }))
            }
          }
          
          // Complexity factor if not 1.0
          if (el.complexityFactor && el.complexityFactor !== 1.0) {
            children.push(para([
              txt('Complexity Factor: ', { size: SIZE.body, color: COLORS.muted }),
              txt(`${el.complexityFactor}x`, { size: SIZE.body, bold: true }),
              txt(el.complexityJustification ? ` — ${el.complexityJustification}` : '', { size: SIZE.body }),
            ], { after: 160 }))
          }
        }
        
        // Requirements
        if (linkedReqs.length > 0) {
          children.push(subHead('Requirements Addressed'))
          linkedReqs.forEach(req => {
            children.push(new Paragraph({
              numbering: { reference: 'bullets', level: 0 },
              spacing: { after: 100 },
              children: [
                txt(`${req.referenceNumber}`, { bold: true, size: SIZE.body }),
                txt(`: ${req.title}`, { size: SIZE.body }),
              ]
            }))
          })
        }
        
        // Labor Breakdown
        if (el.laborEstimates.length > 0) {
          children.push(subHead('Labor Breakdown'))
          
          const laborRows = el.laborEstimates.map((labor, lIdx) => {
            const shading = lIdx % 2 === 1 ? COLORS.tableAlt : undefined
            return new TableRow({ children: [
              cell(labor.roleName, { width: 2800, shading }),
              ...contractPeriods.map(p => cell(labor.hoursByPeriod[p.key].toLocaleString(), { width: 1000, shading, align: AlignmentType.RIGHT })),
              cell(getTotalHours(labor.hoursByPeriod).toLocaleString(), { width: 1200, shading, bold: true, align: AlignmentType.RIGHT }),
            ]})
          })
          
          // Subtotal row
          const subtotalRow = new TableRow({ children: [
            cell('Subtotal', { width: 2800, bold: true }),
            ...contractPeriods.map(p => {
              const periodTotal = el.laborEstimates.reduce((sum, l) => sum + l.hoursByPeriod[p.key], 0)
              return cell(periodTotal.toLocaleString(), { width: 1000, bold: true, align: AlignmentType.RIGHT })
            }),
            cell(hrs.toLocaleString(), { width: 1200, bold: true, align: AlignmentType.RIGHT }),
          ]})
          
          children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ tableHeader: true, children: [
                cell('Role', { width: 2800, isHeader: true }),
                ...contractPeriods.map(p => cell(p.label, { width: 1000, isHeader: true, align: AlignmentType.RIGHT })),
                cell('Total', { width: 1200, isHeader: true, align: AlignmentType.RIGHT }),
              ]}),
              ...laborRows,
              subtotalRow,
            ]
          }))
          
          // Labor Rationales - the "basis" in Basis of Estimate
          const rationales = el.laborEstimates.filter(l => l.rationale && l.rationale.trim())
          if (rationales.length > 0) {
            children.push(subHead('Labor Rationale'))
            rationales.forEach(labor => {
              children.push(new Paragraph({
                spacing: { after: 160 },
                children: [
                  txt(`${labor.roleName}: `, { bold: true, size: SIZE.body }),
                  txt(labor.rationale || '', { size: SIZE.body, color: COLORS.primary }),
                ]
              }))
            })
          }
        }
        
        // Assumptions
        if (el.assumptions.length > 0) {
          children.push(subHead('Assumptions'))
          el.assumptions.forEach(a => {
            children.push(new Paragraph({
              numbering: { reference: 'bullets', level: 0 },
              spacing: { after: 100 },
              children: [txt(a, { size: SIZE.body })]
            }))
          })
        }
        
        // Risks
        if (el.risks.length > 0) {
          children.push(subHead('Risks'))
          
          const riskRows = el.risks.map((risk, rIdx) => {
            const score = risk.probability * risk.impact
            const shading = rIdx % 2 === 1 ? COLORS.tableAlt : undefined
            return new TableRow({ children: [
              cell(risk.description, { width: 4000, shading }),
              cell(`${risk.probability}×${risk.impact}=${score}`, { width: 1000, shading, align: AlignmentType.CENTER }),
              cell(risk.mitigation, { width: 4000, shading }),
            ]})
          })
          
          children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ tableHeader: true, children: [
                cell('Risk', { width: 4000, isHeader: true }),
                cell('P×I', { width: 1000, isHeader: true, align: AlignmentType.CENTER }),
                cell('Mitigation', { width: 4000, isHeader: true }),
              ]}),
              ...riskRows,
            ]
          }))
        }
      })
      
      // =========================================================================
      // CREATE DOCUMENT
      // =========================================================================
      const doc = new Document({
        styles: {
          default: {
            document: { run: { font: FONT, size: SIZE.body } }
          }
        },
        numbering: {
          config: [{
            reference: 'bullets',
            levels: [{
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 400, hanging: 200 } } }
            }]
          }]
        },
        sections: [{
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1.25),
                right: convertInchesToTwip(1.25),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1.25),
              }
            }
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { after: 0 },
                  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border } },
                  children: [
                    txt(companyName, { size: SIZE.tiny, color: COLORS.muted }),
                    txt('  |  ', { size: SIZE.tiny, color: COLORS.border }),
                    txt(rfpNumber || 'Basis of Estimate', { size: SIZE.tiny, color: COLORS.muted }),
                  ]
                })
              ]
            })
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100 },
                  border: { top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border } },
                  children: [
                    txt('Page ', { size: SIZE.tiny, color: COLORS.muted }),
                    new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: SIZE.tiny, color: COLORS.muted }),
                    txt(' of ', { size: SIZE.tiny, color: COLORS.muted }),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: SIZE.tiny, color: COLORS.muted }),
                  ]
                })
              ]
            })
          },
          children
        }]
      })
      
      // Generate and download
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `BOE-${rfpNumber || 'draft'}-${new Date().toISOString().split('T')[0]}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Export failed:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nMake sure 'docx' package is installed: npm install docx`)
    }
    
    setIsExporting(false)
    setExportFormat(null)
  }
  
  const handleExportExcel = async () => {
    setIsExporting(true)
    setExportFormat('excel')
    
    try {
      // Generate CSV content (works without external library)
      const lines: string[] = []
      
      // Header
      lines.push(`Basis of Estimate - ${contractTitle}`)
      lines.push(`RFP: ${rfpNumber || 'N/A'}`)
      lines.push(`Generated: ${new Date().toLocaleDateString()}`)
      lines.push('')
      
      // WBS Summary
      lines.push('WBS SUMMARY')
      lines.push(['WBS #', 'Title', 'SOW Ref', ...contractPeriods.map(p => p.label), 'Total Hours', 'Quality'].join(','))
      
      wbsElements.forEach(el => {
        const periodHours = contractPeriods.map(p => 
          el.laborEstimates.reduce((sum, l) => sum + l.hoursByPeriod[p.key], 0)
        )
        const totalHrs = el.laborEstimates.reduce((s, l) => s + getTotalHours(l.hoursByPeriod), 0)
        lines.push([
          el.wbsNumber,
          `"${el.title.replace(/"/g, '""')}"`,
          el.sowReference || '',
          ...periodHours,
          totalHrs,
          `${el.qualityScore}%`
        ].join(','))
      })
      
      lines.push('')
      lines.push(['TOTALS', '', '', ...contractPeriods.map(p => 
        wbsElements.reduce((sum, el) => sum + el.laborEstimates.reduce((s, l) => s + l.hoursByPeriod[p.key], 0), 0)
      ), totals.totalHours, ''].join(','))
      
      // Labor Detail
      lines.push('')
      lines.push('LABOR DETAIL')
      lines.push(['WBS #', 'Role', ...contractPeriods.map(p => p.label), 'Total', 'Rationale'].join(','))
      
      wbsElements.forEach(el => {
        el.laborEstimates.forEach(labor => {
          lines.push([
            el.wbsNumber,
            `"${labor.roleName.replace(/"/g, '""')}"`,
            ...contractPeriods.map(p => labor.hoursByPeriod[p.key]),
            getTotalHours(labor.hoursByPeriod),
            `"${(labor.rationale || '').replace(/"/g, '""')}"`
          ].join(','))
        })
      })
      
      // Requirements Traceability
      lines.push('')
      lines.push('REQUIREMENTS TRACEABILITY')
      lines.push(['Ref #', 'Title', 'Type', 'Linked WBS'].join(','))
      
      requirements.forEach(req => {
        const linkedWbs = wbsElements.filter(el => req.linkedWbsIds.includes(el.id))
        lines.push([
          req.referenceNumber,
          `"${req.title.replace(/"/g, '""')}"`,
          req.type.toUpperCase(),
          `"${linkedWbs.map(w => w.wbsNumber).join(', ')}"`
        ].join(','))
      })
      
      // Risks
      lines.push('')
      lines.push('RISK REGISTER')
      lines.push(['WBS #', 'Risk', 'Probability', 'Impact', 'Score', 'Status', 'Mitigation'].join(','))
      
      wbsElements.forEach(el => {
        el.risks.forEach(risk => {
          lines.push([
            el.wbsNumber,
            `"${risk.description.replace(/"/g, '""')}"`,
            risk.probability,
            risk.impact,
            risk.probability * risk.impact,
            risk.status,
            `"${risk.mitigation.replace(/"/g, '""')}"`
          ].join(','))
        })
      })
      
      // Download CSV
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `BOE-${rfpNumber || 'draft'}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Export failed:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setIsExporting(false)
    setExportFormat(null)
  }
  
  const isReady = checks.passCount >= 3 // At least 3/5 checks pass
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Export Basis of Estimate</h2>
        <p className="text-sm text-gray-500 mt-1">
          Generate professional BOE documents for proposal submission
        </p>
      </div>
      
      {/* Document Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-blue-500 rounded-full" />
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Document Information</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Contract Title</Label>
            <Input 
              value={contractTitle}
              onChange={(e) => setContractTitle(e.target.value)}
              placeholder="Government Contract"
              className="h-10 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">RFP/Solicitation Number</Label>
            <Input 
              value={rfpNumber}
              onChange={(e) => setRfpNumber(e.target.value)}
              placeholder="e.g., 19AQMM25Q0273"
              className="h-10 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Company Name</Label>
            <Input 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-10 bg-white"
            />
          </div>
        </div>
      </div>
      
      {/* Readiness Checks */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-green-500 rounded-full" />
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Export Readiness</span>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg divide-y divide-gray-100">
          <ReadinessRow 
            label="WBS Elements Defined" 
            passed={checks.hasWbs}
            value={`${wbsElements.length} elements`}
          />
          <ReadinessRow 
            label="Labor Hours Estimated" 
            passed={checks.hasLabor}
            value={`${totals.totalHours.toLocaleString()} hrs`}
          />
          <ReadinessRow 
            label="All Elements ≥75% Complete" 
            passed={checks.allComplete}
            value={checks.allComplete ? undefined : `${totals.avgQuality}% avg`}
            isWarning={!checks.allComplete}
          />
          <ReadinessRow 
            label="No Orphaned Roles" 
            passed={checks.noOrphans}
            isWarning={!checks.noOrphans}
          />
          <ReadinessRow 
            label='All "Shall" Requirements Mapped' 
            passed={checks.allShallMapped}
            value={`${checks.shallMapped}/${checks.shallTotal} mapped`}
          />
        </div>
      </div>
      
      {/* Document Preview */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-purple-500 rounded-full" />
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Document Preview</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-5">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">WBS Elements</p>
              <p className="text-2xl font-semibold text-gray-900">{wbsElements.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Hours</p>
              <p className="text-2xl font-semibold text-gray-900">{totals.totalHours.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Requirements</p>
              <p className="text-2xl font-semibold text-gray-900">{checks.reqsMapped}/{checks.totalReqs} <span className="text-sm font-normal text-gray-500">traced</span></p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Risks Documented</p>
              <p className="text-2xl font-semibold text-gray-900">{totals.totalRisks}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Export Buttons - Cleaner cards */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          className={`group relative bg-white border-2 rounded-xl p-6 text-left transition-all
            ${isExporting || !isReady 
              ? 'border-gray-100 opacity-50 cursor-not-allowed' 
              : 'border-gray-100 hover:border-blue-400 hover:shadow-md cursor-pointer'
            }`}
          onClick={handleExportWord}
          disabled={isExporting || !isReady}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${isExporting && exportFormat === 'word' ? 'bg-blue-100' : 'bg-blue-50 group-hover:bg-blue-100'} transition-colors`}>
              {isExporting && exportFormat === 'word' ? (
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              ) : (
                <FileText className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">Export BOE (Word)</p>
              <p className="text-sm text-gray-500 mt-0.5">Full Basis of Estimate document</p>
            </div>
          </div>
        </button>
        
        <button 
          className={`group relative bg-white border-2 rounded-xl p-6 text-left transition-all
            ${isExporting || !isReady 
              ? 'border-gray-100 opacity-50 cursor-not-allowed' 
              : 'border-gray-100 hover:border-green-400 hover:shadow-md cursor-pointer'
            }`}
          onClick={handleExportExcel}
          disabled={isExporting || !isReady}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${isExporting && exportFormat === 'excel' ? 'bg-green-100' : 'bg-green-50 group-hover:bg-green-100'} transition-colors`}>
              {isExporting && exportFormat === 'excel' ? (
                <RefreshCw className="w-6 h-6 text-green-600 animate-spin" />
              ) : (
                <ClipboardList className="w-6 h-6 text-green-600" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">Export Data (CSV)</p>
              <p className="text-sm text-gray-500 mt-0.5">Labor hours & traceability matrix</p>
            </div>
          </div>
        </button>
      </div>
      
      {/* Warning - Only show if not ready */}
      {!isReady && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Export not recommended</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Complete at least 3 readiness checks before exporting.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// WBS SLIDEOUT PANEL (SIMPLIFIED FOR SPACE)
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
  onAddChargeCode: (chargeCode: ChargeCode) => void
  onUpdateChargeCode: (id: string, updates: Partial<ChargeCode>) => void
  onDeleteChargeCode: (id: string) => void
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
  onAddChargeCode,
  onUpdateChargeCode,
  onDeleteChargeCode
}: WBSSlideoutProps) {
  const [activeTab, setActiveTab] = useState('details')
  
  // Details editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editBuffer, setEditBuffer] = useState<Partial<EnhancedWBSElement>>({})
  const [showChargeCodePicker, setShowChargeCodePicker] = useState(false)
  
  // Labor editing state
  const [editingLaborId, setEditingLaborId] = useState<string | null>(null)
  const [laborBuffer, setLaborBuffer] = useState<EnhancedLaborEstimate | null>(null)
  const [showAddLabor, setShowAddLabor] = useState(false)
  const [newLabor, setNewLabor] = useState<Partial<EnhancedLaborEstimate>>({
    roleId: '',
    roleName: '',
    hoursByPeriod: { base: 0, option1: 0, option2: 0, option3: 0, option4: 0 },
    rationale: '',
    confidence: 'medium',
    isAISuggested: false,
  })
  
  // Risk editing state
  const [editingRiskId, setEditingRiskId] = useState<string | null>(null)
  const [riskBuffer, setRiskBuffer] = useState<WBSRisk | null>(null)
  const [showAddRisk, setShowAddRisk] = useState(false)
  const [newRisk, setNewRisk] = useState<Partial<WBSRisk>>({
    description: '',
    probability: 3,
    impact: 3,
    mitigation: '',
    status: 'open',
  })
  
  if (!isOpen) return null
  
  const gradeConfig = QUALITY_GRADE_CONFIG[element.qualityGrade]
  
  // ============ DETAILS HANDLERS ============
  const handleStartEditing = () => {
    setEditBuffer({
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
      historicalReference: element.historicalReference ? { ...element.historicalReference } : undefined,
      engineeringBasis: element.engineeringBasis ? { ...element.engineeringBasis } : undefined,
    })
    setIsEditing(true)
  }
  
  const handleSave = () => {
    onUpdate(element.id, editBuffer)
    setIsEditing(false)
    setEditBuffer({})
  }
  
  const handleCancel = () => {
    setIsEditing(false)
    setEditBuffer({})
  }
  
  const handleSelectChargeCode = (cc: ChargeCode) => {
    setEditBuffer(prev => ({
      ...prev,
      estimateMethod: 'historical',
      historicalReference: {
        chargeCodeId: cc.id,
        chargeNumber: cc.chargeNumber,
        projectName: cc.projectName,
        dateRange: cc.dateRange,
        actualHours: cc.totalHours,
        notes: '',
      }
    }))
    setShowChargeCodePicker(false)
  }
  
  // ============ LABOR HANDLERS ============
  const handleStartEditingLabor = (labor: EnhancedLaborEstimate) => {
    setLaborBuffer({ ...labor, hoursByPeriod: { ...labor.hoursByPeriod } })
    setEditingLaborId(labor.id)
  }
  
  const handleSaveLabor = () => {
    if (!editingLaborId || !laborBuffer) return
    const updatedLabor = element.laborEstimates.map(l => 
      l.id === editingLaborId ? laborBuffer : l
    )
    onUpdate(element.id, { laborEstimates: updatedLabor })
    setEditingLaborId(null)
    setLaborBuffer(null)
  }
  
  const handleCancelLabor = () => {
    setEditingLaborId(null)
    setLaborBuffer(null)
  }
  
  const handleDeleteLabor = (laborId: string) => {
    const updatedLabor = element.laborEstimates.filter(l => l.id !== laborId)
    onUpdate(element.id, { laborEstimates: updatedLabor })
  }
  
  const handleAddLabor = () => {
    if (!newLabor.roleId || !newLabor.rationale) return
    const labor: EnhancedLaborEstimate = {
      id: generateId(),
      roleId: newLabor.roleId!,
      roleName: newLabor.roleName!,
      hoursByPeriod: newLabor.hoursByPeriod as PeriodHours,
      rationale: newLabor.rationale!,
      confidence: newLabor.confidence as 'high' | 'medium' | 'low',
      isAISuggested: false,
      isOrphaned: false,
    }
    onUpdate(element.id, { laborEstimates: [...element.laborEstimates, labor] })
    setShowAddLabor(false)
    setNewLabor({
      roleId: '',
      roleName: '',
      hoursByPeriod: { base: 0, option1: 0, option2: 0, option3: 0, option4: 0 },
      rationale: '',
      confidence: 'medium',
      isAISuggested: false,
    })
  }
  
  // ============ RISK HANDLERS ============
  const handleStartEditingRisk = (risk: WBSRisk) => {
    setRiskBuffer({ ...risk })
    setEditingRiskId(risk.id)
  }
  
  const handleSaveRisk = () => {
    if (!editingRiskId || !riskBuffer) return
    const updatedRisks = element.risks.map(r => 
      r.id === editingRiskId ? riskBuffer : r
    )
    onUpdate(element.id, { risks: updatedRisks })
    setEditingRiskId(null)
    setRiskBuffer(null)
  }
  
  const handleCancelRisk = () => {
    setEditingRiskId(null)
    setRiskBuffer(null)
  }
  
  const handleDeleteRisk = (riskId: string) => {
    const updatedRisks = element.risks.filter(r => r.id !== riskId)
    onUpdate(element.id, { risks: updatedRisks })
  }
  
  const handleAddRisk = () => {
    if (!newRisk.description) return
    const risk: WBSRisk = {
      id: generateId(),
      description: newRisk.description!,
      probability: newRisk.probability as 1|2|3|4|5,
      impact: newRisk.impact as 1|2|3|4|5,
      mitigation: newRisk.mitigation || '',
      status: newRisk.status as WBSRisk['status'],
    }
    onUpdate(element.id, { risks: [...element.risks, risk] })
    setShowAddRisk(false)
    setNewRisk({
      description: '',
      probability: 3,
      impact: 3,
      mitigation: '',
      status: 'open',
    })
  }
  
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
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && activeTab === 'details' && (
                <Button variant="outline" size="sm" onClick={handleStartEditing} className="h-8">
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
              )}
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
        {element.qualityIssues.length > 0 && !isEditing && (
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
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>WBS Number</Label>
                      <Input 
                        value={editBuffer.wbsNumber || ''} 
                        onChange={(e) => setEditBuffer(prev => ({ ...prev, wbsNumber: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SOW Reference</Label>
                      <Input 
                        value={editBuffer.sowReference || ''} 
                        onChange={(e) => setEditBuffer(prev => ({ ...prev, sowReference: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input 
                      value={editBuffer.title || ''} 
                      onChange={(e) => setEditBuffer(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input 
                        type="date"
                        value={editBuffer.periodOfPerformance?.startDate || ''} 
                        onChange={(e) => setEditBuffer(prev => ({ 
                          ...prev, 
                          periodOfPerformance: { ...prev.periodOfPerformance!, startDate: e.target.value } 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input 
                        type="date"
                        value={editBuffer.periodOfPerformance?.endDate || ''} 
                        onChange={(e) => setEditBuffer(prev => ({ 
                          ...prev, 
                          periodOfPerformance: { ...prev.periodOfPerformance!, endDate: e.target.value } 
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Why (Purpose)</Label>
                    <Textarea 
                      value={editBuffer.why || ''} 
                      onChange={(e) => setEditBuffer(prev => ({ ...prev, why: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>What (Deliverables)</Label>
                    <Textarea 
                      value={editBuffer.what || ''} 
                      onChange={(e) => setEditBuffer(prev => ({ ...prev, what: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Not Included</Label>
                    <Textarea 
                      value={editBuffer.notIncluded || ''} 
                      onChange={(e) => setEditBuffer(prev => ({ ...prev, notIncluded: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  
                  {/* Estimate Method & Historical Reference */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Basis of Estimate</h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label>Estimate Method</Label>
                        <Select 
                          value={editBuffer.estimateMethod || 'engineering'}
                          onValueChange={(v) => setEditBuffer(prev => ({ ...prev, estimateMethod: v as EstimateMethod }))}
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
                          value={editBuffer.complexityFactor || 1.0} 
                          onChange={(e) => setEditBuffer(prev => ({ ...prev, complexityFactor: parseFloat(e.target.value) }))}
                        />
                      </div>
                    </div>
                    
                    {editBuffer.estimateMethod === 'historical' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Historical Reference (Charge Code)</Label>
                          <Button variant="outline" size="sm" onClick={() => setShowChargeCodePicker(true)}>
                            <Hash className="w-4 h-4 mr-1" />
                            Select Charge Code
                          </Button>
                        </div>
                        
                        {editBuffer.historicalReference ? (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Hash className="w-4 h-4 text-blue-600" />
                              <span className="font-mono text-sm font-semibold text-blue-900">
                                {editBuffer.historicalReference.chargeNumber}
                              </span>
                            </div>
                            <div className="text-sm text-blue-800">{editBuffer.historicalReference.projectName}</div>
                            <div className="text-xs text-blue-600 mt-1">
                              {editBuffer.historicalReference.dateRange} • {editBuffer.historicalReference.actualHours.toLocaleString()} hrs
                            </div>
                            <div className="mt-2">
                              <Label className="text-xs text-blue-700">Relevance Notes</Label>
                              <Textarea 
                                value={editBuffer.historicalReference.notes || ''}
                                onChange={(e) => setEditBuffer(prev => ({
                                  ...prev,
                                  historicalReference: { ...prev.historicalReference!, notes: e.target.value }
                                }))}
                                rows={2}
                                className="mt-1 bg-white"
                                placeholder="Explain why this historical project is relevant..."
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic">
                            No charge code selected. Click "Select Charge Code" to link historical data.
                          </div>
                        )}
                      </div>
                    )}
                    
                    {editBuffer.estimateMethod === 'engineering' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-yellow-600" />
                          <Label className="text-sm font-medium">Engineering Judgment Basis</Label>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          Document the basis for this estimate to improve quality score and audit defensibility.
                        </p>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-yellow-800">Similar Work Reference</Label>
                            <Textarea 
                              value={editBuffer.engineeringBasis?.similarWork || ''}
                              onChange={(e) => setEditBuffer(prev => ({
                                ...prev,
                                engineeringBasis: { 
                                  ...prev.engineeringBasis,
                                  similarWork: e.target.value,
                                  expertSource: prev.engineeringBasis?.expertSource || '',
                                  assumptions: prev.engineeringBasis?.assumptions || '',
                                  confidenceNotes: prev.engineeringBasis?.confidenceNotes || ''
                                }
                              }))}
                              rows={2}
                              className="bg-white"
                              placeholder="Describe similar work you've done that informs this estimate (e.g., 'Similar admin dashboard built for HHS in 2023 took 400 hours')"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs text-yellow-800">Expert Source</Label>
                            <Input 
                              value={editBuffer.engineeringBasis?.expertSource || ''}
                              onChange={(e) => setEditBuffer(prev => ({
                                ...prev,
                                engineeringBasis: { 
                                  ...prev.engineeringBasis,
                                  expertSource: e.target.value,
                                  similarWork: prev.engineeringBasis?.similarWork || '',
                                  assumptions: prev.engineeringBasis?.assumptions || '',
                                  confidenceNotes: prev.engineeringBasis?.confidenceNotes || ''
                                }
                              }))}
                              className="bg-white"
                              placeholder="Who provided this estimate? (e.g., 'John Smith, Technical Lead, 15 years experience')"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs text-yellow-800">Key Assumptions</Label>
                            <Textarea 
                              value={editBuffer.engineeringBasis?.assumptions || ''}
                              onChange={(e) => setEditBuffer(prev => ({
                                ...prev,
                                engineeringBasis: { 
                                  ...prev.engineeringBasis,
                                  assumptions: e.target.value,
                                  similarWork: prev.engineeringBasis?.similarWork || '',
                                  expertSource: prev.engineeringBasis?.expertSource || '',
                                  confidenceNotes: prev.engineeringBasis?.confidenceNotes || ''
                                }
                              }))}
                              rows={2}
                              className="bg-white"
                              placeholder="What assumptions drive this estimate? (e.g., 'Assumes 10 screens, existing design system, stable requirements')"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs text-yellow-800">Confidence Notes</Label>
                            <Textarea 
                              value={editBuffer.engineeringBasis?.confidenceNotes || ''}
                              onChange={(e) => setEditBuffer(prev => ({
                                ...prev,
                                engineeringBasis: { 
                                  ...prev.engineeringBasis,
                                  confidenceNotes: e.target.value,
                                  similarWork: prev.engineeringBasis?.similarWork || '',
                                  expertSource: prev.engineeringBasis?.expertSource || '',
                                  assumptions: prev.engineeringBasis?.assumptions || ''
                                }
                              }))}
                              rows={2}
                              className="bg-white"
                              placeholder="Why do you have confidence in this estimate?"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {editBuffer.complexityFactor !== 1.0 && (
                      <div className="space-y-2 mt-4">
                        <Label>Complexity Justification</Label>
                        <Textarea 
                          value={editBuffer.complexityJustification || ''} 
                          onChange={(e) => setEditBuffer(prev => ({ ...prev, complexityJustification: e.target.value }))}
                          rows={2}
                          placeholder="Explain why the complexity factor differs from 1.0"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleSave}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-6">
                  {/* Period of Performance */}
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(element.periodOfPerformance.startDate)} – {formatDate(element.periodOfPerformance.endDate)}</span>
                  </div>
                  
                  {/* Description Sections */}
                  <div className="space-y-4">
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
                    
                    {element.assumptions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Assumptions</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {element.assumptions.map((a, idx) => (
                            <li key={idx}>• {a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
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
                    <p className="text-xs text-gray-600">
                      {ESTIMATE_METHOD_LABELS[element.estimateMethod].description}
                    </p>
                    {element.complexityJustification && (
                      <p className="text-xs text-gray-600 mt-2">
                        <span className="font-medium">Complexity:</span> {element.complexityJustification}
                      </p>
                    )}
                  </div>
                  
                  {/* Historical Reference */}
                  {element.historicalReference && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-4 h-4 text-blue-600" />
                        <span className="font-mono text-sm font-semibold text-blue-900">
                          {element.historicalReference.chargeNumber}
                        </span>
                      </div>
                      <div className="text-sm text-blue-800 mb-1">{element.historicalReference.projectName}</div>
                      <div className="text-xs text-blue-600">
                        {element.historicalReference.dateRange} • {element.historicalReference.actualHours.toLocaleString()} actual hours
                      </div>
                      {element.historicalReference.notes && (
                        <p className="text-xs text-blue-800 mt-2 pt-2 border-t border-blue-100">
                          {element.historicalReference.notes}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Engineering Basis */}
                  {element.estimateMethod === 'engineering' && element.engineeringBasis && (
                    Object.values(element.engineeringBasis).some(v => v && v.length > 0) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-semibold text-yellow-900">Engineering Judgment Basis</span>
                        </div>
                        <div className="space-y-3 text-xs">
                          {element.engineeringBasis.similarWork && (
                            <div>
                              <span className="font-medium text-yellow-800">Similar Work:</span>
                              <p className="text-yellow-700 mt-0.5">{element.engineeringBasis.similarWork}</p>
                            </div>
                          )}
                          {element.engineeringBasis.expertSource && (
                            <div>
                              <span className="font-medium text-yellow-800">Expert Source:</span>
                              <p className="text-yellow-700 mt-0.5">{element.engineeringBasis.expertSource}</p>
                            </div>
                          )}
                          {element.engineeringBasis.assumptions && (
                            <div>
                              <span className="font-medium text-yellow-800">Key Assumptions:</span>
                              <p className="text-yellow-700 mt-0.5">{element.engineeringBasis.assumptions}</p>
                            </div>
                          )}
                          {element.engineeringBasis.confidenceNotes && (
                            <div>
                              <span className="font-medium text-yellow-800">Confidence Notes:</span>
                              <p className="text-yellow-700 mt-0.5">{element.engineeringBasis.confidenceNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                  
                  {/* Prompt to add engineering basis if missing */}
                  {element.estimateMethod === 'engineering' && (!element.engineeringBasis || !Object.values(element.engineeringBasis).some(v => v && v.length > 0)) && (
                    <div className="bg-yellow-50 border border-yellow-200 border-dashed rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800 mb-1">Add supporting data for this estimate</p>
                          <p className="text-xs text-yellow-700 mb-2">
                            Engineering judgment estimates need documentation to be audit-defensible. 
                            Click Edit to add similar work references, expert sources, and assumptions.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-white text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                            onClick={handleStartEditing}
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1.5" />
                            Add Supporting Data
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            {/* LABOR TAB */}
            <TabsContent value="labor" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-900">Labor Estimates</h4>
                <Button size="sm" variant="outline" onClick={() => setShowAddLabor(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Role
                </Button>
              </div>
              
              {element.laborEstimates.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No labor estimates defined</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAddLabor(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Labor Estimate
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {element.laborEstimates.map(labor => (
                    <div 
                      key={labor.id}
                      className={`border rounded-lg p-4 ${labor.isOrphaned ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'}`}
                    >
                      {editingLaborId === labor.id && laborBuffer ? (
                        // EDIT MODE
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs">Role</Label>
                              <Select 
                                value={laborBuffer.roleId}
                                onValueChange={(v) => {
                                  const role = selectedRoles.find(r => r.id === v)
                                  setLaborBuffer(prev => prev ? { 
                                    ...prev, 
                                    roleId: v, 
                                    roleName: role?.name || prev.roleName 
                                  } : null)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {selectedRoles.map(role => (
                                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Confidence</Label>
                              <Select 
                                value={laborBuffer.confidence}
                                onValueChange={(v) => setLaborBuffer(prev => prev ? { ...prev, confidence: v as 'high' | 'medium' | 'low' } : null)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs">Hours by Period</Label>
                            <div className="grid grid-cols-5 gap-2">
                              {contractPeriods.map(period => (
                                <div key={period.key}>
                                  <Label className="text-[10px] text-gray-500">{period.label}</Label>
                                  <Input 
                                    type="number"
                                    className="h-8 text-sm"
                                    value={laborBuffer.hoursByPeriod[period.key]}
                                    onChange={(e) => setLaborBuffer(prev => prev ? {
                                      ...prev,
                                      hoursByPeriod: {
                                        ...prev.hoursByPeriod,
                                        [period.key]: parseInt(e.target.value) || 0
                                      }
                                    } : null)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs">Rationale</Label>
                            <Textarea 
                              value={laborBuffer.rationale}
                              onChange={(e) => setLaborBuffer(prev => prev ? { ...prev, rationale: e.target.value } : null)}
                              rows={2}
                              placeholder="Explain how you arrived at these hours..."
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={handleCancelLabor}>
                              Cancel
                            </Button>
                            <Button size="sm" onClick={handleSaveLabor}>
                              <Check className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // VIEW MODE
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${labor.isOrphaned ? 'text-red-700' : 'text-gray-900'}`}>
                                {labor.roleName}
                              </span>
                              {labor.isOrphaned && (
                                <Badge variant="destructive" className="text-[10px]">Orphaned</Badge>
                              )}
                              {labor.isAISuggested && (
                                <Bot className="w-3.5 h-3.5 text-purple-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                                onClick={() => handleStartEditingLabor(labor)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                                onClick={() => handleDeleteLabor(labor.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
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
                          
                          <div className="flex justify-between text-xs mb-2">
                            <span className={`${CONFIDENCE_CONFIG[labor.confidence].color}`}>
                              {CONFIDENCE_CONFIG[labor.confidence].label} confidence
                            </span>
                            <span className="font-semibold text-gray-900">
                              {getTotalHours(labor.hoursByPeriod).toLocaleString()} total
                            </span>
                          </div>
                          
                          {labor.rationale && (
                            <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                              <MessageSquare className="w-3 h-3 inline mr-1 text-gray-400" />
                              {labor.rationale}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add Labor Dialog */}
              <Dialog open={showAddLabor} onOpenChange={setShowAddLabor}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Labor Estimate</DialogTitle>
                    <DialogDescription>Add a role with hours for each contract period</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Role <span className="text-red-500">*</span></Label>
                      <Select 
                        value={newLabor.roleId || ''}
                        onValueChange={(v) => {
                          const role = selectedRoles.find(r => r.id === v)
                          setNewLabor(prev => ({ ...prev, roleId: v, roleName: role?.name || '' }))
                        }}
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
                              value={newLabor.hoursByPeriod?.[period.key] || 0}
                              onChange={(e) => setNewLabor(prev => ({
                                ...prev,
                                hoursByPeriod: {
                                  ...prev.hoursByPeriod as PeriodHours,
                                  [period.key]: parseInt(e.target.value) || 0
                                }
                              }))}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Confidence</Label>
                      <Select 
                        value={newLabor.confidence || 'medium'}
                        onValueChange={(v) => setNewLabor(prev => ({ ...prev, confidence: v as 'high' | 'medium' | 'low' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High confidence</SelectItem>
                          <SelectItem value="medium">Medium confidence</SelectItem>
                          <SelectItem value="low">Low confidence</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Rationale <span className="text-red-500">*</span></Label>
                      <Textarea 
                        value={newLabor.rationale || ''}
                        onChange={(e) => setNewLabor(prev => ({ ...prev, rationale: e.target.value }))}
                        rows={3}
                        placeholder="Explain how you arrived at these hours..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddLabor(false)}>Cancel</Button>
                    <Button onClick={handleAddLabor} disabled={!newLabor.roleId || !newLabor.rationale}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Labor
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            
            {/* RISKS TAB */}
            <TabsContent value="risks" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-900">Risk Register</h4>
                <Button size="sm" variant="outline" onClick={() => setShowAddRisk(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Risk
                </Button>
              </div>
              
              {element.risks.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No risks identified</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAddRisk(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Risk
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {element.risks.map(risk => {
                    const score = getRiskScore(risk)
                    const isEditing = editingRiskId === risk.id && riskBuffer
                    
                    return (
                      <div 
                        key={risk.id}
                        className={`border border-l-4 ${getRiskColor(score)} border-gray-100 rounded-lg p-4`}
                      >
                        {isEditing ? (
                          // EDIT MODE
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-xs">Risk Description</Label>
                              <Textarea 
                                value={riskBuffer.description}
                                onChange={(e) => setRiskBuffer(prev => prev ? { ...prev, description: e.target.value } : null)}
                                rows={2}
                              />
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs">Probability</Label>
                                <Select 
                                  value={String(riskBuffer.probability)}
                                  onValueChange={(v) => setRiskBuffer(prev => prev ? { ...prev, probability: parseInt(v) as 1|2|3|4|5 } : null)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5].map(n => (
                                      <SelectItem key={n} value={String(n)}>{PROBABILITY_LABELS[n]}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Impact</Label>
                                <Select 
                                  value={String(riskBuffer.impact)}
                                  onValueChange={(v) => setRiskBuffer(prev => prev ? { ...prev, impact: parseInt(v) as 1|2|3|4|5 } : null)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5].map(n => (
                                      <SelectItem key={n} value={String(n)}>{IMPACT_LABELS[n]}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Status</Label>
                                <Select 
                                  value={riskBuffer.status}
                                  onValueChange={(v) => setRiskBuffer(prev => prev ? { ...prev, status: v as WBSRisk['status'] } : null)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="mitigated">Mitigated</SelectItem>
                                    <SelectItem value="accepted">Accepted</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="p-2 bg-gray-100 rounded text-sm text-center">
                              Risk Score: <span className="font-bold">{riskBuffer.probability * riskBuffer.impact}</span>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs">Mitigation Strategy</Label>
                              <Textarea 
                                value={riskBuffer.mitigation}
                                onChange={(e) => setRiskBuffer(prev => prev ? { ...prev, mitigation: e.target.value } : null)}
                                rows={2}
                                placeholder="How will you mitigate this risk?"
                              />
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={handleCancelRisk}>
                                Cancel
                              </Button>
                              <Button size="sm" onClick={handleSaveRisk}>
                                <Check className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // VIEW MODE
                          <>
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-sm text-gray-900 flex-1">{risk.description}</p>
                              <div className="flex items-center gap-2 ml-4">
                                <div className="text-right">
                                  <div className="text-lg font-bold text-gray-900">{score}</div>
                                  <div className="text-[10px] text-gray-500">score</div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                                    onClick={() => handleStartEditingRisk(risk)}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                                    onClick={() => handleDeleteRisk(risk.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-gray-600">P: {PROBABILITY_LABELS[risk.probability]}</span>
                              <span className="text-gray-600">I: {IMPACT_LABELS[risk.impact]}</span>
                              <Badge variant="outline" className={`text-[10px] capitalize ${
                                risk.status === 'open' ? 'border-red-300 text-red-700' :
                                risk.status === 'mitigated' ? 'border-green-300 text-green-700' :
                                risk.status === 'accepted' ? 'border-yellow-300 text-yellow-700' :
                                'border-gray-300 text-gray-700'
                              }`}>
                                {risk.status}
                              </Badge>
                            </div>
                            {risk.mitigation && (
                              <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                                <span className="font-medium">Mitigation:</span> {risk.mitigation}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              
              {/* Add Risk Dialog */}
              <Dialog open={showAddRisk} onOpenChange={setShowAddRisk}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Risk</DialogTitle>
                    <DialogDescription>Identify a risk and plan mitigation</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Risk Description <span className="text-red-500">*</span></Label>
                      <Textarea 
                        value={newRisk.description || ''}
                        onChange={(e) => setNewRisk(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        placeholder="Describe the risk..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Probability</Label>
                        <Select 
                          value={String(newRisk.probability || 3)}
                          onValueChange={(v) => setNewRisk(prev => ({ ...prev, probability: parseInt(v) as 1|2|3|4|5 }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map(n => (
                              <SelectItem key={n} value={String(n)}>{PROBABILITY_LABELS[n]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Impact</Label>
                        <Select 
                          value={String(newRisk.impact || 3)}
                          onValueChange={(v) => setNewRisk(prev => ({ ...prev, impact: parseInt(v) as 1|2|3|4|5 }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map(n => (
                              <SelectItem key={n} value={String(n)}>{IMPACT_LABELS[n]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select 
                          value={newRisk.status || 'open'}
                          onValueChange={(v) => setNewRisk(prev => ({ ...prev, status: v as WBSRisk['status'] }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="mitigated">Mitigated</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-center">
                      Risk Score: <span className="font-bold">{(newRisk.probability || 3) * (newRisk.impact || 3)}</span>
                      <span className="text-gray-500 ml-2">(Probability × Impact)</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Mitigation Strategy</Label>
                      <Textarea 
                        value={newRisk.mitigation || ''}
                        onChange={(e) => setNewRisk(prev => ({ ...prev, mitigation: e.target.value }))}
                        rows={2}
                        placeholder="How will you mitigate this risk?"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddRisk(false)}>Cancel</Button>
                    <Button onClick={handleAddRisk} disabled={!newRisk.description}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Risk
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            
            {/* DEPENDENCIES TAB */}
            <TabsContent value="dependencies" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-900">Dependencies</h4>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Dependency
                </Button>
              </div>
              
              {element.dependencies.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No dependencies defined</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {element.dependencies.map(dep => (
                    <div 
                      key={dep.id}
                      className="flex items-center justify-between border border-gray-100 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">{dep.predecessorWbsNumber}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{element.wbsNumber}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {DEPENDENCY_TYPE_LABELS[dep.type].label}
                        </Badge>
                        {dep.lagDays !== 0 && (
                          <span className="text-xs text-gray-500">
                            {dep.lagDays > 0 ? `+${dep.lagDays}` : dep.lagDays}d
                          </span>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Charge Code Picker Dialog */}
      <Dialog open={showChargeCodePicker} onOpenChange={setShowChargeCodePicker}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Charge Code</DialogTitle>
            <DialogDescription>
              Choose a historical project to reference for this estimate
            </DialogDescription>
          </DialogHeader>
          <ChargeCodeLibrary 
            chargeCodes={chargeCodes}
            onSelect={handleSelectChargeCode}
            onAdd={onAddChargeCode}
            onUpdate={onUpdateChargeCode}
            onDelete={onDeleteChargeCode}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

// ============================================================================
// MAIN ESTIMATE TAB COMPONENT
// ============================================================================

export function EstimateTab() {
  // Mock context data
  const [selectedRoles] = useState<SelectedRole[]>([
    { id: '1', name: 'Delivery Manager', category: 'Management', baseRate: 180 },
    { id: '2', name: 'Product Manager', category: 'Management', baseRate: 165 },
    { id: '3', name: 'Design Lead', category: 'Design', baseRate: 150 },
    { id: '4', name: 'Frontend Engineer', category: 'Engineering', baseRate: 145 },
    { id: '5', name: 'Backend Engineer', category: 'Engineering', baseRate: 145 },
    { id: '6', name: 'DevOps Engineer', category: 'Engineering', baseRate: 155 },
    { id: '7', name: 'QA Engineer', category: 'Engineering', baseRate: 125 },
  ])
  
  const [solicitation] = useState<Solicitation>({
    title: 'CAMP Scheduling System',
    periodOfPerformance: { baseYear: true, optionYears: 4, startDate: '2025-01-01' },
  })
  
  const [settings] = useState<Settings>({ uiBillableHours: 1808 })
  
  const [chargeCodes, setChargeCodes] = useState<ChargeCode[]>(MOCK_CHARGE_CODES)
  
  // Charge code handlers
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
  
  // Requirements state
  const [requirements, setRequirements] = useState<SOORequirement[]>(MOCK_REQUIREMENTS)
  
  // Auto-link requirements to WBS elements based on sowReference on mount
  useEffect(() => {
    // Only run once on mount
    setRequirements(prev => prev.map(req => {
      // Match requirements to WBS elements based on referenceNumber containing the SOW section
      const matchingWbs = wbsElements.filter(wbs => {
        if (!wbs.sowReference) return false
        // Extract the section number (e.g., "3.1.1" from "SOO 3.1.1")
        const wbsSection = wbs.sowReference.replace(/^(SOO|PWS|SOW)\s*/i, '')
        // Check if the requirement reference contains this section
        return req.referenceNumber.includes(wbsSection)
      })
      return {
        ...req,
        linkedWbsIds: matchingWbs.map(w => w.id)
      }
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount
  
  // Requirement handlers
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
  
  const contractPeriods = useMemo(() => {
    const periods: { key: PeriodKey; label: string }[] = []
    if (solicitation.periodOfPerformance.baseYear) {
      periods.push({ key: 'base', label: 'Base' })
    }
    for (let i = 1; i <= solicitation.periodOfPerformance.optionYears; i++) {
      periods.push({ key: `option${i}` as PeriodKey, label: `Opt ${i}` })
    }
    return periods
  }, [solicitation.periodOfPerformance])
  
  // State
  const [activeSection, setActiveSection] = useState('wbs')
  const [wbsElements, setWbsElements] = useState<EnhancedWBSElement[]>(() => 
    generateMockWBSElements(selectedRoles, solicitation)
  )
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGrade, setFilterGrade] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('wbs')
  
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
  
  // Handler to add new WBS element
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
    
    // Calculate quality score
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
    // Open the new element for editing
    setSelectedElementId(element.id)
  }
  
  // Computed
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
  
  // Handlers
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
  
  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header - matches Roles & Pricing pattern */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">Estimate</h1>
            <Badge variant="outline" className="text-xs">
              {wbsElements.length} WBS
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Stats Summary - compact horizontal bar */}
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
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {filteredElements.map(element => (
                    <WBSCard
                      key={element.id}
                      element={element}
                      onClick={() => setSelectedElementId(element.id)}
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
                    <div className="w-8"></div>
                  </div>
                  {filteredElements.map(element => (
                    <WBSListItem
                      key={element.id}
                      element={element}
                      onClick={() => setSelectedElementId(element.id)}
                      onDelete={() => handleDeleteElement(element.id)}
                    />
                  ))}
                </div>
              ) : (
                <WBSTableView
                  elements={filteredElements}
                  onElementClick={setSelectedElementId}
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
            onAddChargeCode={handleAddChargeCode}
            onUpdateChargeCode={handleUpdateChargeCode}
            onDeleteChargeCode={handleDeleteChargeCode}
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date"
                    value={newElement.periodOfPerformance?.startDate || ''}
                    onChange={(e) => setNewElement(prev => ({ 
                      ...prev, 
                      periodOfPerformance: { 
                        ...prev.periodOfPerformance!, 
                        startDate: e.target.value 
                      } 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input 
                    type="date"
                    value={newElement.periodOfPerformance?.endDate || ''}
                    onChange={(e) => setNewElement(prev => ({ 
                      ...prev, 
                      periodOfPerformance: { 
                        ...prev.periodOfPerformance!, 
                        endDate: e.target.value 
                      } 
                    }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Why (Purpose)</Label>
                <Textarea 
                  value={newElement.why || ''}
                  onChange={(e) => setNewElement(prev => ({ ...prev, why: e.target.value }))}
                  rows={2}
                  placeholder="Why is this work necessary? What problem does it solve?"
                />
              </div>
              
              <div className="space-y-2">
                <Label>What (Deliverables)</Label>
                <Textarea 
                  value={newElement.what || ''}
                  onChange={(e) => setNewElement(prev => ({ ...prev, what: e.target.value }))}
                  rows={2}
                  placeholder="What will be delivered? Be specific about outputs."
                />
              </div>
              
              <div className="space-y-2">
                <Label>Not Included (Exclusions)</Label>
                <Textarea 
                  value={newElement.notIncluded || ''}
                  onChange={(e) => setNewElement(prev => ({ ...prev, notIncluded: e.target.value }))}
                  rows={2}
                  placeholder="What is explicitly out of scope?"
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
      </div>
    </TooltipProvider>
  )
}