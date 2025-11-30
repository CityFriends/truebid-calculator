'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAppContext } from '@/contexts/app-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  Clock,
  Users,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  Search,
  Info,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  Layers,
  X,
  Calculator,
  BookOpen,
  Link2,
  Crown,
  History,
  Scale,
  FileCheck,
  Target,
  Lightbulb,
  Check,
  CircleDot
} from 'lucide-react'

// ==================== TYPES ====================

// Estimate method types based on BOE document hierarchy (page 21)
type EstimateMethod = 
  | 'historical'      // Best - Historical Program Data with charge numbers
  | 'parametric'      // Good - Productivity/parametric data
  | 'firm-quote'      // Good - Subcontractor quote
  | 'level-of-effort' // Acceptable - LOE (should be <15-20% of project)
  | 'engineering'     // Least desired - WAG warning

// Quality grade based on government color coding (page 11)
type QualityGrade = 'blue' | 'green' | 'yellow' | 'red'

interface LaborEstimate {
  id: string
  roleId: string
  roleName: string
  baseHours: number
  complexityFactor: number
  calculatedHours: number
  rationale: string
}

interface HistoricalReference {
  programName: string
  chargeNumber: string
  actualHours: number
  taskDescription: string
}

interface WBSElement {
  id: string
  wbsNumber: string                    // e.g., "1.2.3"
  title: string
  
  // 1. Header Information
  sowReference: string                 // PWS/SOW paragraph reference
  clin?: string                        // Contract Line Item Number
  periodOfPerformance: {
    start: string                      // ISO date
    end: string
  }
  
  // 2. Task Description
  why: string                          // Why is this task being done?
  what: string                         // What will be done?
  notIncluded: string                  // Scope exclusions
  assumptions: string[]
  dependencies: string[]
  
  // 3. Basis of Estimate
  estimateMethod: EstimateMethod
  historicalReference?: HistoricalReference
  complexityFactor: number             // 1.0 = same, 1.2 = 20% more complex
  complexityJustification: string
  
  // 4. Bid Detail
  laborEstimates: LaborEstimate[]
  totalHours: number
  
  // Quality tracking
  qualityGrade: QualityGrade
  qualityIssues: string[]
  isComplete: boolean
}

// ==================== CONSTANTS ====================

const ESTIMATE_METHODS: { 
  value: EstimateMethod
  label: string
  description: string
  grade: QualityGrade
  icon: React.ReactNode
}[] = [
  {
    value: 'historical',
    label: 'Historical Program Data',
    description: 'Best method. Compare to similar task on past program with actual hours and charge number.',
    grade: 'green',
    icon: <Crown className="w-4 h-4 text-green-600" />
  },
  {
    value: 'parametric',
    label: 'Parametric/Productivity Data',
    description: 'Good method. Use organizational productivity rates (e.g., hours per requirement, ELOC/hour).',
    grade: 'green',
    icon: <Scale className="w-4 h-4 text-green-600" />
  },
  {
    value: 'firm-quote',
    label: 'Firm Quote',
    description: 'Good method. Subcontractor or vendor quote attached as supporting documentation.',
    grade: 'green',
    icon: <FileCheck className="w-4 h-4 text-green-600" />
  },
  {
    value: 'level-of-effort',
    label: 'Level of Effort (LOE)',
    description: 'Acceptable but use sparingly. LOE should not exceed 15-20% of project value.',
    grade: 'yellow',
    icon: <Clock className="w-4 h-4 text-yellow-600" />
  },
  {
    value: 'engineering',
    label: 'Engineering Estimate',
    description: 'Least preferred. Only when historical data unavailable. Requires detailed step-by-step breakdown.',
    grade: 'red',
    icon: <AlertTriangle className="w-4 h-4 text-red-600" />
  }
]

const QUALITY_GRADE_CONFIG: Record<QualityGrade, {
  label: string
  description: string
  bgColor: string
  textColor: string
  borderColor: string
  icon: React.ReactNode
}> = {
  blue: {
    label: 'Excellent',
    description: 'Multiple historical sources with detailed analysis',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: <Crown className="w-4 h-4" />
  },
  green: {
    label: 'Good',
    description: 'Historical data with justified scaling factors',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: <CheckCircle2 className="w-4 h-4" />
  },
  yellow: {
    label: 'Needs Work',
    description: 'Experience referenced but missing detail',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    icon: <AlertTriangle className="w-4 h-4" />
  },
  red: {
    label: 'Unsupported',
    description: 'Engineering judgment without substantive data',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: <AlertCircle className="w-4 h-4" />
  }
}

// ==================== ACRONYM TOOLTIPS ====================

const ACRONYMS: Record<string, { full: string; description: string }> = {
  WBS: { full: 'Work Breakdown Structure', description: 'A hierarchical decomposition of the total scope of work' },
  BOE: { full: 'Basis of Estimate', description: 'Documentation explaining how you calculated your costs and hours' },
  PWS: { full: 'Performance Work Statement', description: 'The government document that describes what work needs to be done' },
  SOW: { full: 'Statement of Work', description: 'A detailed description of specific tasks to be performed' },
  SOO: { full: 'Statement of Objectives', description: 'High-level outcomes the government wants, giving flexibility in approach' },
  CLIN: { full: 'Contract Line Item Number', description: 'A unique identifier for each priced item in a contract' },
  LOE: { full: 'Level of Effort', description: 'Work that cannot be measured in terms of discrete accomplishments' },
  DCAA: { full: 'Defense Contract Audit Agency', description: 'The agency that audits government contractor costs' },
  FAR: { full: 'Federal Acquisition Regulation', description: 'The rules that govern how the government buys things' },
  PoP: { full: 'Period of Performance', description: 'The timeframe during which work will be performed' }
}

const AcronymTooltip: React.FC<{ term: string; children: React.ReactNode }> = ({ term, children }) => {
  const acronym = ACRONYMS[term]
  if (!acronym) return <>{children}</>
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className="border-b border-dotted border-gray-400 cursor-help"
            tabIndex={0}
            role="term"
            aria-describedby={`acronym-${term}`}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent id={`acronym-${term}`} className="max-w-xs">
          <p className="font-semibold">{acronym.full}</p>
          <p className="text-sm text-gray-600 mt-1">{acronym.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ==================== QUALITY CALCULATOR ====================

interface QualityResult {
  grade: QualityGrade
  score: number
  issues: string[]
}

const calculateQuality = (element: WBSElement): QualityResult => {
  const issues: string[] = []
  let score = 100
  
  // Check header completeness
  if (!element.sowReference) {
    issues.push('Missing SOW/PWS reference')
    score -= 15
  }
  if (!element.periodOfPerformance.start || !element.periodOfPerformance.end) {
    issues.push('Period of performance not defined')
    score -= 10
  }
  
  // Check task description
  if (!element.why || element.why.length < 20) {
    issues.push('Task purpose (WHY) not adequately described')
    score -= 10
  }
  if (!element.what || element.what.length < 20) {
    issues.push('Task scope (WHAT) not adequately described')
    score -= 10
  }
  
  // Check basis of estimate
  if (element.estimateMethod === 'engineering') {
    issues.push('Engineering estimate requires detailed step-by-step breakdown')
    score -= 20
  } else if (element.estimateMethod === 'level-of-effort') {
    issues.push('LOE method - ensure <15-20% of total project value')
    score -= 10
  }
  
  // Check historical reference for historical method
  if (element.estimateMethod === 'historical') {
    if (!element.historicalReference?.chargeNumber) {
      issues.push('Missing charge number for historical comparison')
      score -= 25
    }
    if (!element.historicalReference?.actualHours) {
      issues.push('Missing actual hours from historical program')
      score -= 15
    }
  }
  
  // Check complexity factor justification
  if (element.complexityFactor !== 1.0 && !element.complexityJustification) {
    issues.push('Complexity factor requires justification')
    score -= 15
  }
  if (element.complexityFactor > 1.5 || element.complexityFactor < 0.5) {
    if (!element.complexityJustification || element.complexityJustification.length < 50) {
      issues.push('Extreme complexity factor (>1.5x or <0.5x) requires strong justification')
      score -= 10
    }
  }
  
  // Check labor estimates
  if (element.laborEstimates.length === 0) {
    issues.push('No labor estimates defined')
    score -= 30
  } else {
    const missingRationale = element.laborEstimates.filter(l => !l.rationale || l.rationale.length < 10)
    if (missingRationale.length > 0) {
      issues.push(`${missingRationale.length} labor estimate(s) missing rationale`)
      score -= 10
    }
  }
  
  // Check math
  const calculatedTotal = element.laborEstimates.reduce((sum, l) => sum + l.calculatedHours, 0)
  if (Math.abs(calculatedTotal - element.totalHours) > 0.5) {
    issues.push('Hours summary does not match labor detail calculations')
    score -= 20
  }
  
  // Determine grade
  let grade: QualityGrade
  if (score >= 90 && element.estimateMethod === 'historical' && element.historicalReference?.chargeNumber) {
    grade = 'blue'
  } else if (score >= 75) {
    grade = 'green'
  } else if (score >= 50) {
    grade = 'yellow'
  } else {
    grade = 'red'
  }
  
  return { grade, score: Math.max(0, score), issues }
}

// ==================== CAMP BOE DATA ====================
// Real CAMP solicitation data for 19AQMM25Q0273
// Base Year: 14.5 FTE × 1,920 hrs = 27,840 total hours

const generateId = () => `wbs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const campWBSElements: WBSElement[] = [
  // ==================== 1.0 PROGRAM MANAGEMENT ====================
  {
    id: 'wbs-1-1',
    wbsNumber: '1.1',
    title: 'Program Management & Agile Delivery',
    sowReference: 'SOO Section 3.1, 4.1; "Agile development process with typical agile ceremonies" (p.9)',
    clin: '0001',
    periodOfPerformance: { start: '2025-01-01', end: '2025-12-31' },
    why: 'Provide continuous program oversight to ensure on-time, on-budget delivery of CAMP capabilities while maintaining alignment with CA stakeholder priorities and federal compliance requirements.',
    what: 'Sprint planning, daily standups, sprint reviews, retrospectives across 26 two-week sprints. Weekly status meetings with federal Product Owner. Monthly Contract Status Reports. Risk identification and mitigation tracking. Resource management including clearance tracking and capacity planning.',
    notIncluded: 'Government contracting officer responsibilities. Procurement of additional resources beyond approved team. Policy decisions requiring federal authority.',
    assumptions: [
      'Federal Product Owner available for weekly sync meetings',
      'Access to incumbent documentation within 30 days of contract start',
      'Stable team composition throughout base year',
    ],
    dependencies: ['Government-furnished equipment and badge access', 'BESPIN environment access credentials'],
    estimateMethod: 'historical',
    historicalReference: {
      programName: 'USCIS MyAccount Modernization',
      chargeNumber: 'USCIS-2024-PM-0342',
      actualHours: 580,
      taskDescription: 'Program management for 12-person agile team, 24 sprints, similar federal HCD contract',
    },
    complexityFactor: 1.03,
    complexityJustification: 'Slightly higher complexity due to global stakeholder coordination across 300+ posts and multiple time zones. USCIS was primarily domestic.',
    laborEstimates: [
      { id: 'le-1-1-dm', roleId: 'dm', roleName: 'Delivery Manager', baseHours: 580, complexityFactor: 1.03, calculatedHours: 597, rationale: 'Based on USCIS-2024-PM-0342 actual hours (580) with 3% complexity adjustment for global coordination' },
    ],
    totalHours: 597,
    qualityGrade: 'green',
    qualityIssues: [],
    isComplete: true,
  },
  {
    id: 'wbs-1-2',
    wbsNumber: '1.2',
    title: 'Transition-In & Knowledge Transfer',
    sowReference: 'SOO Section 6.1; "Transition-In Plan" deliverable (p.21)',
    clin: '0001',
    periodOfPerformance: { start: '2025-01-01', end: '2025-03-31' },
    why: 'Enable seamless takeover from incumbent contractor while minimizing disruption to ongoing CAMP operations and maintaining continuity of service for 300+ consular posts.',
    what: 'Review incumbent documentation and codebase. Shadow incumbent team during overlap period. Document tribal knowledge and undocumented processes. Obtain environment access and credentials. Complete security onboarding. Establish communication channels with CA stakeholders.',
    notIncluded: 'Remediation of incumbent technical debt (separate WBS). Re-architecture decisions (addressed in technical planning).',
    assumptions: ['30-day overlap period with incumbent team', 'Incumbent provides complete system documentation', 'All team members have Secret clearance at contract start'],
    dependencies: ['Incumbent cooperation per transition clause', 'Government-facilitated introductions to key stakeholders'],
    estimateMethod: 'historical',
    historicalReference: {
      programName: 'DOS Travel Portal Transition',
      chargeNumber: 'DOS-TP-2023-TRANS-088',
      actualHours: 420,
      taskDescription: 'Transition-in for DOS cloud application, similar team size and tech stack',
    },
    complexityFactor: 1.15,
    complexityJustification: '15% increase due to three legacy systems to understand (vs. single system in reference) and globally distributed post configurations.',
    laborEstimates: [
      { id: 'le-1-2-dm', roleId: 'dm', roleName: 'Delivery Manager', baseHours: 175, complexityFactor: 1.15, calculatedHours: 201, rationale: 'Coordinate transition activities, establish stakeholder relationships, oversee knowledge capture' },
      { id: 'le-1-2-tl', roleId: 'tl', roleName: 'Technical Lead', baseHours: 130, complexityFactor: 1.15, calculatedHours: 150, rationale: 'Architecture review, codebase assessment, environment access, BESPIN coordination' },
      { id: 'le-1-2-sme', roleId: 'sme', roleName: 'DoS Subject Matter Expert', baseHours: 65, complexityFactor: 1.15, calculatedHours: 75, rationale: 'Capture consular process knowledge, post-specific configurations, policy context' },
      { id: 'le-1-2-sd', roleId: 'sd', roleName: 'Service Designer', baseHours: 52, complexityFactor: 1.15, calculatedHours: 60, rationale: 'Document current service blueprints for three legacy scheduling systems' },
    ],
    totalHours: 486,
    qualityGrade: 'green',
    qualityIssues: [],
    isComplete: true,
  },
  {
    id: 'wbs-1-3',
    wbsNumber: '1.3',
    title: 'Stakeholder Coordination & Communication',
    sowReference: 'SOO Section 3.1.2; "Work in conjunction with federal Product Owner and CA team" (p.7)',
    clin: '0001',
    periodOfPerformance: { start: '2025-01-01', end: '2025-12-31' },
    why: 'Maintain strong alignment with CA leadership, federal Product Owner, and key stakeholders across 300+ posts to ensure CAMP development priorities reflect operational needs and strategic direction.',
    what: 'Conduct weekly PO sync meetings. Facilitate stakeholder demos each sprint. Prepare and deliver monthly status reports. Coordinate with CA communications for announcements. Support executive briefings as needed. Manage stakeholder feedback channels.',
    notIncluded: 'Government decision-making. Policy communications (CA responsibility). Congressional briefings.',
    assumptions: ['PO available for weekly meetings', 'Stakeholder contact list provided', 'Video conferencing tools available'],
    dependencies: ['PO calendar availability', 'Stakeholder access'],
    estimateMethod: 'level-of-effort',
    complexityFactor: 1.0,
    complexityJustification: 'Ongoing coordination distributed across 26 sprints.',
    laborEstimates: [
      { id: 'le-1-3-dm', roleId: 'dm', roleName: 'Delivery Manager', baseHours: 800, complexityFactor: 1.0, calculatedHours: 800, rationale: 'Weekly PO meetings (260 hrs), monthly reports (200 hrs), stakeholder coordination (340 hrs). ~31 hrs/sprint.' },
      { id: 'le-1-3-pm', roleId: 'pm', roleName: 'Product Manager', baseHours: 200, complexityFactor: 1.0, calculatedHours: 200, rationale: 'PO sync support, demo preparation, requirements communication. ~8 hrs/sprint.' },
    ],
    totalHours: 1000,
    qualityGrade: 'yellow',
    qualityIssues: ['LOE method - ensure <15-20% of total project value'],
    isComplete: true,
  },

  // ==================== 2.0 PUBLIC SCHEDULING PORTAL ====================
  {
    id: 'wbs-2-1',
    wbsNumber: '2.1',
    title: 'Public Appointment Booking Flow',
    sowReference: 'SOO Section 3.2.1; "Public customers are able to schedule an appointment in less than five minutes" (p.6); "Enhancing the customer experience for ACS scheduling" (p.5)',
    clin: '0001',
    periodOfPerformance: { start: '2025-01-01', end: '2025-12-31' },
    why: 'Deliver a streamlined, accessible appointment booking experience that enables citizens abroad to schedule consular appointments in under 5 minutes, meeting the SOO performance requirement while supporting multiple languages and accessibility standards.',
    what: 'Design and develop complete public-facing booking flow including: appointment type selection, post/location search, date/time slot selection, applicant information collection, fee payment via Pay.gov integration, confirmation and calendar integration. Support Spanish and additional languages per post requirements. Ensure 100% Section 508 compliance and 5th grade reading level.',
    notIncluded: 'NIV (visa) scheduling functionality (future scope). Crisis management scheduling (separate WBS). Backend appointment availability algorithms (separate WBS).',
    assumptions: ['MVP public booking flow exists and is functional', 'Pay.gov integration patterns established by incumbent', 'Post-specific configurations documented'],
    dependencies: ['Scheduling API availability (WBS 3.1)', 'Pay.gov sandbox access for testing', 'USWDS design system components'],
    estimateMethod: 'parametric',
    historicalReference: {
      programName: 'FFTC Internal Productivity Data',
      chargeNumber: 'FFTC-PROD-2024-UI',
      actualHours: 40,
      taskDescription: 'Average 40 hours per major user flow for React/USWDS federal applications based on 12 past projects',
    },
    complexityFactor: 1.2,
    complexityJustification: '20% increase for i18n requirements (multi-language), strict 508 compliance with screen reader testing, and 5-minute completion SLA requiring performance optimization.',
    laborEstimates: [
      { id: 'le-2-1-pd', roleId: 'pd', roleName: 'Product Designer', baseHours: 333, complexityFactor: 1.2, calculatedHours: 400, rationale: '8 major screens × 40 hrs/screen base = 320 hrs. 1.2x for i18n mockups and 508 annotation.' },
      { id: 'le-2-1-uxr', roleId: 'uxr', roleName: 'UX Researcher', baseHours: 250, complexityFactor: 1.2, calculatedHours: 300, rationale: 'Usability testing across 6 sprints (50 hrs/sprint). Includes diverse user recruitment globally and accessibility testing.' },
      { id: 'le-2-1-fe', roleId: 'fe', roleName: 'Frontend Engineer', baseHours: 583, complexityFactor: 1.2, calculatedHours: 700, rationale: 'React implementation of 8 flows at 60 hrs/flow base = 480 hrs. 1.2x for i18n, RTL support, 508 compliance.' },
      { id: 'le-2-1-qa', roleId: 'qa', roleName: 'QA Engineer', baseHours: 167, complexityFactor: 1.2, calculatedHours: 200, rationale: 'Functional testing, cross-browser, mobile, 508 automated + manual, multi-language verification.' },
    ],
    totalHours: 1600,
    qualityGrade: 'green',
    qualityIssues: [],
    isComplete: true,
  },
  {
    id: 'wbs-2-2',
    wbsNumber: '2.2',
    title: 'Post Configuration & Customization',
    sowReference: 'SOO Section 3.2.4; "Post to configure various aspects of the system" (p.7); "Post specific needs will be identified during discovery" (p.7)',
    clin: '0001',
    periodOfPerformance: { start: '2025-04-01', end: '2025-12-31' },
    why: 'Enable posts to customize CAMP for their specific operational needs including appointment types, service windows, officer assignments, and local business rules while maintaining platform consistency.',
    what: 'Design post configuration interface. Implement appointment type customization. Support service window configuration. Enable officer/resource assignment. Implement local business rules engine. Provide configuration validation and preview.',
    notIncluded: 'Per-post custom development. Integration with post-specific systems. Policy definition (CA responsibility).',
    assumptions: ['Configuration requirements gathered from pilot posts', 'Standard configuration patterns identified', 'Reasonable configuration complexity'],
    dependencies: ['Post requirements from rollout planning', 'Admin portal foundation (WBS 3.1)'],
    estimateMethod: 'parametric',
    historicalReference: {
      programName: 'FFTC Configuration Module Data',
      chargeNumber: 'FFTC-PROD-2024-CONFIG',
      actualHours: 60,
      taskDescription: 'Average 60 hours per configuration module for federal multi-tenant SaaS',
    },
    complexityFactor: 1.2,
    complexityJustification: '20% increase for post-specific validation rules and preview functionality requirements.',
    laborEstimates: [
      { id: 'le-2-2-pm', roleId: 'pm', roleName: 'Product Manager', baseHours: 83, complexityFactor: 1.2, calculatedHours: 100, rationale: 'Configuration requirements definition from 50+ posts.' },
      { id: 'le-2-2-pd', roleId: 'pd', roleName: 'Product Designer', baseHours: 167, complexityFactor: 1.2, calculatedHours: 200, rationale: 'Configuration UI design (5 config modules × 40 hrs base).' },
      { id: 'le-2-2-fe', roleId: 'fe', roleName: 'Frontend Engineer', baseHours: 333, complexityFactor: 1.2, calculatedHours: 400, rationale: 'Configuration forms, validation UI, preview functionality.' },
      { id: 'le-2-2-be', roleId: 'be', roleName: 'Backend Engineer', baseHours: 250, complexityFactor: 1.2, calculatedHours: 300, rationale: 'Configuration API, rules engine, validation logic.' },
      { id: 'le-2-2-sme', roleId: 'sme', roleName: 'DoS Subject Matter Expert', baseHours: 167, complexityFactor: 1.2, calculatedHours: 200, rationale: 'Post-specific business rules, configuration validation.' },
      { id: 'le-2-2-qa', roleId: 'qa', roleName: 'QA Engineer', baseHours: 83, complexityFactor: 1.2, calculatedHours: 100, rationale: 'Configuration testing, validation verification.' },
    ],
    totalHours: 1300,
    qualityGrade: 'green',
    qualityIssues: [],
    isComplete: true,
  },

  // ==================== 3.0 ADMIN PORTAL ====================
  {
    id: 'wbs-3-1',
    wbsNumber: '3.1',
    title: 'Admin Calendar & Capacity Management',
    sowReference: 'SOO Section 3.2.2; "Visually allocate appointment categories slots to timeslots on a calendar view" (p.15); "Efficiently open up and manage appointment slots" (p.6)',
    clin: '0001',
    periodOfPerformance: { start: '2025-01-01', end: '2025-12-31' },
    why: 'Enable consular staff to efficiently manage appointment capacity across multiple service types, windows, and officers, reducing administrative burden and ensuring optimal resource utilization at 300+ posts worldwide.',
    what: 'Design and develop admin calendar interface with: visual slot allocation by appointment type, bulk operations for opening/closing slots, recurring schedule templates, officer/window assignment, capacity analytics dashboard, real-time availability updates. Support LE staff and cleared American user roles with appropriate permissions.',
    notIncluded: 'Reports dashboard (separate WBS). Post configuration wizard (separate WBS). Fraud detection views (separate WBS).',
    assumptions: ['Admin portal MVP exists with basic calendar functionality', 'OKTA SSO integration established', 'Post-specific business rules documented'],
    dependencies: ['Admin API endpoints (WBS 3.2)', 'OKTA authentication configuration', 'BESPIN hosting environment'],
    estimateMethod: 'historical',
    historicalReference: {
      programName: 'VA Appointment Scheduling Admin',
      chargeNumber: 'VA-SCHED-2023-ADMIN-156',
      actualHours: 1800,
      taskDescription: 'Admin calendar and capacity management for VA healthcare scheduling, similar complexity',
    },
    complexityFactor: 1.1,
    complexityJustification: '10% increase for multi-post configuration complexity (300+ posts with varying rules vs. VA regional model).',
    laborEstimates: [
      { id: 'le-3-1-pm', roleId: 'pm', roleName: 'Product Manager', baseHours: 182, complexityFactor: 1.1, calculatedHours: 200, rationale: 'Requirements definition, stakeholder alignment, acceptance criteria.' },
      { id: 'le-3-1-pd', roleId: 'pd', roleName: 'Product Designer', baseHours: 364, complexityFactor: 1.1, calculatedHours: 400, rationale: 'Calendar UI (most complex component), bulk operations, template management.' },
      { id: 'le-3-1-fe', roleId: 'fe', roleName: 'Frontend Engineer', baseHours: 636, complexityFactor: 1.1, calculatedHours: 700, rationale: 'Complex calendar with drag-drop, bulk selection, real-time updates.' },
      { id: 'le-3-1-be', roleId: 'be', roleName: 'Backend Engineer', baseHours: 545, complexityFactor: 1.1, calculatedHours: 600, rationale: 'Admin API endpoints, bulk operations, template engine, permissions.' },
      { id: 'le-3-1-qa', roleId: 'qa', roleName: 'QA Engineer', baseHours: 182, complexityFactor: 1.1, calculatedHours: 200, rationale: 'Complex interaction testing, permission validation, calendar edge cases.' },
    ],
    totalHours: 2100,
    qualityGrade: 'green',
    qualityIssues: [],
    isComplete: true,
  },
  {
    id: 'wbs-3-2',
    wbsNumber: '3.2',
    title: 'Reports Dashboard & Analytics',
    sowReference: 'SOO Section 3.2.3; "View a reports dashboard...appointment metrics worldwide" (p.7); "Analyze appointment allocations and demand" (p.6)',
    clin: '0001',
    periodOfPerformance: { start: '2025-04-01', end: '2025-12-31' },
    why: 'Provide CA leadership and post managers with actionable insights into appointment utilization, demand patterns, and service metrics to optimize resource allocation.',
    what: 'Design and develop analytics dashboard with: global appointment metrics, post-level drill-downs, demand forecasting, utilization reports, export functionality.',
    notIncluded: 'Data warehouse infrastructure (BESPIN provided). BI tool licensing. Financial reporting.',
    assumptions: ['Analytics requirements defined by CA', 'Data aggregation patterns established', 'Reasonable data volumes'],
    dependencies: ['Scheduling API data availability', 'BESPIN data services'],
    estimateMethod: 'parametric',
    historicalReference: {
      programName: 'FFTC Dashboard Productivity',
      chargeNumber: 'FFTC-PROD-2024-DASH',
      actualHours: 80,
      taskDescription: 'Average 80 hours per dashboard view for federal data visualization',
    },
    complexityFactor: 1.15,
    complexityJustification: '15% increase for global data aggregation complexity and multi-level drill-down.',
    laborEstimates: [
      { id: 'le-3-2-pd', roleId: 'pd', roleName: 'Product Designer', baseHours: 174, complexityFactor: 1.15, calculatedHours: 200, rationale: '5 dashboard views × 35 hrs/view design.' },
      { id: 'le-3-2-fe', roleId: 'fe', roleName: 'Frontend Engineer', baseHours: 348, complexityFactor: 1.15, calculatedHours: 400, rationale: 'Chart components, data tables, filters, drill-downs, exports.' },
      { id: 'le-3-2-be', roleId: 'be', roleName: 'Backend Engineer', baseHours: 261, complexityFactor: 1.15, calculatedHours: 300, rationale: 'Data aggregation APIs, report generation, caching.' },
      { id: 'le-3-2-qa', roleId: 'qa', roleName: 'QA Engineer', baseHours: 87, complexityFactor: 1.15, calculatedHours: 100, rationale: 'Data accuracy validation, visualization testing.' },
    ],
    totalHours: 1000,
    qualityGrade: 'green',
    qualityIssues: [],
    isComplete: true,
  },

  // ==================== 4.0 INTEGRATIONS ====================
  {
    id: 'wbs-4-1',
    wbsNumber: '4.1',
    title: 'Pay.gov Payment Integration',
    sowReference: 'SOO Section 3.3.1; "Pay any fees via Pay.gov" (p.7)',
    clin: '0001',
    periodOfPerformance: { start: '2025-03-01', end: '2025-09-30' },
    why: 'Enable secure fee collection for consular appointments through the government-mandated Pay.gov payment gateway.',
    what: 'Integrate Pay.gov hosted payment pages. Handle payment callbacks. Support refunds. Implement payment tracking and reconciliation. Handle failures gracefully.',
    notIncluded: 'Fee structure changes (government policy). Alternative payment methods. Financial reporting.',
    assumptions: ['Pay.gov API access provided', 'Fee schedules provided by CA', 'Incumbent patterns documented'],
    dependencies: ['Pay.gov agency enrollment', 'Treasury sandbox environment'],
    estimateMethod: 'historical',
    historicalReference: {
      programName: 'USCIS Online Payment Integration',
      chargeNumber: 'USCIS-2023-PAY-067',
      actualHours: 280,
      taskDescription: 'Pay.gov integration for USCIS form filing payments, similar flow',
    },
    complexityFactor: 1.0,
    complexityJustification: 'Standard Pay.gov integration pattern matches reference implementation.',
    laborEstimates: [
      { id: 'le-4-1-be', roleId: 'be', roleName: 'Backend Engineer', baseHours: 200, complexityFactor: 1.0, calculatedHours: 200, rationale: 'API integration, callback handling, status tracking, refund logic.' },
      { id: 'le-4-1-fe', roleId: 'fe', roleName: 'Frontend Engineer', baseHours: 50, complexityFactor: 1.0, calculatedHours: 50, rationale: 'Payment UI flow, redirect handling, confirmation display.' },
      { id: 'le-4-1-qa', roleId: 'qa', roleName: 'QA Engineer', baseHours: 30, complexityFactor: 1.0, calculatedHours: 30, rationale: 'Payment flow testing, sandbox validation.' },
    ],
    totalHours: 280,
    qualityGrade: 'blue',
    qualityIssues: [],
    isComplete: true,
  },
  {
    id: 'wbs-4-2',
    wbsNumber: '4.2',
    title: 'DS-160/CEAC Validation Integration',
    sowReference: 'SOO Section 3.3.2; "Validate an applicant has a valid DS-160" (p.15); "Integration with eCRBA" (p.15)',
    clin: '0001',
    periodOfPerformance: { start: '2025-04-01', end: '2025-10-31' },
    why: 'Validate applicant eligibility during booking by verifying DS-160 application status through CEAC integration.',
    what: 'Implement barcode scanning/entry for DS-160 confirmation. Call CEAC validation API. Handle responses. Support eCRBA integration. Cache results.',
    notIncluded: 'DS-160 form processing. CEAC system maintenance. Visa adjudication logic.',
    assumptions: ['CEAC API specs documented', 'eCRBA API access approved', 'Incumbent patterns available'],
    dependencies: ['CEAC system availability', 'eCRBA API credentials'],
    estimateMethod: 'historical',
    historicalReference: {
      programName: 'DOS Visa Status Check',
      chargeNumber: 'DOS-VISA-2022-INT-034',
      actualHours: 350,
      taskDescription: 'CEAC integration for visa status verification',
    },
    complexityFactor: 1.15,
    complexityJustification: '15% increase for dual integration (CEAC + eCRBA) vs. single system in reference.',
    laborEstimates: [
      { id: 'le-4-2-be', roleId: 'be', roleName: 'Backend Engineer', baseHours: 261, complexityFactor: 1.15, calculatedHours: 300, rationale: 'CEAC + eCRBA API integration, validation logic, caching.' },
      { id: 'le-4-2-fe', roleId: 'fe', roleName: 'Frontend Engineer', baseHours: 70, complexityFactor: 1.15, calculatedHours: 80, rationale: 'Barcode input UI, validation status display.' },
      { id: 'le-4-2-qa', roleId: 'qa', roleName: 'QA Engineer', baseHours: 35, complexityFactor: 1.15, calculatedHours: 40, rationale: 'Integration testing, validation scenarios.' },
    ],
    totalHours: 420,
    qualityGrade: 'green',
    qualityIssues: [],
    isComplete: true,
  },
  {
    id: 'wbs-4-3',
    wbsNumber: '4.3',
    title: 'Email Notification System',
    sowReference: 'SOO Section 3.3.3; "Emailing appointment confirmations" (p.15)',
    clin: '0001',
    periodOfPerformance: { start: '2025-03-01', end: '2025-08-31' },
    why: 'Ensure applicants receive timely appointment confirmations, reminders, and status updates via email.',
    what: 'Implement SES email integration. Design templates for: confirmation, reminder, cancellation, rescheduling, payment receipt. Support multi-language. Implement delivery tracking.',
    notIncluded: 'SMS notifications (future). Marketing communications.',
    assumptions: ['SES configured for State domain', 'Templates approved by CA', 'Multi-language content provided'],
    dependencies: ['SES domain verification', 'Email content approval'],
    estimateMethod: 'historical',
    historicalReference: {
      programName: 'USCIS Email Notifications',
      chargeNumber: 'USCIS-2023-EMAIL-045',
      actualHours: 280,
      taskDescription: 'Transactional email system for USCIS case notifications',
    },
    complexityFactor: 1.1,
    complexityJustification: '10% increase for multi-language template requirements.',
    laborEstimates: [
      { id: 'le-4-3-be', roleId: 'be', roleName: 'Backend Engineer', baseHours: 227, complexityFactor: 1.1, calculatedHours: 250, rationale: 'SES integration, template engine, delivery tracking.' },
      { id: 'le-4-3-pd', roleId: 'pd', roleName: 'Product Designer', baseHours: 91, complexityFactor: 1.1, calculatedHours: 100, rationale: 'Email template design (5 templates), responsive.' },
      { id: 'le-4-3-qa', roleId: 'qa', roleName: 'QA Engineer', baseHours: 45, complexityFactor: 1.1, calculatedHours: 50, rationale: 'Email delivery testing, multi-language verification.' },
    ],
    totalHours: 400,
    qualityGrade: 'green',
    qualityIssues: [],
    isComplete: true,
  },

  // ==================== 5.0 INFRASTRUCTURE ====================
  {
    id: 'wbs-5-1',
    wbsNumber: '5.1',
    title: 'BESPIN Platform Integration & CI/CD',
    sowReference: 'SOO Section 4.2; "Tenant of BESPIN" (p.13); "Drone...GitOps" (p.12); "Deployments to production at least once every sprint" (p.9)',
    clin: '0001',
    periodOfPerformance: { start: '2025-01-01', end: '2025-12-31' },
    why: 'Establish robust CI/CD pipeline on BESPIN platform to enable continuous delivery with automated testing and security scanning.',
    what: 'Configure Drone CI pipelines. Implement GitOps patterns. Set up Terraform IaC. Configure environments (dev, test, staging, prod). Implement security scanning. Set up monitoring/alerting.',
    notIncluded: 'BESPIN platform administration. FedRAMP authorization. Network security configuration.',
    assumptions: ['BESPIN tenant provisioned', 'Existing CI/CD patterns documented', 'Team has BESPIN access'],
    dependencies: ['BESPIN platform access', 'Git repository provisioning'],
    estimateMethod: 'historical',
    historicalReference: {
      programName: 'DOS Cloud Migration DevOps',
      chargeNumber: 'DOS-CLOUD-2023-DEVOPS-112',
      actualHours: 1600,
      taskDescription: 'DevOps setup for DOS cloud application on BESPIN',
    },
    complexityFactor: 0.9,
    complexityJustification: '10% reduction - incumbent patterns available. Enhancement vs. greenfield.',
    laborEstimates: [
      { id: 'le-5-1-devops', roleId: 'devops', roleName: 'DevOps Engineer', baseHours: 1511, complexityFactor: 0.9, calculatedHours: 1360, rationale: 'Pipeline (200), BESPIN coord (200), monitoring (250), IaC (200), deploys (200), security (150), environments (100), ATO (60).' },
      { id: 'le-5-1-tl', roleId: 'tl', roleName: 'Technical Lead', baseHours: 111, complexityFactor: 0.9, calculatedHours: 100, rationale: 'Architecture oversight, BESPIN coordination.' },
    ],
    totalHours: 1460,
    qualityGrade: 'green',
    qualityIssues: [],
    isComplete: true,
  },
  {
    id: 'wbs-5-2',
    wbsNumber: '5.2',
    title: 'Authentication & User Management',
    sowReference: 'SOO Section 4.2.1; "OKTA...Cognito" (p.12)',
    clin: '0001',
    periodOfPerformance: { start: '2025-01-01', end: '2025-06-30' },
    why: 'Provide secure authentication for admin users via OKTA SSO and public users via Cognito.',
    what: 'Maintain OKTA SSO integration. Configure Cognito for public users. Implement RBAC. Support MFA. Implement session management and audit logging.',
    notIncluded: 'PIV/CAC integration (OKTA handled). Identity proofing. Password policy changes.',
    assumptions: ['OKTA tenant configured', 'Cognito user pool provisioned', 'Role definitions approved'],
    dependencies: ['OKTA configuration access', 'Cognito credentials'],
    estimateMethod: 'historical',
    historicalReference: {
      programName: 'DOS Auth Integration',
      chargeNumber: 'DOS-AUTH-2023-OKTA-067',
      actualHours: 350,
      taskDescription: 'OKTA + Cognito dual auth implementation',
    },
    complexityFactor: 0.9,
    complexityJustification: '10% reduction - enhancing existing auth vs. greenfield.',
    laborEstimates: [
      { id: 'le-5-2-be', roleId: 'be', roleName: 'Backend Engineer', baseHours: 222, complexityFactor: 0.9, calculatedHours: 200, rationale: 'Auth integration, RBAC, session management, audit logging.' },
      { id: 'le-5-2-fe', roleId: 'fe', roleName: 'Frontend Engineer', baseHours: 111, complexityFactor: 0.9, calculatedHours: 100, rationale: 'Login flows, session handling, permission-based UI.' },
      { id: 'le-5-2-devops', roleId: 'devops', roleName: 'DevOps Engineer', baseHours: 56, complexityFactor: 0.9, calculatedHours: 50, rationale: 'OKTA/Cognito configuration, secrets management.' },
      { id: 'le-5-2-qa', roleId: 'qa', roleName: 'QA Engineer', baseHours: 56, complexityFactor: 0.9, calculatedHours: 50, rationale: 'Auth flow testing, permission validation.' },
    ],
    totalHours: 400,
    qualityGrade: 'green',
    qualityIssues: [],
    isComplete: true,
  },

  // ==================== 6.0 ROLLOUT & TRAINING ====================
  {
    id: 'wbs-6-1',
    wbsNumber: '6.1',
    title: 'Post Onboarding & Rollout Support',
    sowReference: 'SOO Section 5.1; "Rollout CAMP to posts overseas" (p.11); "Provide onboarding support to posts" (p.11)',
    clin: '0001',
    periodOfPerformance: { start: '2025-04-01', end: '2025-12-31' },
    why: 'Successfully transition 50+ consular posts from legacy systems to CAMP in Base Year with minimal disruption.',
    what: 'Develop post onboarding playbook. Create configuration guides. Conduct virtual onboarding sessions. Provide go-live support. Collect feedback. Track adoption metrics.',
    notIncluded: 'In-person travel (separate ODC). Legacy decommissioning. Post-specific policy changes.',
    assumptions: ['50 posts targeted for Base Year', 'Posts have bandwidth for virtual training', 'Post leadership committed'],
    dependencies: ['Core CAMP functionality stable', 'Training materials complete', 'CA coordination'],
    estimateMethod: 'parametric',
    historicalReference: {
      programName: 'FFTC Rollout Productivity Data',
      chargeNumber: 'FFTC-PROD-2024-ROLL',
      actualHours: 16,
      taskDescription: 'Average 16 hours per site rollout for federal SaaS',
    },
    complexityFactor: 1.25,
    complexityJustification: '25% increase for global distribution, legacy variation, virtual-only delivery.',
    laborEstimates: [
      { id: 'le-6-1-dm', roleId: 'dm', roleName: 'Delivery Manager', baseHours: 240, complexityFactor: 1.25, calculatedHours: 300, rationale: 'Rollout scheduling for 50 posts. 4 hrs/post × 50.' },
      { id: 'le-6-1-sd', roleId: 'sd', roleName: 'Service Designer', baseHours: 240, complexityFactor: 1.25, calculatedHours: 300, rationale: 'Onboarding journey design, post-specific customization.' },
      { id: 'le-6-1-itt', roleId: 'itt', roleName: 'IT Training Specialist', baseHours: 480, complexityFactor: 1.25, calculatedHours: 600, rationale: 'Virtual onboarding for 50 posts. 8 hrs/post.' },
      { id: 'le-6-1-sme', roleId: 'sme', roleName: 'DoS Subject Matter Expert', baseHours: 200, complexityFactor: 1.25, calculatedHours: 250, rationale: 'Post-specific guidance, legacy knowledge, liaison.' },
    ],
    totalHours: 1450,
    qualityGrade: 'green',
    qualityIssues: [],
    isComplete: true,
  },
  {
    id: 'wbs-6-2',
    wbsNumber: '6.2',
    title: 'Training Materials Development',
    sowReference: 'SOO Section 5.2; "Work with Training team to produce training materials (webinars, user guides, etc.)" (p.11)',
    clin: '0001',
    periodOfPerformance: { start: '2025-02-01', end: '2025-08-31' },
    why: 'Create comprehensive training materials that enable self-service learning for 10,000+ users globally.',
    what: 'Develop video tutorials. Create user guides (PDF, web). Build interactive webinars. Design job aids. Implement in-app help. Maintain as features evolve.',
    notIncluded: 'Translation to non-English. LMS platform hosting. Compliance training content.',
    assumptions: ['Government provides LMS access', 'Recording tools available', 'Designs finalized before training'],
    dependencies: ['UX designs complete', 'Staging environment available'],
    estimateMethod: 'parametric',
    historicalReference: {
      programName: 'FFTC Training Development Data',
      chargeNumber: 'FFTC-PROD-2024-TRAIN',
      actualHours: 20,
      taskDescription: 'Average 20 hours per training module',
    },
    complexityFactor: 1.1,
    complexityJustification: '10% increase for 508 compliance and multiple output formats.',
    laborEstimates: [
      { id: 'le-6-2-itt', roleId: 'itt', roleName: 'IT Training Specialist', baseHours: 727, complexityFactor: 1.1, calculatedHours: 800, rationale: '36 modules × 20 hrs/module base.' },
      { id: 'le-6-2-sd', roleId: 'sd', roleName: 'Service Designer', baseHours: 182, complexityFactor: 1.1, calculatedHours: 200, rationale: 'Learning journey design, content structure.' },
      { id: 'le-6-2-pd', roleId: 'pd', roleName: 'Product Designer', baseHours: 91, complexityFactor: 1.1, calculatedHours: 100, rationale: 'Visual design for guides, job aids, video graphics.' },
    ],
    totalHours: 1100,
    qualityGrade: 'green',
    qualityIssues: [],
    isComplete: true,
  },
  {
    id: 'wbs-6-3',
    wbsNumber: '6.3',
    title: 'Tier 2/3 Application Support',
    sowReference: 'SOO Section 5.3; "Tier 2 and 3 will be performed by the contractor" (p.11); "Monitor system, network, application, database logs" (p.11)',
    clin: '0001',
    periodOfPerformance: { start: '2025-01-01', end: '2025-12-31' },
    why: 'Provide responsive technical support for escalated issues beyond Tier 1 help desk.',
    what: 'Respond to Tier 2 escalations. Investigate Tier 3 issues. Monitor logs. Participate in incident response. Document resolutions. Contribute to knowledge base.',
    notIncluded: 'Tier 1 help desk. Infrastructure support (BESPIN). Policy support.',
    assumptions: ['Ticketing system provided', 'Escalation procedures defined', 'Reasonable volume (10-20/week)'],
    dependencies: ['Ticketing system access', 'Log monitoring tools'],
    estimateMethod: 'level-of-effort',
    complexityFactor: 1.0,
    complexityJustification: 'Ongoing support distributed across 26 sprints.',
    laborEstimates: [
      { id: 'le-6-3-tl', roleId: 'tl', roleName: 'Technical Lead', baseHours: 400, complexityFactor: 1.0, calculatedHours: 400, rationale: 'Tier 3 escalation, incident response. ~15 hrs/sprint.' },
      { id: 'le-6-3-be', roleId: 'be', roleName: 'Backend Engineer', baseHours: 600, complexityFactor: 1.0, calculatedHours: 600, rationale: 'Tier 2/3 investigation and resolution. ~23 hrs/sprint.' },
      { id: 'le-6-3-devops', roleId: 'devops', roleName: 'DevOps Engineer', baseHours: 400, complexityFactor: 1.0, calculatedHours: 400, rationale: 'Log monitoring, infra-related support. ~15 hrs/sprint.' },
    ],
    totalHours: 1400,
    qualityGrade: 'yellow',
    qualityIssues: ['LOE method - ensure <15-20% of total project value'],
    isComplete: true,
  },

  // ==================== 7.0 DESIGN & COMPLIANCE ====================
  {
    id: 'wbs-7-1',
    wbsNumber: '7.1',
    title: 'USWDS Design System & Section 508 Compliance',
    sowReference: 'SOO Section 4.3; "CAMP uses a modified version of USWDS" (p.13); "100% Section 508 compliance testing" (p.6)',
    clin: '0001',
    periodOfPerformance: { start: '2025-01-01', end: '2025-12-31' },
    why: 'Maintain and evolve the USWDS-based design system to ensure consistent, accessible user experiences.',
    what: 'Govern USWDS component library. Define accessibility standards (WCAG 2.2 AA). Conduct 508 audits. Ensure plain language (5th grade level). Review designs before development. Verify implementation.',
    notIncluded: 'USWDS core development. Third-party accessibility audits. Assistive technology procurement.',
    assumptions: ['USWDS meets baseline 508', 'Testing tools available', 'Reasonable accessibility foundation'],
    dependencies: ['USWDS version compatibility', 'Accessibility testing tools'],
    estimateMethod: 'level-of-effort',
    complexityFactor: 1.0,
    complexityJustification: 'Ongoing governance across 26 sprints.',
    laborEstimates: [
      { id: 'le-7-1-dl', roleId: 'dl', roleName: 'Design Lead', baseHours: 600, complexityFactor: 1.0, calculatedHours: 600, rationale: 'Design system governance (300), 508 strategy (300). ~23 hrs/sprint.' },
      { id: 'le-7-1-uxr', roleId: 'uxr', roleName: 'UX Researcher', baseHours: 300, complexityFactor: 1.0, calculatedHours: 300, rationale: 'Accessibility testing with assistive tech users. ~12 hrs/sprint.' },
      { id: 'le-7-1-qa', roleId: 'qa', roleName: 'QA Engineer', baseHours: 300, complexityFactor: 1.0, calculatedHours: 300, rationale: 'Automated + manual 508 testing. ~12 hrs/sprint.' },
    ],
    totalHours: 1200,
    qualityGrade: 'yellow',
    qualityIssues: ['LOE method - ensure <15-20% of total project value'],
    isComplete: true,
  },
  {
    id: 'wbs-7-2',
    wbsNumber: '7.2',
    title: 'Legacy System Data Migration',
    sowReference: 'SOO Section 3.6; "Three legacy scheduling solutions currently in place" (p.5)',
    clin: '0001',
    periodOfPerformance: { start: '2025-03-01', end: '2025-12-31' },
    why: 'Successfully migrate posts from three legacy systems to CAMP while preserving historical data and ensuring data integrity.',
    what: 'Analyze legacy schemas (3 systems). Design ETL processes. Execute test migrations. Coordinate cut-overs. Perform data validation. Support rollback if needed.',
    notIncluded: 'Legacy system maintenance. Data archival beyond 3 years. Legacy decommissioning.',
    assumptions: ['Legacy documentation available', 'Read access granted', 'Phased migration approved'],
    dependencies: ['Legacy database access', 'Data mapping specs', 'Post migration schedule'],
    estimateMethod: 'historical',
    historicalReference: {
      programName: 'USCIS Legacy Migration',
      chargeNumber: 'USCIS-2022-MIGRATE-089',
      actualHours: 1200,
      taskDescription: 'Data migration from legacy case management, similar complexity',
    },
    complexityFactor: 1.25,
    complexityJustification: '25% increase for three source systems vs. single in reference.',
    laborEstimates: [
      { id: 'le-7-2-tl', roleId: 'tl', roleName: 'Technical Lead', baseHours: 160, complexityFactor: 1.25, calculatedHours: 200, rationale: 'Migration architecture, data mapping oversight.' },
      { id: 'le-7-2-be', roleId: 'be', roleName: 'Backend Engineer', baseHours: 560, complexityFactor: 1.25, calculatedHours: 700, rationale: 'ETL development for 3 systems, data transformation.' },
      { id: 'le-7-2-sd', roleId: 'sd', roleName: 'Service Designer', baseHours: 240, complexityFactor: 1.25, calculatedHours: 300, rationale: 'Service blueprints for 3 legacy systems.' },
      { id: 'le-7-2-sme', roleId: 'sme', roleName: 'DoS Subject Matter Expert', baseHours: 240, complexityFactor: 1.25, calculatedHours: 300, rationale: 'Legacy system knowledge, business rule validation.' },
      { id: 'le-7-2-qa', roleId: 'qa', roleName: 'QA Engineer', baseHours: 160, complexityFactor: 1.25, calculatedHours: 200, rationale: 'Data validation testing, migration verification.' },
    ],
    totalHours: 1700,
    qualityGrade: 'green',
    qualityIssues: [],
    isComplete: true,
  },

  // ==================== 8.0 CORE BACKEND ====================
  {
    id: 'wbs-8-1',
    wbsNumber: '8.1',
    title: 'Scheduling API & Availability Engine',
    sowReference: 'SOO Section 3.2; Core booking logic; "API-centric approach" (p.8)',
    clin: '0001',
    periodOfPerformance: { start: '2025-01-01', end: '2025-12-31' },
    why: 'Provide the core scheduling engine that powers both public booking and admin capacity management.',
    what: 'Develop scheduling API endpoints. Implement availability algorithms. Handle booking conflicts. Support modifications and cancellations. Implement notification triggers. Ensure performance at scale.',
    notIncluded: 'Frontend implementations. External integrations. Reporting aggregations.',
    assumptions: ['MVP logic functional', 'Database schema established', 'API patterns consistent with BESPIN'],
    dependencies: ['Database access', 'BESPIN API gateway'],
    estimateMethod: 'historical',
    historicalReference: {
      programName: 'VA Scheduling Engine',
      chargeNumber: 'VA-SCHED-2023-API-089',
      actualHours: 2200,
      taskDescription: 'Core scheduling API for VA healthcare appointments',
    },
    complexityFactor: 0.85,
    complexityJustification: '15% reduction - CAMP scheduling simpler than VA healthcare. Enhancement vs. greenfield.',
    laborEstimates: [
      { id: 'le-8-1-tl', roleId: 'tl', roleName: 'Technical Lead', baseHours: 235, complexityFactor: 0.85, calculatedHours: 200, rationale: 'Architecture oversight, API design, performance.' },
      { id: 'le-8-1-be', roleId: 'be', roleName: 'Backend Engineer', baseHours: 1647, complexityFactor: 0.85, calculatedHours: 1400, rationale: 'Core API (800), availability (300), conflicts (200), notifications (100).' },
      { id: 'le-8-1-qa', roleId: 'qa', roleName: 'QA Engineer', baseHours: 235, complexityFactor: 0.85, calculatedHours: 200, rationale: 'API testing, concurrency testing, edge cases.' },
    ],
    totalHours: 1800,
    qualityGrade: 'green',
    qualityIssues: [],
    isComplete: true,
  },
  {
    id: 'wbs-8-2',
    wbsNumber: '8.2',
    title: 'Quality Assurance & Test Automation',
    sowReference: 'SOO Section 4.4; "Testing integrated into the project" (p.8); "Unit testing, automated integration, component testing" (p.8)',
    clin: '0001',
    periodOfPerformance: { start: '2025-01-01', end: '2025-12-31' },
    why: 'Ensure CAMP reliability through comprehensive test coverage and automated regression testing.',
    what: 'Develop test strategy. Create functional test cases. Build automated regression suite. Conduct performance and load testing. Execute cross-browser testing. Verify fixes and track metrics.',
    notIncluded: 'Accessibility testing (WBS 7.1). Security penetration testing. UAT.',
    assumptions: ['Test automation framework established', 'Test environment stable', 'Reasonable defect volume'],
    dependencies: ['Test environment access', 'Test data availability'],
    estimateMethod: 'level-of-effort',
    complexityFactor: 1.0,
    complexityJustification: 'Ongoing QA across 26 sprints.',
    laborEstimates: [
      { id: 'le-8-2-qa', roleId: 'qa', roleName: 'QA Engineer', baseHours: 1100, complexityFactor: 1.0, calculatedHours: 1100, rationale: 'Planning (150), functional (300), regression (200), performance (100), cross-browser (100), verification (150), docs (100). ~42 hrs/sprint.' },
    ],
    totalHours: 1100,
    qualityGrade: 'yellow',
    qualityIssues: ['LOE method - ensure <15-20% of total project value'],
    isComplete: true,
  },

  // ==================== 9.0 LEADERSHIP & RESEARCH ====================
  {
    id: 'wbs-9-1',
    wbsNumber: '9.1',
    title: 'Product Strategy & Backlog Management',
    sowReference: 'SOO Section 3.1; "Develop and prioritize a full gamut of user stories" (p.6); "Contribute to the development of the product vision, product roadmap(s)" (p.8)',
    clin: '0001',
    periodOfPerformance: { start: '2025-01-01', end: '2025-12-31' },
    why: 'Ensure continuous alignment between development and CA priorities through disciplined backlog management.',
    what: 'Maintain and prioritize backlog. Write stories with acceptance criteria. Facilitate sprint ceremonies. Engage stakeholders. Manage roadmap. Define future scope (NIV, crisis).',
    notIncluded: 'Technical decisions. Government policy decisions. Budget allocation.',
    assumptions: ['PO engaged and available', 'Stakeholder access', 'Prioritization framework agreed'],
    dependencies: ['PO availability', 'Stakeholder calendar'],
    estimateMethod: 'level-of-effort',
    complexityFactor: 1.0,
    complexityJustification: 'Ongoing PM activity across 26 sprints.',
    laborEstimates: [
      { id: 'le-9-1-pm', roleId: 'pm', roleName: 'Product Manager', baseHours: 1720, complexityFactor: 1.0, calculatedHours: 1720, rationale: 'Backlog (400), roadmap (200), discovery (300), ceremonies (400), requirements (420). ~66 hrs/sprint.' },
    ],
    totalHours: 1720,
    qualityGrade: 'yellow',
    qualityIssues: ['LOE method - ensure <15-20% of total project value'],
    isComplete: true,
  },
  {
    id: 'wbs-9-2',
    wbsNumber: '9.2',
    title: 'User Research & Satisfaction Measurement',
    sowReference: 'SOO Section 3.4; "Achieve a 90% satisfaction rate among customers regarding the use of CAMP" (p.6); "Ensure diverse groups of users are represented" (p.8)',
    clin: '0001',
    periodOfPerformance: { start: '2025-01-01', end: '2025-12-31' },
    why: 'Continuously validate CAMP meets user needs and achieves 90% satisfaction target.',
    what: 'Review incumbent research. Conduct ongoing usability testing. Recruit diverse participants globally. Measure CSAT. Test plain language (5th grade). Synthesize findings.',
    notIncluded: 'Market research. Competitive analysis. Policy research.',
    assumptions: ['Recruitment channels established', 'Research tools available', 'Incumbent research accessible'],
    dependencies: ['Staging environment', 'User recruitment budget'],
    estimateMethod: 'level-of-effort',
    complexityFactor: 1.0,
    complexityJustification: 'Ongoing research across 26 sprints.',
    laborEstimates: [
      { id: 'le-9-2-uxr', roleId: 'uxr', roleName: 'UX Researcher', baseHours: 1320, complexityFactor: 1.0, calculatedHours: 1320, rationale: 'Desk research (200), process research (300), recruitment (200), testing (400), metrics (200), plain language (120). ~51 hrs/sprint.' },
    ],
    totalHours: 1320,
    qualityGrade: 'yellow',
    qualityIssues: ['LOE method - ensure <15-20% of total project value'],
    isComplete: true,
  },
  {
    id: 'wbs-9-3',
    wbsNumber: '9.3',
    title: 'Design Team Leadership & Quality',
    sowReference: 'SOO Section 3.4.2; "Conduct design QA" (p.8); "Share research findings with engineers, PMs, product owners" (p.8)',
    clin: '0001',
    periodOfPerformance: { start: '2025-01-01', end: '2025-12-31' },
    why: 'Ensure design excellence across all CAMP interfaces through consistent leadership and quality review.',
    what: 'Lead design team. Conduct design reviews before handoff. Synthesize research into recommendations. Present rationale to stakeholders. Mentor team. Ensure consistency.',
    notIncluded: 'Individual feature design. Research execution. Service blueprint creation.',
    assumptions: ['Design team staffed', 'Collaboration tools available', 'Review cadence established'],
    dependencies: ['Design tool licenses', 'Team availability'],
    estimateMethod: 'level-of-effort',
    complexityFactor: 1.0,
    complexityJustification: 'Ongoing leadership across 26 sprints.',
    laborEstimates: [
      { id: 'le-9-3-dl', roleId: 'dl', roleName: 'Design Lead', baseHours: 1320, complexityFactor: 1.0, calculatedHours: 1320, rationale: 'Leadership (200), review/QA (300), synthesis (200), presentations (200), MVP assessment (160), multi-language (160), crisis UX (100). ~51 hrs/sprint.' },
    ],
    totalHours: 1320,
    qualityGrade: 'yellow',
    qualityIssues: ['LOE method - ensure <15-20% of total project value'],
    isComplete: true,
  },
  {
    id: 'wbs-9-4',
    wbsNumber: '9.4',
    title: 'Technical Architecture & Code Quality',
    sowReference: 'SOO Section 4.1; "API-centric approach" (p.8); "Pull request review process" (p.8); "Security reviews embedded as an engineering practice" (p.9)',
    clin: '0001',
    periodOfPerformance: { start: '2025-01-01', end: '2025-12-31' },
    why: 'Maintain technical excellence and code quality through architectural oversight and security guidance.',
    what: 'Oversee architecture decisions. Conduct code reviews. Guide security-by-design. Manage technical debt. Mentor engineering team. Document patterns.',
    notIncluded: 'Feature development. DevOps operations. Support operations.',
    assumptions: ['Code review tooling in place', 'Documentation repo exists', 'Team follows patterns'],
    dependencies: ['Git repo access', 'Documentation platform'],
    estimateMethod: 'level-of-effort',
    complexityFactor: 1.0,
    complexityJustification: 'Ongoing technical leadership across 26 sprints.',
    laborEstimates: [
      { id: 'le-9-4-tl', roleId: 'tl', roleName: 'Technical Lead', baseHours: 1020, complexityFactor: 1.0, calculatedHours: 1020, rationale: 'Architecture (300), code review (300), security (200), tech debt (120), mentoring (100). ~39 hrs/sprint.' },
    ],
    totalHours: 1020,
    qualityGrade: 'yellow',
    qualityIssues: ['LOE method - ensure <15-20% of total project value'],
    isComplete: true,
  },
  {
    id: 'wbs-9-5',
    wbsNumber: '9.5',
    title: 'Service Design & Change Management',
    sowReference: 'SOO Section 3.4.3; "Consular officers change duty locations and leave them with different experiences and challenges to manage" (p.5)',
    clin: '0001',
    periodOfPerformance: { start: '2025-01-01', end: '2025-12-31' },
    why: 'Design holistic service experiences that account for the full user journey across touchpoints.',
    what: 'Map end-to-end journeys. Design consistent cross-post experiences. Develop change management strategy. Create support process designs. Design documentation. Address crisis workflows.',
    notIncluded: 'Post-specific process changes. Organizational restructuring. Change management execution.',
    assumptions: ['Service design research completed', 'Stakeholder buy-in', 'Access to cross-post research'],
    dependencies: ['UX research findings', 'Post operational data'],
    estimateMethod: 'level-of-effort',
    complexityFactor: 1.0,
    complexityJustification: 'Ongoing service design across 26 sprints.',
    laborEstimates: [
      { id: 'le-9-5-sd', roleId: 'sd', roleName: 'Service Designer', baseHours: 1120, complexityFactor: 1.0, calculatedHours: 1120, rationale: 'Admin workflows (200), support design (200), change mgmt (200), docs UX (200), crisis (120), improvements (200). ~43 hrs/sprint.' },
    ],
    totalHours: 1120,
    qualityGrade: 'yellow',
    qualityIssues: ['LOE method - ensure <15-20% of total project value'],
    isComplete: true,
  },

  // ==================== 10.0 FRAUD PREVENTION ====================
  {
    id: 'wbs-10-1',
    wbsNumber: '10.1',
    title: 'Fraud Detection & Prevention',
    sowReference: 'SOO Section 3.5; "Prevention and/or identification of Fraudulent Appointments" (p.5); "Detecting and prevent fraudulent appointment scheduling" (p.17)',
    clin: '0001',
    periodOfPerformance: { start: '2025-06-01', end: '2025-12-31' },
    why: 'Protect appointment system integrity by detecting and preventing fraudulent booking attempts.',
    what: 'Design admin fraud detection views. Implement rule engine for suspicious patterns. Create alerting system. Build reporting dashboard. Support manual review workflows.',
    notIncluded: 'Fraud investigation (government). Legal enforcement. Policy definition.',
    assumptions: ['Fraud patterns documented from incumbent', 'Government defines thresholds', 'Integration with monitoring'],
    dependencies: ['Fraud rule definitions from CA', 'Historical fraud data'],
    estimateMethod: 'engineering',
    complexityFactor: 1.0,
    complexityJustification: 'New capability without direct historical reference. Engineering estimate based on component breakdown.',
    laborEstimates: [
      { id: 'le-10-1-pd', roleId: 'pd', roleName: 'Product Designer', baseHours: 80, complexityFactor: 1.0, calculatedHours: 80, rationale: 'Fraud dashboard, alert interfaces, review workflows.' },
      { id: 'le-10-1-be', roleId: 'be', roleName: 'Backend Engineer', baseHours: 200, complexityFactor: 1.0, calculatedHours: 200, rationale: 'Rule engine (100), detection algorithms (60), alerting (40).' },
      { id: 'le-10-1-fe', roleId: 'fe', roleName: 'Frontend Engineer', baseHours: 80, complexityFactor: 1.0, calculatedHours: 80, rationale: 'Fraud dashboard UI, alert displays, review interfaces.' },
      { id: 'le-10-1-qa', roleId: 'qa', roleName: 'QA Engineer', baseHours: 40, complexityFactor: 1.0, calculatedHours: 40, rationale: 'Rule validation, detection accuracy testing.' },
    ],
    totalHours: 400,
    qualityGrade: 'red',
    qualityIssues: ['Engineering estimate requires detailed step-by-step breakdown'],
    isComplete: false,
  },
]

// ==================== MAIN COMPONENT ====================

export function EstimateTab() {
  const { scopingData, setScopingData, selectedRoles } = useAppContext()
  const teamRoles = selectedRoles || []
  
  // State - Initialize with CAMP BOE data
  const [wbsElements, setWbsElements] = useState<WBSElement[]>(campWBSElements)
  const [selectedElement, setSelectedElement] = useState<WBSElement | null>(null)
  const [activeSection, setActiveSection] = useState<'overview' | 'elements' | 'labor' | 'export'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState<QualityGrade | 'all'>('all')
  
  // Dialog states
  const [isElementDialogOpen, setIsElementDialogOpen] = useState(false)
  const [isLaborDialogOpen, setIsLaborDialogOpen] = useState(false)
  const [editingElement, setEditingElement] = useState<WBSElement | null>(null)
  const [editingLabor, setEditingLabor] = useState<LaborEstimate | null>(null)
  
  // Collapsible section states
  const [showMethodGuide, setShowMethodGuide] = useState(false)
  const [showBoeInfo, setShowBoeInfo] = useState(false)
  
  // Recalculate quality grades when elements change
  useEffect(() => {
    setWbsElements(prev => prev.map(el => {
      const quality = calculateQuality(el)
      return {
        ...el,
        qualityGrade: quality.grade,
        qualityIssues: quality.issues,
        isComplete: quality.issues.length === 0
      }
    }))
  }, [])
  
  // Calculate overall BOE readiness
  const boeReadiness = useMemo(() => {
    const total = wbsElements.length
    const complete = wbsElements.filter(el => el.qualityGrade === 'green' || el.qualityGrade === 'blue').length
    const score = total > 0 ? Math.round((complete / total) * 100) : 0
    
    const allIssues = wbsElements.flatMap(el => 
      el.qualityIssues.map(issue => ({ element: el.title, wbs: el.wbsNumber, issue }))
    )
    
    return { score, complete, total, issues: allIssues }
  }, [wbsElements])
  
  // Calculate totals by role
  const laborTotals = useMemo(() => {
    const byRole: Record<string, { hours: number; cost: number }> = {}
    let totalHours = 0
    
    wbsElements.forEach(el => {
      el.laborEstimates.forEach(labor => {
        if (!byRole[labor.roleName]) {
          byRole[labor.roleName] = { hours: 0, cost: 0 }
        }
        byRole[labor.roleName].hours += labor.calculatedHours
        // Find rate from selected roles
        const role = teamRoles.find(r => r.id === labor.roleId || r.name === labor.roleName)
        const rate = role?.hourlyRate || 150
        byRole[labor.roleName].cost += labor.calculatedHours * rate
        totalHours += labor.calculatedHours
      })
    })
    
    return { byRole, totalHours }
  }, [wbsElements, teamRoles])
  
  // Calculate team utilization (comparing BOE hours to team capacity)
  const teamUtilization = useMemo(() => {
    // Team capacity from Roles & Pricing (assuming 1,920 billable hours per FTE per year)
    const HOURS_PER_FTE = 1920
    const teamCapacity = teamRoles.reduce((sum, role) => {
      const fte = (role.fte || 1) * (role.quantity || 1)
      return sum + (fte * HOURS_PER_FTE)
    }, 0)
    
    // If no team defined, use a default based on common contract size
    const effectiveCapacity = teamCapacity > 0 ? teamCapacity : 27840 // 14.5 FTE default (CAMP)
    
    // Calculate utilization per role
    const byRole: Record<string, { 
      allocated: number
      available: number
      utilization: number
      status: 'under' | 'good' | 'over'
    }> = {}
    
    // First, add all roles from team
    teamRoles.forEach(role => {
      const roleName = role.name
      const fte = (role.fte || 1) * (role.quantity || 1)
      const available = fte * HOURS_PER_FTE
      const allocated = laborTotals.byRole[roleName]?.hours || 0
      const utilization = available > 0 ? (allocated / available) * 100 : 0
      
      byRole[roleName] = {
        allocated,
        available,
        utilization,
        status: utilization < 80 ? 'under' : utilization > 110 ? 'over' : 'good'
      }
    })
    
    // Add roles that are in BOE but not in team
    Object.entries(laborTotals.byRole).forEach(([roleName, data]) => {
      if (!byRole[roleName]) {
        byRole[roleName] = {
          allocated: data.hours,
          available: 0,
          utilization: 0,
          status: 'over' // No team member assigned
        }
      }
    })
    
    const totalAllocated = laborTotals.totalHours
    const overallUtilization = effectiveCapacity > 0 ? (totalAllocated / effectiveCapacity) * 100 : 0
    
    return {
      byRole,
      totalAllocated,
      totalAvailable: effectiveCapacity,
      overallUtilization,
      hasTeamData: teamRoles.length > 0
    }
  }, [teamRoles, laborTotals])
  
  // Filter elements
  const filteredElements = useMemo(() => {
    return wbsElements.filter(el => {
      const matchesSearch = !searchQuery || 
        el.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.wbsNumber.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesGrade = gradeFilter === 'all' || el.qualityGrade === gradeFilter
      return matchesSearch && matchesGrade
    })
  }, [wbsElements, searchQuery, gradeFilter])
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedElement(null)
        setIsElementDialogOpen(false)
        setIsLaborDialogOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  // Format hours helper
  const formatHours = useCallback((hours: number) => {
    if (hours >= 160) {
      const weeks = Math.round(hours / 40 * 10) / 10
      return `${hours.toLocaleString()} hrs (${weeks} weeks)`
    }
    return `${hours.toLocaleString()} hrs`
  }, [])
  
  // ==================== RENDER OVERVIEW ====================
  
  const renderOverview = () => (
    <div className="space-y-6" role="region" aria-label="BOE Overview">
      {/* BOE Readiness Score */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              <AcronymTooltip term="BOE">BOE</AcronymTooltip> Readiness
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Your estimate is {boeReadiness.score}% ready for document generation
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{boeReadiness.score}%</div>
            <div className="text-sm text-gray-500">
              {boeReadiness.complete}/{boeReadiness.total} elements ready
            </div>
          </div>
        </div>
        
        <Progress 
          value={boeReadiness.score} 
          className="h-3 mb-4" 
          aria-label={`BOE readiness: ${boeReadiness.score}%`}
        />
        
        {/* Quality Grade Distribution */}
        <div className="flex gap-2 mb-4">
          {(['blue', 'green', 'yellow', 'red'] as QualityGrade[]).map(grade => {
            const count = wbsElements.filter(el => el.qualityGrade === grade).length
            const config = QUALITY_GRADE_CONFIG[grade]
            return (
              <button
                key={grade}
                onClick={() => {
                  setGradeFilter(grade)
                  setActiveSection('elements')
                }}
                className={`flex-1 p-2 rounded-lg border ${config.bgColor} ${config.borderColor} ${config.textColor} text-center transition-all hover:shadow-sm`}
                aria-label={`View ${count} ${config.label} elements`}
              >
                <div className="text-lg font-bold">{count}</div>
                <div className="text-xs">{config.label}</div>
              </button>
            )
          })}
        </div>
        
        {/* Issues List */}
        {boeReadiness.issues.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">Issues to resolve:</p>
            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {boeReadiness.issues.slice(0, 8).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const el = wbsElements.find(e => e.wbsNumber === item.wbs)
                    if (el) {
                      setSelectedElement(el)
                      setActiveSection('elements')
                    }
                  }}
                  className="w-full flex items-start gap-2 text-sm p-2 rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors text-left"
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="flex-1">
                    <span className="font-medium">{item.wbs}:</span> {item.issue}
                  </span>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                </button>
              ))}
              {boeReadiness.issues.length > 8 && (
                <p className="text-xs text-gray-500 pt-2">
                  +{boeReadiness.issues.length - 8} more issues
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Team Utilization - Shows connection to Roles & Pricing */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <h4 className="font-medium text-gray-900">Team Utilization</h4>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="Learn about team utilization">
                  <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">Compares hours allocated in your BOE to your team capacity from Roles & Pricing. Green = well utilized (80-110%), Yellow = under-utilized, Red = over-allocated.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {!teamUtilization.hasTeamData && (
            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
              Using default team capacity
            </Badge>
          )}
        </div>
        
        {/* Overall utilization bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Overall Utilization</span>
            <span className="font-medium text-gray-900">
              {teamUtilization.totalAllocated.toLocaleString()} / {teamUtilization.totalAvailable.toLocaleString()} hrs
              <span className={`ml-2 ${
                teamUtilization.overallUtilization > 100 ? 'text-red-600' :
                teamUtilization.overallUtilization > 90 ? 'text-green-600' :
                'text-yellow-600'
              }`}>
                ({teamUtilization.overallUtilization.toFixed(1)}%)
              </span>
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                teamUtilization.overallUtilization > 100 ? 'bg-red-500' :
                teamUtilization.overallUtilization > 90 ? 'bg-green-500' :
                'bg-yellow-500'
              }`}
              style={{ width: `${Math.min(teamUtilization.overallUtilization, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Status summary */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-700">
              {Object.values(teamUtilization.byRole).filter(r => r.status === 'good').length}
            </div>
            <div className="text-xs text-green-600">Well Utilized</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="text-lg font-bold text-yellow-700">
              {Object.values(teamUtilization.byRole).filter(r => r.status === 'under').length}
            </div>
            <div className="text-xs text-yellow-600">Under-Utilized</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-700">
              {Object.values(teamUtilization.byRole).filter(r => r.status === 'over').length}
            </div>
            <div className="text-xs text-red-600">Over-Allocated</div>
          </div>
        </div>
        
        {!teamUtilization.hasTeamData && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-blue-800">
                  No team defined in Roles & Pricing. Using 14.5 FTE default capacity. 
                  <button 
                    className="ml-1 text-blue-600 underline hover:text-blue-800"
                    onClick={() => {/* Navigate to Roles & Pricing */}}
                  >
                    Set up your team →
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatHours(laborTotals.totalHours)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Layers className="w-5 h-5 text-purple-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-gray-600"><AcronymTooltip term="WBS">WBS</AcronymTooltip> Elements</p>
              <p className="text-xl font-semibold text-gray-900">{wbsElements.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 text-green-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Labor Categories</p>
              <p className="text-xl font-semibold text-gray-900">
                {Object.keys(laborTotals.byRole).length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Collapsible: BOE Structure Info */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowBoeInfo(!showBoeInfo)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          aria-expanded={showBoeInfo}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <span className="font-medium text-gray-900">
              What makes a defensible <AcronymTooltip term="BOE">BOE</AcronymTooltip>?
            </span>
          </div>
          {showBoeInfo ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {showBoeInfo && (
          <div className="px-4 pb-4 border-t border-gray-100 bg-blue-50">
            <div className="pt-4">
              <p className="text-sm text-blue-800 mb-3">
                Government evaluators and DCAA auditors grade your estimate using a color-coded system.
                Each WBS element needs four components:
              </p>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li><strong>Header:</strong> WBS number, SOW reference, period of performance</li>
                <li><strong>Task Description:</strong> WHY, WHAT, and what's NOT included</li>
                <li><strong>Basis of Estimate:</strong> Historical data, charge numbers, complexity factors</li>
                <li><strong>Bid Detail:</strong> Hours by labor category with calculations that match</li>
              </ol>
            </div>
          </div>
        )}
      </div>
      
      {/* Collapsible: Estimate Method Quality Guide */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowMethodGuide(!showMethodGuide)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          aria-expanded={showMethodGuide}
        >
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-gray-600" aria-hidden="true" />
            <span className="font-medium text-gray-900">Estimate Method Quality Guide</span>
            <span className="text-xs text-gray-500">(Best to Worst)</span>
          </div>
          {showMethodGuide ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {showMethodGuide && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="pt-4 space-y-2">
              {ESTIMATE_METHODS.map(method => {
                const gradeConfig = QUALITY_GRADE_CONFIG[method.grade]
                return (
                  <div 
                    key={method.value} 
                    className={`flex items-start gap-3 p-3 rounded-lg ${gradeConfig.bgColor} ${gradeConfig.borderColor} border`}
                  >
                    {method.icon}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${gradeConfig.textColor}`}>{method.label}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{method.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
  
  // ==================== RENDER WBS ELEMENTS LIST ====================
  
  const renderElementsList = () => (
    <div className="space-y-4" role="region" aria-label="WBS Elements">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            <AcronymTooltip term="WBS">WBS</AcronymTooltip> Elements
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Each element represents a piece of work with documented hours and rationale
          </p>
        </div>
        <Button onClick={() => setIsElementDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Add Element
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
              aria-hidden="true" 
            />
            <Input
              placeholder="Search by title or WBS number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
              aria-label="Search WBS elements"
            />
          </div>
        </div>
        <Select value={gradeFilter} onValueChange={(v) => setGradeFilter(v as QualityGrade | 'all')}>
          <SelectTrigger className="w-[150px] h-9" aria-label="Filter by quality grade">
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            <SelectItem value="blue">🔵 Excellent</SelectItem>
            <SelectItem value="green">🟢 Good</SelectItem>
            <SelectItem value="yellow">🟡 Needs Work</SelectItem>
            <SelectItem value="red">🔴 Unsupported</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Element Cards */}
      <div className="space-y-3" role="list" aria-label="WBS elements list">
        {filteredElements.map(element => {
          const gradeConfig = QUALITY_GRADE_CONFIG[element.qualityGrade]
          return (
            <div
              key={element.id}
              role="listitem"
              className={`group bg-white border-l-4 border border-gray-200 rounded-lg p-4 
                hover:border-blue-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] 
                transition-all cursor-pointer
                ${element.qualityGrade === 'blue' ? 'border-l-blue-500' : ''}
                ${element.qualityGrade === 'green' ? 'border-l-green-500' : ''}
                ${element.qualityGrade === 'yellow' ? 'border-l-yellow-500' : ''}
                ${element.qualityGrade === 'red' ? 'border-l-red-500' : ''}
              `}
              onClick={() => setSelectedElement(element)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedElement(element)
                }
              }}
              tabIndex={0}
              aria-label={`WBS ${element.wbsNumber}: ${element.title}, ${gradeConfig.label} quality, ${element.totalHours} hours`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-gray-500">{element.wbsNumber}</span>
                    <h4 className="font-medium text-gray-900 truncate">{element.title}</h4>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="outline" 
                      className={`${gradeConfig.bgColor} ${gradeConfig.textColor} ${gradeConfig.borderColor} text-[10px] px-1.5 py-0 h-5`}
                    >
                      {gradeConfig.icon}
                      <span className="ml-1">{gradeConfig.label}</span>
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-gray-50">
                      {ESTIMATE_METHODS.find(m => m.value === element.estimateMethod)?.label || element.estimateMethod}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{element.what}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      {formatHours(element.totalHours)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" aria-hidden="true" />
                      {element.laborEstimates.length} roles
                    </span>
                    {element.sowReference && (
                      <span className="flex items-center gap-1">
                        <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                        {element.sowReference.split(' - ')[0]}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {element.qualityIssues.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-yellow-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-medium">{element.qualityIssues.length}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-medium mb-1">Quality Issues:</p>
                          <ul className="text-xs space-y-1">
                            {element.qualityIssues.map((issue, idx) => (
                              <li key={idx}>• {issue}</li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <ChevronRight 
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" 
                    aria-hidden="true" 
                  />
                </div>
              </div>
            </div>
          )
        })}
        
        {filteredElements.length === 0 && (
          <div className="text-center py-12" role="status">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm text-gray-600 mb-2">No WBS elements match your filters</p>
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setGradeFilter('all') }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
  
  // ==================== RENDER LABOR SUMMARY ====================
  
  const renderLaborSummary = () => (
    <div className="space-y-6" role="region" aria-label="Labor Summary">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Labor Summary</h3>
          <p className="text-sm text-gray-600 mt-1">
            Hours allocation by labor category across all <AcronymTooltip term="WBS">WBS</AcronymTooltip> elements
          </p>
        </div>
        {!teamUtilization.hasTeamData && (
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Set Up Team
          </Button>
        )}
      </div>
      
      {/* Team Capacity vs BOE Allocation */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <h4 className="font-medium text-gray-900">Team Capacity vs BOE Allocation</h4>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label="Learn about capacity">
                <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">Available hours come from your team in Roles & Pricing (FTE × 1,920 hrs/year). Allocated hours are from your WBS elements.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-1">Available (Team Capacity)</p>
            <p className="text-2xl font-bold text-gray-900">{teamUtilization.totalAvailable.toLocaleString()}</p>
            <p className="text-xs text-gray-500">hours</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-sm text-blue-700 mb-1">Allocated (BOE Total)</p>
            <p className="text-2xl font-bold text-blue-900">{teamUtilization.totalAllocated.toLocaleString()}</p>
            <p className="text-xs text-blue-600">hours</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100">
          <span className="text-sm font-medium text-gray-700">Utilization</span>
          <span className={`text-lg font-bold ${
            teamUtilization.overallUtilization > 100 ? 'text-red-600' :
            teamUtilization.overallUtilization > 90 ? 'text-green-600' :
            'text-yellow-600'
          }`}>
            {teamUtilization.overallUtilization.toFixed(1)}%
          </span>
        </div>
      </div>
      
      {/* Utilization by Role */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Utilization by Role</h4>
        <div className="space-y-4">
          {Object.entries(teamUtilization.byRole)
            .sort((a, b) => b[1].allocated - a[1].allocated)
            .map(([roleName, data]) => {
              const statusColors = {
                under: { bg: 'bg-yellow-500', text: 'text-yellow-700', label: 'Under-utilized' },
                good: { bg: 'bg-green-500', text: 'text-green-700', label: 'Well utilized' },
                over: { bg: 'bg-red-500', text: 'text-red-700', label: 'Over-allocated' }
              }
              const status = statusColors[data.status]
              
              return (
                <div key={roleName}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-medium">{roleName}</span>
                      {data.available === 0 && (
                        <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                          Not in team
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-xs">
                        {data.allocated.toLocaleString()} / {data.available > 0 ? data.available.toLocaleString() : '—'} hrs
                      </span>
                      <span className={`text-xs font-medium ${status.text}`}>
                        {data.available > 0 ? `${data.utilization.toFixed(0)}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${status.bg}`}
                      style={{ width: `${Math.min(data.available > 0 ? data.utilization : 100, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      </div>
      
      {/* Detailed Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Detailed Breakdown</h4>
        </div>
        <table className="w-full" role="table" aria-label="Labor hours by category">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Labor Category
              </th>
              <th scope="col" className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Available
              </th>
              <th scope="col" className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Allocated
              </th>
              <th scope="col" className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Utilization
              </th>
              <th scope="col" className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Rate
              </th>
              <th scope="col" className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Total Cost
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Object.entries(laborTotals.byRole)
              .sort((a, b) => b[1].hours - a[1].hours)
              .map(([roleName, data]) => {
                const role = teamRoles.find(r => r.name === roleName)
                const rate = role?.hourlyRate || 150
                const utilData = teamUtilization.byRole[roleName]
                const statusColor = utilData?.status === 'over' ? 'text-red-600' : 
                                   utilData?.status === 'under' ? 'text-yellow-600' : 
                                   'text-green-600'
                
                return (
                  <tr key={roleName} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{roleName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {utilData?.available > 0 ? utilData.available.toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      {data.hours.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${statusColor}`}>
                      {utilData?.available > 0 ? `${utilData.utilization.toFixed(0)}%` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">${rate.toFixed(2)}/hr</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      ${(data.hours * rate).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
              <td className="px-4 py-3 text-sm text-gray-600 text-right">
                {teamUtilization.totalAvailable.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                {laborTotals.totalHours.toLocaleString()}
              </td>
              <td className={`px-4 py-3 text-sm font-semibold text-right ${
                teamUtilization.overallUtilization > 100 ? 'text-red-600' :
                teamUtilization.overallUtilization > 90 ? 'text-green-600' :
                'text-yellow-600'
              }`}>
                {teamUtilization.overallUtilization.toFixed(0)}%
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 text-right">—</td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                ${Object.values(laborTotals.byRole)
                  .reduce((sum, d) => sum + d.cost, 0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {/* Hours by WBS Element */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Hours by WBS Element</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {wbsElements.map(el => {
            const percentage = laborTotals.totalHours > 0 
              ? (el.totalHours / laborTotals.totalHours * 100) 
              : 0
            
            return (
              <button
                key={el.id}
                onClick={() => {
                  setSelectedElement(el)
                  setActiveSection('elements')
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors text-left group"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-mono text-gray-500 w-10 flex-shrink-0">{el.wbsNumber}</span>
                  <span className="text-sm text-gray-700 truncate">{el.title}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                  <span className="text-sm font-medium text-gray-900 w-20 text-right">
                    {el.totalHours.toLocaleString()} hrs
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
  
  // ==================== RENDER EXPORT ====================
  
  const renderExport = () => (
    <div className="space-y-6" role="region" aria-label="Export BOE">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">
          Generate <AcronymTooltip term="BOE">BOE</AcronymTooltip> Document
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Export your estimate as a professional Basis of Estimate document
        </p>
      </div>
      
      {/* Readiness Check */}
      <div 
        className={`border rounded-lg p-4 ${
          boeReadiness.score >= 80 ? 'bg-green-50 border-green-200' :
          boeReadiness.score >= 50 ? 'bg-yellow-50 border-yellow-200' :
          'bg-red-50 border-red-200'
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          {boeReadiness.score >= 80 ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" aria-hidden="true" />
          ) : boeReadiness.score >= 50 ? (
            <AlertTriangle className="w-6 h-6 text-yellow-600" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-6 h-6 text-red-600" aria-hidden="true" />
          )}
          <div>
            <p className={`font-medium ${
              boeReadiness.score >= 80 ? 'text-green-900' : 
              boeReadiness.score >= 50 ? 'text-yellow-900' :
              'text-red-900'
            }`}>
              {boeReadiness.score >= 80 
                ? 'Your BOE is ready for export!' 
                : boeReadiness.score >= 50
                ? `BOE is ${boeReadiness.score}% complete - some elements need attention`
                : `BOE is only ${boeReadiness.score}% complete - significant work needed`}
            </p>
            <p className={`text-sm ${
              boeReadiness.score >= 80 ? 'text-green-700' : 
              boeReadiness.score >= 50 ? 'text-yellow-700' :
              'text-red-700'
            }`}>
              {boeReadiness.complete} of {boeReadiness.total} WBS elements have GREEN or BLUE quality grades
            </p>
          </div>
        </div>
      </div>
      
      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Word Document</h4>
              <p className="text-sm text-gray-600 mt-1">
                Full BOE document with cover page, WBS breakdown, labor estimates, rationale, and calculations
              </p>
              <Button 
                className="mt-3"
                disabled={boeReadiness.score < 50}
                aria-describedby={boeReadiness.score < 50 ? 'export-warning' : undefined}
              >
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                Export .docx
              </Button>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Calculator className="w-5 h-5 text-green-600" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Excel Workbook</h4>
              <p className="text-sm text-gray-600 mt-1">
                Detailed spreadsheet with labor hours by WBS/role, rates, calculations, and cost rollups
              </p>
              <Button 
                variant="outline"
                className="mt-3"
                disabled={boeReadiness.score < 50}
              >
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                Export .xlsx
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {boeReadiness.score < 50 && (
        <p id="export-warning" className="text-sm text-red-600">
          Export is disabled until BOE reaches at least 50% readiness. 
          Address the quality issues in your WBS elements to enable export.
        </p>
      )}
      
      {/* Document Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Document Structure Preview</h4>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
          <p><strong>1. Cover Page</strong> - Contract info, period of performance, total value</p>
          <p><strong>2. Executive Summary</strong> - Methodology overview, {laborTotals.totalHours.toLocaleString()} total hours</p>
          <p><strong>3. Work Breakdown Structure</strong> - {wbsElements.length} elements with SOW traceability</p>
          <p><strong>4. Detailed Estimates</strong> - Each WBS element with 4-part BOE format:</p>
          <div className="ml-4 text-xs space-y-1">
            <p>• Header (WBS, SOW ref, PoP)</p>
            <p>• Task Description (WHY, WHAT, exclusions, assumptions)</p>
            <p>• Basis of Estimate (method, historical reference, scaling)</p>
            <p>• Bid Detail (labor hours with calculations)</p>
          </div>
          <p><strong>5. Labor Summary</strong> - Hours by category with rate justification</p>
          <p><strong>6. Assumptions & Risks</strong> - All documented assumptions</p>
          <p><strong>7. Appendices</strong> - Historical references, charge number backup</p>
        </div>
      </div>
    </div>
  )
  
  // ==================== ELEMENT SLIDEOUT ====================
  
  const renderElementSlideout = () => {
    if (!selectedElement) return null
    
    const gradeConfig = QUALITY_GRADE_CONFIG[selectedElement.qualityGrade]
    const methodConfig = ESTIMATE_METHODS.find(m => m.value === selectedElement.estimateMethod)
    
    return (
      <>
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setSelectedElement(null)}
          aria-hidden="true"
        />
        
        {/* Panel */}
        <div 
          className="fixed inset-y-0 right-0 w-[700px] bg-white shadow-2xl border-l border-gray-200 overflow-y-auto z-50 animate-in slide-in-from-right"
          role="dialog"
          aria-modal="true"
          aria-labelledby="element-title"
        >
          {/* Sticky Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-gray-500">{selectedElement.wbsNumber}</span>
                  <h3 id="element-title" className="text-lg font-semibold text-gray-900 truncate">
                    {selectedElement.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`${gradeConfig.bgColor} ${gradeConfig.textColor} ${gradeConfig.borderColor} text-xs`}
                  >
                    {gradeConfig.icon}
                    <span className="ml-1">{gradeConfig.label}</span>
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {formatHours(selectedElement.totalHours)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditingElement(selectedElement)}
                  aria-label="Edit this WBS element"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedElement(null)}
                  className="h-8 w-8 p-0"
                  aria-label="Close panel"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Content - 4 BOE Sections */}
          <div className="p-6 space-y-6">
            {/* Quality Issues Banner */}
            {selectedElement.qualityIssues.length > 0 && (
              <div className={`${gradeConfig.bgColor} border ${gradeConfig.borderColor} rounded-lg p-4`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`w-5 h-5 ${gradeConfig.textColor} mt-0.5 flex-shrink-0`} aria-hidden="true" />
                  <div>
                    <p className={`text-sm font-medium ${gradeConfig.textColor} mb-2`}>
                      Quality Issues to Resolve
                    </p>
                    <ul className="text-xs space-y-1">
                      {selectedElement.qualityIssues.map((issue, idx) => (
                        <li key={idx} className={gradeConfig.textColor}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Section 1: Header Information */}
            <section aria-labelledby="section-header">
              <h4 id="section-header" className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</div>
                Header Information
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs text-gray-500 mb-1">
                      <AcronymTooltip term="WBS">WBS</AcronymTooltip> Number
                    </dt>
                    <dd className="text-sm font-mono text-gray-900">{selectedElement.wbsNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 mb-1">
                      <AcronymTooltip term="CLIN">CLIN</AcronymTooltip>
                    </dt>
                    <dd className="text-sm text-gray-900">{selectedElement.clin || '—'}</dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 mb-1">
                    <AcronymTooltip term="SOW">SOW</AcronymTooltip>/<AcronymTooltip term="PWS">PWS</AcronymTooltip> Reference
                  </dt>
                  <dd className="text-sm text-gray-900">{selectedElement.sowReference || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 mb-1">
                    <AcronymTooltip term="PoP">Period of Performance</AcronymTooltip>
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {selectedElement.periodOfPerformance.start} to {selectedElement.periodOfPerformance.end}
                  </dd>
                </div>
              </div>
            </section>
            
            {/* Section 2: Task Description */}
            <section aria-labelledby="section-task">
              <h4 id="section-task" className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</div>
                Task Description
              </h4>
              <div className="space-y-4">
                <div>
                  <dt className="text-xs font-medium text-gray-700 mb-1">WHY is this task being done?</dt>
                  <dd className="text-sm text-gray-600 bg-gray-50 rounded p-3">{selectedElement.why || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-700 mb-1">WHAT will be done?</dt>
                  <dd className="text-sm text-gray-600 bg-gray-50 rounded p-3">{selectedElement.what || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-700 mb-1">NOT Included (Scope Exclusions)</dt>
                  <dd className="text-sm text-gray-600 bg-gray-50 rounded p-3">{selectedElement.notIncluded || '—'}</dd>
                </div>
                
                {selectedElement.assumptions.length > 0 && (
                  <div>
                    <dt className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-600" aria-hidden="true" />
                      Assumptions
                    </dt>
                    <dd>
                      <ul className="text-sm text-gray-600 bg-gray-50 rounded p-3 space-y-1">
                        {selectedElement.assumptions.map((a, idx) => (
                          <li key={idx}>• {a}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
                
                {selectedElement.dependencies.length > 0 && (
                  <div>
                    <dt className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
                      Dependencies
                    </dt>
                    <dd>
                      <ul className="text-sm text-gray-600 bg-gray-50 rounded p-3 space-y-1">
                        {selectedElement.dependencies.map((d, idx) => (
                          <li key={idx}>• {d}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
              </div>
            </section>
            
            {/* Section 3: Basis of Estimate */}
            <section aria-labelledby="section-basis">
              <h4 id="section-basis" className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">3</div>
                Basis of Estimate
              </h4>
              <div className="space-y-4">
                <div className={`p-3 rounded-lg border ${methodConfig ? QUALITY_GRADE_CONFIG[methodConfig.grade].bgColor : 'bg-gray-50'} ${methodConfig ? QUALITY_GRADE_CONFIG[methodConfig.grade].borderColor : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {methodConfig?.icon}
                    <span className="text-sm font-medium text-gray-900">{methodConfig?.label || selectedElement.estimateMethod}</span>
                  </div>
                  <p className="text-xs text-gray-600">{methodConfig?.description}</p>
                </div>
                
                {(selectedElement.estimateMethod === 'historical' || selectedElement.estimateMethod === 'parametric') && selectedElement.historicalReference && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <History className="w-4 h-4 text-green-600" aria-hidden="true" />
                      <span className="text-sm font-medium text-green-900">
                        {selectedElement.estimateMethod === 'historical' ? 'Historical Reference' : 'Productivity Data Source'}
                      </span>
                    </div>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-green-700">Program:</dt>
                        <dd className="text-green-900 font-medium">{selectedElement.historicalReference.programName}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-green-700">Charge Number:</dt>
                        <dd className="text-green-900 font-mono">{selectedElement.historicalReference.chargeNumber}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-green-700">Actual Hours:</dt>
                        <dd className="text-green-900 font-medium">{selectedElement.historicalReference.actualHours.toLocaleString()} hrs</dd>
                      </div>
                      <div>
                        <dt className="text-green-700 mb-1">Task Description:</dt>
                        <dd className="text-green-900">{selectedElement.historicalReference.taskDescription}</dd>
                      </div>
                    </dl>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs text-gray-500 mb-1">Complexity Factor</dt>
                    <dd className="text-lg font-semibold text-gray-900">{selectedElement.complexityFactor}x</dd>
                  </div>
                  <div className="flex items-center">
                    {selectedElement.complexityFactor === 1.0 ? (
                      <Badge variant="outline" className="bg-gray-50">Same complexity</Badge>
                    ) : selectedElement.complexityFactor > 1.0 ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        +{((selectedElement.complexityFactor - 1) * 100).toFixed(0)}% more complex
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {((1 - selectedElement.complexityFactor) * 100).toFixed(0)}% less complex
                      </Badge>
                    )}
                  </div>
                </div>
                
                {selectedElement.complexityJustification && (
                  <div>
                    <dt className="text-xs text-gray-500 mb-1">Complexity Justification</dt>
                    <dd className="text-sm text-gray-600 bg-gray-50 rounded p-3">
                      {selectedElement.complexityJustification}
                    </dd>
                  </div>
                )}
              </div>
            </section>
            
            {/* Section 4: Bid Detail */}
            <section aria-labelledby="section-bid">
              <h4 id="section-bid" className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">4</div>
                Bid Detail (Labor Hours)
              </h4>
              
              <div className="space-y-3">
                {selectedElement.laborEstimates.map(labor => (
                  <div 
                    key={labor.id}
                    className="bg-white border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{labor.roleName}</p>
                        {labor.complexityFactor !== 1.0 && (
                          <p className="text-xs text-gray-500">
                            {labor.baseHours} base × {labor.complexityFactor}x = <strong>{labor.calculatedHours} hrs</strong>
                          </p>
                        )}
                      </div>
                      <span className="text-lg font-semibold text-gray-900">
                        {labor.calculatedHours.toLocaleString()} hrs
                      </span>
                    </div>
                    {labor.rationale && (
                      <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                        <span className="font-semibold text-gray-700">Rationale:</span> {labor.rationale}
                      </div>
                    )}
                  </div>
                ))}
                
                {selectedElement.laborEstimates.length === 0 && (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" aria-hidden="true" />
                    <p className="text-sm text-gray-600">No labor estimates defined</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
                      Add Labor Estimate
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Total Calculation */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Total Hours</span>
                    {selectedElement.laborEstimates.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedElement.laborEstimates.map(l => l.calculatedHours).join(' + ')} = {
                          selectedElement.laborEstimates.reduce((sum, l) => sum + l.calculatedHours, 0)
                        }
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">
                      {selectedElement.totalHours.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">hrs</span>
                    
                    {/* Math check */}
                    {(() => {
                      const calculated = selectedElement.laborEstimates.reduce((sum, l) => sum + l.calculatedHours, 0)
                      const matches = Math.abs(calculated - selectedElement.totalHours) < 0.5
                      return matches ? (
                        <div className="flex items-center justify-end gap-1 text-green-600 text-xs mt-1">
                          <Check className="w-3 h-3" aria-hidden="true" />
                          Math verified
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 text-red-600 text-xs mt-1">
                          <AlertCircle className="w-3 h-3" aria-hidden="true" />
                          Math mismatch: {calculated} ≠ {selectedElement.totalHours}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </>
    )
  }
  
  // ==================== SIDEBAR ====================
  
  const sidebarSections = [
    { 
      id: 'overview' as const, 
      label: 'BOE Overview', 
      icon: <Target className="w-4 h-4" />, 
      color: 'text-blue-600',
      badge: boeReadiness.score >= 80 ? 'Ready' : `${boeReadiness.score}%`
    },
    { 
      id: 'elements' as const, 
      label: 'WBS Elements', 
      icon: <Layers className="w-4 h-4" />, 
      color: 'text-purple-600',
      count: wbsElements.length
    },
    { 
      id: 'labor' as const, 
      label: 'Labor Summary', 
      icon: <Users className="w-4 h-4" />, 
      color: 'text-green-600'
    },
    { 
      id: 'export' as const, 
      label: 'Generate BOE', 
      icon: <Download className="w-4 h-4" />, 
      color: 'text-amber-600'
    }
  ]
  
  // ==================== MAIN RENDER ====================
  
  return (
    <TooltipProvider>
      <div className="flex gap-6 h-full font-sans">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0" role="navigation" aria-label="Estimate sections">
          <div className="sticky top-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Estimate</h2>
              <p className="text-xs text-gray-600">
                Build your <AcronymTooltip term="BOE">BOE</AcronymTooltip>
              </p>
            </div>
            
            <nav className="space-y-1" role="tablist" aria-label="Estimate sections">
              {sidebarSections.map(section => (
                <button
                  key={section.id}
                  role="tab"
                  aria-selected={activeSection === section.id}
                  aria-controls={`panel-${section.id}`}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg 
                    text-sm font-medium transition-colors
                    ${activeSection === section.id 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className={activeSection === section.id ? section.color : 'text-gray-400'}>
                      {section.icon}
                    </span>
                    <span>{section.label}</span>
                  </div>
                  {section.count !== undefined && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                      {section.count}
                    </Badge>
                  )}
                  {section.badge && !section.count && (
                    <Badge 
                      className={`text-[10px] px-1.5 py-0 h-5 ${
                        section.badge === 'Ready' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {section.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
            
            {/* Quality Summary in Sidebar */}
            <div className="mt-6">
              <p className="text-xs font-medium text-gray-700 mb-2 px-3">Quality Distribution</p>
              <div className="px-3 space-y-1.5">
                {(['blue', 'green', 'yellow', 'red'] as QualityGrade[]).map(grade => {
                  const count = wbsElements.filter(el => el.qualityGrade === grade).length
                  const config = QUALITY_GRADE_CONFIG[grade]
                  const percentage = wbsElements.length > 0 ? (count / wbsElements.length) * 100 : 0
                  
                  return (
                    <div key={grade} className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ 
                          backgroundColor: grade === 'blue' ? '#3b82f6' : 
                                          grade === 'green' ? '#22c55e' : 
                                          grade === 'yellow' ? '#eab308' : '#ef4444'
                        }}
                        aria-hidden="true"
                      />
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            grade === 'blue' ? 'bg-blue-500' : 
                            grade === 'green' ? 'bg-green-500' : 
                            grade === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 w-4 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Info Box */}
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium text-blue-900 mb-1">DCAA-Ready Estimates</p>
                  <p className="text-xs text-blue-800">
                    Green/Blue grades pass government audits. Yellow needs work. Red will be questioned.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main 
          className="flex-1 min-w-0"
          role="tabpanel"
          id={`panel-${activeSection}`}
          aria-labelledby={activeSection}
        >
          {activeSection === 'overview' && renderOverview()}
          {activeSection === 'elements' && renderElementsList()}
          {activeSection === 'labor' && renderLaborSummary()}
          {activeSection === 'export' && renderExport()}
        </main>
        
        {/* Element Slideout */}
        {renderElementSlideout()}
      </div>
    </TooltipProvider>
  )
}

export default EstimateTab